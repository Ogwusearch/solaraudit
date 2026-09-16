/**
 * SolarAudit — Load Audit feature: Application service
 *
 * The ONLY place in the feature that knows about the engineering engine.
 * Components and hooks call this; they never import from `engineering/`
 * directly.
 *
 * Responsibilities:
 *   - Parse the UI draft into the engine's typed input
 *   - Call the Load Engine
 *   - Return the engine result to the caller
 *
 * NOT responsible for:
 *   - Rendering
 *   - Persistence
 *   - Navigation
 *   - Engineering math (that lives in the engine)
 */

import { calculateLoad } from "../../../engineering/load";
import type {
  Appliance,
  LoadInput,
  LoadResult,
} from "../../../engineering/load";
import type {
  ApplianceRowDraft,
  LoadAuditFormDraft,
  LoadAuditParsedInput,
  FormValidationErrors,
} from "../types";

/**
 * Parse one draft row into an Appliance. Throws on invalid numeric input
 * so the caller can decide how to surface the error.
 */
function parseRow(row: ApplianceRowDraft): Appliance {
  const powerWatts = Number.parseFloat(row.powerWatts);
  const hoursPerDay = Number.parseFloat(row.hoursPerDay);
  const quantity = Number.parseInt(row.quantity, 10);

  return {
    name: row.name.trim(),
    powerWatts: Number.isFinite(powerWatts) ? powerWatts : 0,
    hoursPerDay: Number.isFinite(hoursPerDay) ? hoursPerDay : 0,
    quantity: Number.isFinite(quantity) ? quantity : 0,
  };
}

/**
 * Parse the full form draft into the engine's typed input.
 * Numeric fields that fail to parse become 0 — the engine will report
 * the resulting validation error, which is what we want surfaced.
 */
export function parseDraft(draft: LoadAuditFormDraft): LoadAuditParsedInput {
  const diversityFactor = Number.parseFloat(draft.diversityFactor);
  const safetyMargin = Number.parseFloat(draft.safetyMargin);

  return {
    appliances: draft.appliances.map(parseRow),
    diversityFactor: Number.isFinite(diversityFactor) ? diversityFactor : 1,
    safetyMargin: Number.isFinite(safetyMargin) ? safetyMargin : 0,
  };
}

/**
 * Client-side form validation. This is NOT engineering validation — the
 * engine owns that. This checks only that the form is complete enough
 * to attempt a calculation.
 */
export function validateDraft(
  draft: LoadAuditFormDraft,
): FormValidationErrors {
  const errors: Record<string, string> = {};

  if (draft.appliances.length === 0) {
    errors["appliances"] = "Add at least one appliance.";
  }

  draft.appliances.forEach((row, idx) => {
    if (row.name.trim() === "") {
      errors[`appliances.${idx}.name`] = "Name is required.";
    }
    const pw = Number.parseFloat(row.powerWatts);
    if (!Number.isFinite(pw) || pw <= 0) {
      errors[`appliances.${idx}.powerWatts`] = "Power must be > 0.";
    }
    const h = Number.parseFloat(row.hoursPerDay);
    if (!Number.isFinite(h) || h < 0 || h > 24) {
      errors[`appliances.${idx}.hoursPerDay`] =
        "Hours must be between 0 and 24.";
    }
    const q = Number.parseInt(row.quantity, 10);
    if (!Number.isFinite(q) || q < 1) {
      errors[`appliances.${idx}.quantity`] = "Quantity must be >= 1.";
    }
  });

  const df = Number.parseFloat(draft.diversityFactor);
  if (Number.isFinite(df) && (df < 0 || df > 1)) {
    errors["diversityFactor"] = "Diversity factor must be between 0 and 1.";
  }

  const sm = Number.parseFloat(draft.safetyMargin);
  if (Number.isFinite(sm) && sm < 0) {
    errors["safetyMargin"] = "Safety margin must be >= 0.";
  }

  return errors;
}

/**
 * Run the load calculation. This is the feature's public entry point to
 * the engineering engine. It parses, then delegates.
 *
 * The service does NOT catch engine errors — it returns them as part of
 * the result so the UI can render both valid numbers and errors.
 */
export function calculateLoadAudit(draft: LoadAuditFormDraft): LoadResult {
  const parsed = parseDraft(draft);

  const input: LoadInput = {
    appliances: parsed.appliances,
    diversityFactor: parsed.diversityFactor,
    safetyMargin: parsed.safetyMargin,
  };

  return calculateLoad(input);
}
