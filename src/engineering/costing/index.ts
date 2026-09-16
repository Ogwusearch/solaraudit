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
