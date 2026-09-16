#!/usr/bin/env bash
# scaffold-costing-engine.sh
# Generates the SolarAudit Costing Engine module.

set -euo pipefail

ROOT="/home/ogwu/workspace/solaraudit/src/engineering/costing"

mkdir -p "$ROOT/__tests__"

# ----------------------------------------------------------------------
# types.ts
# ----------------------------------------------------------------------
cat > "$ROOT/types.ts" <<'EOF'
/**
 * SolarAudit — Costing Engine: Types
 *
 * Pure data definitions. No logic, no imports from siblings.
 *
 * Costing is financial, not electrical. A price change must never
 * affect a sizing result.
 */

export type CostCategory =
  | "pv-modules"
  | "batteries"
  | "inverter"
  | "charge-controller"
  | "dc-breakers"
  | "ac-breakers"
  | "fuses"
  | "spd"
  | "cables"
  | "connectors"
  | "busbars"
  | "enclosures"
  | "mounting"
  | "earthing"
  | "monitoring"
  | "labour"
  | "transport"
  | "engineering"
  | "other";

export interface CostLineItem {
  readonly category: CostCategory;
  readonly description: string;
  readonly quantity: number;      // >= 0
  readonly unitCost: number;      // in the project currency, >= 0
  readonly unit?: string;         // optional ("pcs", "m", "kg", ...)
}

export interface OverheadConfig {
  readonly contingencyPercent?: number;    // % of subtotal, default 0
  readonly installationPercent?: number;   // % of material subtotal, default 0
  readonly transportPercent?: number;      // % of material subtotal, default 0
  readonly engineeringPercent?: number;    // % of material subtotal, default 0
}

export interface CostingInput {
  readonly items: readonly CostLineItem[];
  readonly currency: string;                // ISO 4217, e.g. "NGN", "USD"
  readonly wasteFactor?: number;            // 0..1, default 0
  readonly overheads?: OverheadConfig;
  readonly discountPercent?: number;        // 0..100, default 0
  readonly taxPercent?: number;             // 0..100, default 0
}

export interface CostCategoryBreakdown {
  readonly category: CostCategory;
  readonly quantity: number;
  readonly extendedCost: number;
}

export interface CostingResult {
  readonly materialSubtotal: number;         // before waste
  readonly wasteCost: number;                // waste factor × material subtotal
  readonly adjustedMaterials: number;        // materialSubtotal + wasteCost

  readonly installationCost: number;
  readonly transportCost: number;
  readonly engineeringCost: number;
  readonly overheadsSubtotal: number;

  readonly contingencyCost: number;          // % of (adjustedMaterials + overheads)
  readonly preDiscountTotal: number;

  readonly discountAmount: number;
  readonly subtotalAfterDiscount: number;

  readonly taxAmount: number;
  readonly grandTotal: number;

  readonly categoryBreakdown: readonly CostCategoryBreakdown[];

  readonly currency: string;
  readonly warnings: readonly string[];
  readonly errors: readonly string[];
  readonly isValid: boolean;
}
EOF

# ----------------------------------------------------------------------
# constants.ts
# ----------------------------------------------------------------------
cat > "$ROOT/constants.ts" <<'EOF'
/**
 * SolarAudit — Costing Engine: Constants
 */

export const DEFAULT_WASTE_FACTOR = 0.0;
export const DEFAULT_PERCENT = 0.0;

export const MIN_WASTE_FACTOR = 0.0;
export const MAX_WASTE_FACTOR = 1.0;

export const MIN_PERCENT = 0.0;
export const MAX_PERCENT = 100.0;

export const HIGH_WASTE_THRESHOLD = 0.15;         // > 15% is unusual
export const HIGH_CONTINGENCY_THRESHOLD = 0.2;    // > 20% is unusual
export const HIGH_DISCOUNT_THRESHOLD = 25.0;      // > 25% discount
export const LOW_TAX_THRESHOLD = 0.0;             // warn if no tax
export const HIGH_TAX_THRESHOLD = 30.0;           // > 30% tax

export const CURRENCY_PATTERN = /^[A-Z]{3}$/;

export const ROUND_DECIMALS = 2;
export const ROUND_DECIMALS_QTY = 3;
EOF

# ----------------------------------------------------------------------
# errors.ts
# ----------------------------------------------------------------------
cat > "$ROOT/errors.ts" <<'EOF'
/**
 * SolarAudit — Costing Engine: Error & Warning Messages
 */

export const ERROR_NO_ITEMS =
  "At least one cost line item is required.";

export const errorInvalidQuantity = (idx: number, desc: string): string =>
  `Item[${idx}] '${desc}': quantity must be >= 0.`;

export const errorInvalidUnitCost = (idx: number, desc: string): string =>
  `Item[${idx}] '${desc}': unitCost must be >= 0.`;

export const ERROR_INVALID_CURRENCY =
  "currency must be a 3-letter ISO 4217 code (e.g. NGN, USD, EUR).";

export const ERROR_INVALID_WASTE_FACTOR =
  "wasteFactor must be between 0 and 1.";

export const ERROR_INVALID_DISCOUNT_PERCENT =
  "discountPercent must be between 0 and 100.";

export const ERROR_INVALID_TAX_PERCENT =
  "taxPercent must be between 0 and 100.";

export const errorInvalidOverhead = (name: string): string =>
  `${name} must be between 0 and 100 (percent).`;

export const WARN_HIGH_WASTE = (value: number): string =>
  `Waste factor is high (${value}). Verify material take-off.`;

export const WARN_HIGH_CONTINGENCY = (value: number): string =>
  `Contingency is high (${value}). Consider refining the design.`;

export const WARN_HIGH_DISCOUNT = (value: number): string =>
  `Discount is high (${value}%). Verify margin remains viable.`;

export const WARN_NO_TAX =
  "Tax rate is zero. Verify this is intentional for the project jurisdiction.";

export const WARN_HIGH_TAX = (value: number): string =>
  `Tax rate is high (${value}%). Confirm against local tax rules.`;

export const WARN_ZERO_TOTAL =
  "Grand total is zero. Verify all line items and percentages.";

export const WARN_EMPTY_CATEGORY = (category: string): string =>
  `Category '${category}' has zero total cost.`;
EOF

# ----------------------------------------------------------------------
# validation.ts
# ----------------------------------------------------------------------
cat > "$ROOT/validation.ts" <<'EOF'
/**
 * SolarAudit — Costing Engine: Validation
 *
 * Collects ALL errors. Never throws. Returns string[] (empty == valid).
 */

import type { CostingInput } from "./types";
import {
  ERROR_NO_ITEMS,
  errorInvalidQuantity,
  errorInvalidUnitCost,
  ERROR_INVALID_CURRENCY,
  ERROR_INVALID_WASTE_FACTOR,
  ERROR_INVALID_DISCOUNT_PERCENT,
  ERROR_INVALID_TAX_PERCENT,
  errorInvalidOverhead,
  CURRENCY_PATTERN,
} from "./errors";

export function validateInput(input: CostingInput): string[] {
  const errors: string[] = [];

  if (!input.items || input.items.length === 0) {
    errors.push(ERROR_NO_ITEMS);
  }

  input.items?.forEach((item, idx) => {
    if (item.quantity < 0) {
      errors.push(errorInvalidQuantity(idx, item.description));
    }
    if (item.unitCost < 0) {
      errors.push(errorInvalidUnitCost(idx, item.description));
    }
  });

  if (!input.currency || !CURRENCY_PATTERN.test(input.currency)) {
    errors.push(ERROR_INVALID_CURRENCY);
  }

  if (input.wasteFactor !== undefined) {
    if (input.wasteFactor < 0 || input.wasteFactor > 1) {
      errors.push(ERROR_INVALID_WASTE_FACTOR);
    }
  }

  if (input.discountPercent !== undefined) {
    if (input.discountPercent < 0 || input.discountPercent > 100) {
      errors.push(ERROR_INVALID_DISCOUNT_PERCENT);
    }
  }

  if (input.taxPercent !== undefined) {
    if (input.taxPercent < 0 || input.taxPercent > 100) {
      errors.push(ERROR_INVALID_TAX_PERCENT);
    }
  }

  const oh = input.overheads;
  if (oh) {
    if (oh.contingencyPercent !== undefined &&
        (oh.contingencyPercent < 0 || oh.contingencyPercent > 100)) {
      errors.push(errorInvalidOverhead("contingencyPercent"));
    }
    if (oh.installationPercent !== undefined &&
        (oh.installationPercent < 0 || oh.installationPercent > 100)) {
      errors.push(errorInvalidOverhead("installationPercent"));
    }
    if (oh.transportPercent !== undefined &&
        (oh.transportPercent < 0 || oh.transportPercent > 100)) {
      errors.push(errorInvalidOverhead("transportPercent"));
    }
    if (oh.engineeringPercent !== undefined &&
        (oh.engineeringPercent < 0 || oh.engineeringPercent > 100)) {
      errors.push(errorInvalidOverhead("engineeringPercent"));
    }
  }

  return errors;
}
EOF

# ----------------------------------------------------------------------
# calculation.ts
# ----------------------------------------------------------------------
cat > "$ROOT/calculation.ts" <<'EOF'
/**
 * SolarAudit — Costing Engine: Calculation
 *
 * Pure math. Assumes input is valid.
 *
 * Model:
 *   extended_i       = quantity_i × unitCost_i
 *   materialSubtotal = Σ extended_i
 *   wasteCost        = materialSubtotal × wasteFactor
 *   adjustedMaterials= materialSubtotal + wasteCost
 *
 *   installation     = adjustedMaterials × installationPercent / 100
 *   transport        = adjustedMaterials × transportPercent    / 100
 *   engineering      = adjustedMaterials × engineeringPercent  / 100
 *   overheadsSubtotal= installation + transport + engineering
 *
 *   contingencyBase  = adjustedMaterials + overheadsSubtotal
 *   contingencyCost  = contingencyBase × contingencyPercent / 100
 *   preDiscountTotal = contingencyBase + contingencyCost
 *
 *   discountAmount   = preDiscountTotal × discountPercent / 100
 *   subtotalAfter    = preDiscountTotal − discountAmount
 *
 *   taxAmount        = subtotalAfter × taxPercent / 100
 *   grandTotal       = subtotalAfter + taxAmount
 */

import type {
  CostCategory,
  CostCategoryBreakdown,
  CostingInput,
  CostingResult,
} from "./types";
import {
  DEFAULT_WASTE_FACTOR,
  HIGH_WASTE_THRESHOLD,
  HIGH_CONTINGENCY_THRESHOLD,
  HIGH_DISCOUNT_THRESHOLD,
  LOW_TAX_THRESHOLD,
  HIGH_TAX_THRESHOLD,
  ROUND_DECIMALS,
  ROUND_DECIMALS_QTY,
} from "./constants";
import {
  WARN_HIGH_WASTE,
  WARN_HIGH_CONTINGENCY,
  WARN_HIGH_DISCOUNT,
  WARN_NO_TAX,
  WARN_HIGH_TAX,
  WARN_ZERO_TOTAL,
} from "./errors";

function round(value: number, decimals = ROUND_DECIMALS): number {
  const factor = 10 ** decimals;
  return Math.round(value * factor) / factor;
}

export function calculateInternal(input: CostingInput): CostingResult {
  const warnings: string[] = [];

  const wasteFactor = input.wasteFactor ?? DEFAULT_WASTE_FACTOR;
  const discountPercent = input.discountPercent ?? 0;
  const taxPercent = input.taxPercent ?? 0;
  const oh = input.overheads ?? {};

  // ---- 1. Extend line items & build category breakdown ---------------
  const byCategory = new Map<CostCategory, CostCategoryBreakdown>();
  let materialSubtotal = 0;

  for (const item of input.items) {
    const extended = item.quantity * item.unitCost;
    materialSubtotal += extended;

    const existing = byCategory.get(item.category);
    if (existing) {
      byCategory.set(item.category, {
        category: item.category,
        quantity: round(existing.quantity + item.quantity, ROUND_DECIMALS_QTY),
        extendedCost: round(existing.extendedCost + extended),
      });
    } else {
      byCategory.set(item.category, {
        category: item.category,
        quantity: round(item.quantity, ROUND_DECIMALS_QTY),
        extendedCost: round(extended),
      });
    }
  }

  const categoryBreakdown = Array.from(byCategory.values())
    .sort((a, b) => b.extendedCost - a.extendedCost);

  // ---- 2. Waste --------------------------------------------------------
  const wasteCost = materialSubtotal * wasteFactor;
  const adjustedMaterials = materialSubtotal + wasteCost;

  // ---- 3. Overheads (% of adjusted materials) -------------------------
  const installationCost =
    adjustedMaterials * ((oh.installationPercent ?? 0) / 100);
  const transportCost =
    adjustedMaterials * ((oh.transportPercent ?? 0) / 100);
  const engineeringCost =
    adjustedMaterials * ((oh.engineeringPercent ?? 0) / 100);
  const overheadsSubtotal =
    installationCost + transportCost + engineeringCost;

  // ---- 4. Contingency --------------------------------------------------
  const contingencyBase = adjustedMaterials + overheadsSubtotal;
  const contingencyCost =
    contingencyBase * ((oh.contingencyPercent ?? 0) / 100);
  const preDiscountTotal = contingencyBase + contingencyCost;

  // ---- 5. Discount -----------------------------------------------------
  const discountAmount = preDiscountTotal * (discountPercent / 100);
  const subtotalAfterDiscount = preDiscountTotal - discountAmount;

  // ---- 6. Tax ----------------------------------------------------------
  const taxAmount = subtotalAfterDiscount * (taxPercent / 100);
  const grandTotal = subtotalAfterDiscount + taxAmount;

  // ---- 7. Warnings -----------------------------------------------------
  if (wasteFactor > HIGH_WASTE_THRESHOLD) {
    warnings.push(WARN_HIGH_WASTE(wasteFactor));
  }
  if ((oh.contingencyPercent ?? 0) > HIGH_CONTINGENCY_THRESHOLD * 100) {
    warnings.push(WARN_HIGH_CONTINGENCY((oh.contingencyPercent ?? 0) / 100));
  }
  if (discountPercent > HIGH_DISCOUNT_THRESHOLD) {
    warnings.push(WARN_HIGH_DISCOUNT(discountPercent));
  }
  if (taxPercent === LOW_TAX_THRESHOLD) {
    warnings.push(WARN_NO_TAX);
  } else if (taxPercent > HIGH_TAX_THRESHOLD) {
    warnings.push(WARN_HIGH_TAX(taxPercent));
  }
  if (grandTotal === 0) {
    warnings.push(WARN_ZERO_TOTAL);
  }

  return {
    materialSubtotal: round(materialSubtotal),
    wasteCost: round(wasteCost),
    adjustedMaterials: round(adjustedMaterials),
    installationCost: round(installationCost),
    transportCost: round(transportCost),
    engineeringCost: round(engineeringCost),
    overheadsSubtotal: round(overheadsSubtotal),
    contingencyCost: round(contingencyCost),
    preDiscountTotal: round(preDiscountTotal),
    discountAmount: round(discountAmount),
    subtotalAfterDiscount: round(subtotalAfterDiscount),
    taxAmount: round(taxAmount),
    grandTotal: round(grandTotal),
    categoryBreakdown,
    currency: input.currency,
    warnings,
    errors: [],
    isValid: true,
  };
}
EOF

# ----------------------------------------------------------------------
# index.ts
# ----------------------------------------------------------------------
cat > "$ROOT/index.ts" <<'EOF'
/**
 * SolarAudit — Costing Engine: Public API
 *
 * Boundary:
 *   Input -> Validation -> Calculation -> Engineering Result
 *
 * Costing is strictly financial. It does not change any sizing result.
 */

import type { CostingInput, CostingResult } from "./types";
import { validateInput } from "./validation";
import { calculateInternal } from "./calculation";

export * from "./types";

export function calculateCosting(input: CostingInput): CostingResult {
  const errors = validateInput(input);

  if (errors.length > 0) {
    return {
      materialSubtotal: 0,
      wasteCost: 0,
      adjustedMaterials: 0,
      installationCost: 0,
      transportCost: 0,
      engineeringCost: 0,
      overheadsSubtotal: 0,
      contingencyCost: 0,
      preDiscountTotal: 0,
      discountAmount: 0,
      subtotalAfterDiscount: 0,
      taxAmount: 0,
      grandTotal: 0,
      categoryBreakdown: [],
      currency: input.currency ?? "",
      warnings: [],
      errors,
      isValid: false,
    };
  }

  return calculateInternal(input);
}
EOF

# ----------------------------------------------------------------------
# __tests__/validation.test.ts
# ----------------------------------------------------------------------
cat > "$ROOT/__tests__/validation.test.ts" <<'EOF'
import { describe, it, expect } from "vitest";
import { validateInput } from "../validation";
import {
  ERROR_NO_ITEMS,
  ERROR_INVALID_CURRENCY,
  ERROR_INVALID_WASTE_FACTOR,
  ERROR_INVALID_DISCOUNT_PERCENT,
  ERROR_INVALID_TAX_PERCENT,
} from "../errors";

const item = {
  category: "pv-modules" as const,
  description: "400 W panel",
  quantity: 10,
  unitCost: 250,
};

const base = {
  items: [item],
  currency: "USD",
};

describe("validateInput", () => {
  it("accepts a valid input", () => {
    expect(validateInput(base)).toEqual([]);
  });

  it("rejects empty items", () => {
    expect(validateInput({ ...base, items: [] }))
      .toContain(ERROR_NO_ITEMS);
  });

  it("rejects bad currency", () => {
    expect(validateInput({ ...base, currency: "usd" }))
      .toContain(ERROR_INVALID_CURRENCY);
  });

  it("rejects negative quantity", () => {
    const bad = { ...item, quantity: -1 };
    const errs = validateInput({ ...base, items: [bad] });
    expect(errs.some((e) => /quantity/.test(e))).toBe(true);
  });

  it("rejects negative unitCost", () => {
    const bad = { ...item, unitCost: -1 };
    const errs = validateInput({ ...base, items: [bad] });
    expect(errs.some((e) => /unitCost/.test(e))).toBe(true);
  });

  it("rejects bad wasteFactor", () => {
    expect(validateInput({ ...base, wasteFactor: 1.5 }))
      .toContain(ERROR_INVALID_WASTE_FACTOR);
  });

  it("rejects bad discountPercent", () => {
    expect(validateInput({ ...base, discountPercent: 150 }))
      .toContain(ERROR_INVALID_DISCOUNT_PERCENT);
  });

  it("rejects bad taxPercent", () => {
    expect(validateInput({ ...base, taxPercent: 150 }))
      .toContain(ERROR_INVALID_TAX_PERCENT);
  });

  it("rejects bad overhead percent", () => {
    const errs = validateInput({
      ...base,
      overheads: { installationPercent: 150 },
    });
    expect(errs.some((e) => /installationPercent/.test(e))).toBe(true);
  });

  it("collects multiple errors", () => {
    const errs = validateInput({
      items: [],
      currency: "bad",
      wasteFactor: 2,
      taxPercent: 200,
    });
    expect(errs.length).toBeGreaterThanOrEqual(4);
  });
});
EOF

# ----------------------------------------------------------------------
# __tests__/calculation.test.ts
# ----------------------------------------------------------------------
cat > "$ROOT/__tests__/calculation.test.ts" <<'EOF'
import { describe, it, expect } from "vitest";
import { calculateInternal } from "../calculation";
import type { CostingInput } from "../types";

const baseInput: CostingInput = {
  items: [
    { category: "pv-modules", description: "Panel", quantity: 10, unitCost: 100 },
    { category: "batteries",  description: "LFP 100Ah", quantity: 4, unitCost: 500 },
  ],
  currency: "USD",
};

describe("calculateInternal", () => {
  it("sums material subtotal correctly", () => {
    // 10 × 100 + 4 × 500 = 3000
    const r = calculateInternal(baseInput);
    expect(r.materialSubtotal).toBe(3000);
  });

  it("applies waste factor to materials", () => {
    const r = calculateInternal({ ...baseInput, wasteFactor: 0.1 });
    expect(r.wasteCost).toBe(300);
    expect(r.adjustedMaterials).toBe(3300);
  });

  it("applies overhead percentages against adjusted materials", () => {
    const r = calculateInternal({
      ...baseInput,
      wasteFactor: 0.1,
      overheads: {
        installationPercent: 10,
        transportPercent: 5,
        engineeringPercent: 5,
      },
    });
    // adjusted = 3300
    // installation = 330, transport = 165, engineering = 165
    expect(r.installationCost).toBe(330);
    expect(r.transportCost).toBe(165);
    expect(r.engineeringCost).toBe(165);
    expect(r.overheadsSubtotal).toBe(660);
  });

  it("applies contingency to adjusted materials + overheads", () => {
    const r = calculateInternal({
      ...baseInput,
      wasteFactor: 0.1,
      overheads: {
        installationPercent: 10,
        transportPercent: 5,
        engineeringPercent: 5,
        contingencyPercent: 10,
      },
    });
    // base = 3300 + 660 = 3960; contingency = 396
    expect(r.contingencyCost).toBe(396);
    expect(r.preDiscountTotal).toBe(4356);
  });

  it("applies discount before tax", () => {
    const r = calculateInternal({
      ...baseInput,
      discountPercent: 10,
      taxPercent: 20,
    });
    // preDiscount = 3000; discount = 300; after = 2700; tax = 540; total = 3240
    expect(r.discountAmount).toBe(300);
    expect(r.subtotalAfterDiscount).toBe(2700);
    expect(r.taxAmount).toBe(540);
    expect(r.grandTotal).toBe(3240);
  });

  it("builds category breakdown", () => {
    const r = calculateInternal({
      ...baseInput,
      items: [
        { category: "pv-modules", description: "A", quantity: 5, unitCost: 100 },
        { category: "pv-modules", description: "B", quantity: 5, unitCost: 200 },
        { category: "cables",     description: "C", quantity: 20, unitCost: 5 },
      ],
      currency: "USD",
    });
    // PV total = 500 + 1000 = 1500
    // cables = 100
    const pv = r.categoryBreakdown.find((c) => c.category === "pv-modules");
    const cables = r.categoryBreakdown.find((c) => c.category === "cables");
    expect(pv?.extendedCost).toBe(1500);
    expect(pv?.quantity).toBe(10);
    expect(cables?.extendedCost).toBe(100);
  });

  it("sorts categories by extended cost descending", () => {
    const r = calculateInternal(baseInput);
    const [first, second] = r.categoryBreakdown;
    expect(first!.extendedCost).toBeGreaterThanOrEqual(second!.extendedCost);
  });

  it("warns on high waste factor", () => {
    const r = calculateInternal({ ...baseInput, wasteFactor: 0.2 });
    expect(r.warnings.some((w) => /waste/i.test(w))).toBe(true);
  });

  it("warns when tax is zero", () => {
    const r = calculateInternal(baseInput);
    expect(r.warnings.some((w) => /tax/i.test(w))).toBe(true);
  });

  it("warns on high discount", () => {
    const r = calculateInternal({ ...baseInput, discountPercent: 30 });
    expect(r.warnings.some((w) => /discount/i.test(w))).toBe(true);
  });

  it("zero items totals are zero", () => {
    const r = calculateInternal({
      items: [{ category: "other", description: "x", quantity: 0, unitCost: 0 }],
      currency: "USD",
    });
    expect(r.materialSubtotal).toBe(0);
    expect(r.grandTotal).toBe(0);
    expect(r.warnings.some((w) => /zero/i.test(w))).toBe(true);
  });
});
EOF

# ----------------------------------------------------------------------
# __tests__/integration.test.ts
# ----------------------------------------------------------------------
cat > "$ROOT/__tests__/integration.test.ts" <<'EOF'
import { describe, it, expect } from "vitest";
import { calculateCosting } from "../index";

describe("calculateCosting (public API)", () => {
  it("returns invalid on empty items", () => {
    const r = calculateCosting({ items: [], currency: "USD" });
    expect(r.isValid).toBe(false);
    expect(r.errors.length).toBeGreaterThan(0);
    expect(r.grandTotal).toBe(0);
  });

  it("returns invalid on bad currency", () => {
    const r = calculateCosting({
      items: [
        { category: "other", description: "x", quantity: 1, unitCost: 10 },
      ],
      currency: "dollars",
    });
    expect(r.isValid).toBe(false);
    expect(r.errors.length).toBeGreaterThan(0);
  });

  it("computes a full project cost with all components", () => {
    const r = calculateCosting({
      items: [
        { category: "pv-modules",        description: "400W",    quantity: 10,  unitCost: 180 },
        { category: "batteries",         description: "48V LFP", quantity: 4,   unitCost: 900 },
        { category: "inverter",          description: "5 kVA",   quantity: 1,   unitCost: 800 },
        { category: "charge-controller", description: "80A MPPT",quantity: 1,   unitCost: 350 },
        { category: "cables",            description: "25mm²",   quantity: 80,  unitCost: 6 },
      ],
      currency: "USD",
      wasteFactor: 0.08,
      overheads: {
        installationPercent: 12,
        transportPercent: 4,
        engineeringPercent: 6,
        contingencyPercent: 8,
      },
      discountPercent: 5,
      taxPercent: 7.5,
    });

    expect(r.isValid).toBe(true);
    expect(r.errors).toEqual([]);
    expect(r.materialSubtotal).toBeGreaterThan(0);
    expect(r.grandTotal).toBeGreaterThan(r.materialSubtotal);
    expect(r.categoryBreakdown.length).toBeGreaterThan(0);
    expect(r.currency).toBe("USD");
  });

  it("grand total equals subtotal + tax when no discount", () => {
    const r = calculateCosting({
      items: [
        { category: "other", description: "x", quantity: 1, unitCost: 100 },
      ],
      currency: "USD",
      taxPercent: 10,
    });
    expect(r.grandTotal).toBeCloseTo(r.subtotalAfterDiscount * 1.1, 2);
  });
});
EOF

echo "✔ Costing engine scaffolded at: $ROOT"
echo
if command -v tree >/dev/null 2>&1; then
  tree "$ROOT"
else
  find "$ROOT" -type f | sort
fi