/**
 * SolarAudit — Solar Engine: Public API
 *
 * Boundary:
 *   Input -> Validation -> Calculation -> Engineering Result
 */

import type { SolarInput, SolarResult } from "./types";
import { validateInput } from "./validation";
import { calculateInternal } from "./calculation";

export * from "./types";

export function calculateSolar(input: SolarInput): SolarResult {
  const errors = validateInput(input);

  if (errors.length > 0) {
    return {
      requiredArrayKwp: 0,
      designArrayKwp: 0,
      totalPanels: 0,
      seriesPanels: 0,
      parallelStrings: 0,
      actualArrayKwp: 0,
      arrayVmp: 0,
      arrayImp: 0,
      arrayVoc: 0,
      arrayIsc: 0,
      warnings: [],
      errors,
      isValid: false,
    };
  }

  return calculateInternal(input);
}
