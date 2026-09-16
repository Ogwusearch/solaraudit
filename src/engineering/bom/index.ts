/**
 * SolarAudit — BOM Engine: Public API
 *
 * Boundary:
 *   Input -> Validation -> Calculation -> Engineering Result
 *
 * The BOM Engine sits between engineering sizing (Solar, Battery,
 * Inverter, Cable, Protection) and financial costing (Costing Engine).
 * It produces a categorical material list with quantities but NO
 * pricing — pricing is the Costing Engine's job.
 */

import type { BomInput, BomResult } from "./types";
import { validateInput } from "./validation";
import { calculateInternal } from "./calculation";

export * from "./types";

export function calculateBom(input: BomInput): BomResult {
  const errors = validateInput(input);

  if (errors.length > 0) {
    return {
      projectName: input.projectName ?? "",
      items: [],
      itemCount: 0,
      totalQuantity: 0,
      categories: [],
      warnings: [],
      errors,
      isValid: false,
    };
  }

  return calculateInternal(input);
}
