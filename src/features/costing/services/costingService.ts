/**
 * SolarAudit — Costing feature: Application service
 *
 * The ONLY file in the feature that imports the engineering engine.
 */

import { calculateCosting } from "../../../engineering/costing";
import type {
  CostLineItem,
  CostingInput,
  CostingResult,
  OverheadConfig,
} from "../../../engineering/costing";
import type {
  CostingFormDraft,
  CostLineItemDraft,
  FormValidationErrors,
  OverheadsDraft,
} from "../types";

function parseNumber(value: string, fallback: number): number {
  const n = Number.parseFloat(value);
  return Number.isFinite(n) ? n : fallback;
}

function parseOptionalNumber(value: string): number | undefined {
  if (value.trim() === "") return undefined;
  const n = Number.parseFloat(value);
  return Number.isFinite(n) ? n : undefined;
}

function parseItem(item: CostLineItemDraft): CostLineItem {
  const unit = item.unit.trim();
  const base = {
    category: item.category,
    description: item.description.trim(),
    quantity: parseNumber(item.quantity, 0),
    unitCost: parseNumber(item.unitCost, 0),
  };
  return unit === "" ? base : { ...base, unit };
}

function parseOverheads(oh: OverheadsDraft): OverheadConfig {
  const i = parseOptionalNumber(oh.installationPercent);
  const t = parseOptionalNumber(oh.transportPercent);
  const e = parseOptionalNumber(oh.engineeringPercent);
  const c = parseOptionalNumber(oh.contingencyPercent);

  return {
    ...(i !== undefined ? { installationPercent: i } : {}),
    ...(t !== undefined ? { transportPercent: t } : {}),
    ...(e !== undefined ? { engineeringPercent: e } : {}),
    ...(c !== undefined ? { contingencyPercent: c } : {}),
  };
}

export function parseDraft(draft: CostingFormDraft): CostingInput {
  const waste = parseOptionalNumber(draft.wasteFactor);
  const discount = parseOptionalNumber(draft.discountPercent);
  const tax = parseOptionalNumber(draft.taxPercent);

  return {
    items: draft.items.map(parseItem),
    currency: draft.currency.trim().toUpperCase(),
    ...(waste !== undefined ? { wasteFactor: waste } : {}),
    ...(discount !== undefined ? { discountPercent: discount } : {}),
    ...(tax !== undefined ? { taxPercent: tax } : {}),
    overheads: parseOverheads(draft.overheads),
  };
}

/**
 * Form-level validation. Engineering validation is done by the engine.
 *
 * The engine requires ISO 4217 currency (3 uppercase letters). We accept
 * lowercase here and normalise in parseDraft, but the length must still
 * be exactly 3 alphabetic characters.
 */
export function validateDraft(
  draft: CostingFormDraft,
): FormValidationErrors {
  const errors: Record<string, string> = {};

  const cur = draft.currency.trim();
  if (!/^[A-Za-z]{3}$/.test(cur)) {
    errors["currency"] = "Currency must be a 3-letter ISO 4217 code.";
  }

  if (draft.items.length === 0) {
    errors["items"] = "Add at least one line item.";
  }

  draft.items.forEach((item, idx) => {
    if (item.description.trim() === "") {
      errors[`items.${idx}.description`] = "Description is required.";
    }
    const q = Number.parseFloat(item.quantity);
    if (!Number.isFinite(q) || q < 0) {
      errors[`items.${idx}.quantity`] = "Quantity must be >= 0.";
    }
    const c = Number.parseFloat(item.unitCost);
    if (!Number.isFinite(c) || c < 0) {
      errors[`items.${idx}.unitCost`] = "Unit cost must be >= 0.";
    }
  });

  if (draft.wasteFactor.trim() !== "") {
    const w = Number.parseFloat(draft.wasteFactor);
    if (!Number.isFinite(w) || w < 0 || w > 1) {
      errors["wasteFactor"] = "Waste factor must be between 0 and 1.";
    }
  }

  if (draft.discountPercent.trim() !== "") {
    const d = Number.parseFloat(draft.discountPercent);
    if (!Number.isFinite(d) || d < 0 || d > 100) {
      errors["discountPercent"] =
        "Discount must be between 0 and 100 percent.";
    }
  }

  if (draft.taxPercent.trim() !== "") {
    const t = Number.parseFloat(draft.taxPercent);
    if (!Number.isFinite(t) || t < 0 || t > 100) {
      errors["taxPercent"] = "Tax must be between 0 and 100 percent.";
    }
  }

  const oh = draft.overheads;
  const ohFields: Array<[keyof OverheadsDraft, string]> = [
    ["installationPercent", "Installation"],
    ["transportPercent", "Transport"],
    ["engineeringPercent", "Engineering"],
    ["contingencyPercent", "Contingency"],
  ];
  for (const [field, label] of ohFields) {
    const v = oh[field];
    if (v.trim() === "") continue;
    const n = Number.parseFloat(v);
    if (!Number.isFinite(n) || n < 0 || n > 100) {
      errors[`overheads.${field}`] =
        `${label} must be between 0 and 100 percent.`;
    }
  }

  return errors;
}

/**
 * Run the costing calculation. Feature's public entry point.
 */
export function calculateCostingFromDraft(
  draft: CostingFormDraft,
): CostingResult {
  const input = parseDraft(draft);
  return calculateCosting(input);
}
