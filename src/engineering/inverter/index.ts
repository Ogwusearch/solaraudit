/**
 * SolarAudit — Inverter Engine: Public API
 *
 * Boundary:
 *   Input -> Validation -> Calculation -> Engineering Result
 */

import type { InverterInput, InverterResult } from "./types";
import { validateInput } from "./validation";
import { calculateInternal } from "./calculation";

export * from "./types";

export function calculateInverter(input: InverterInput): InverterResult {
  const errors = validateInput(input);

  if (errors.length > 0) {
    return {
      continuousVa: 0,
      peakVa: 0,
      surgeVa: 0,
      minInverterVa: 0,
      recommendedInverterVa: 0,
      requiredSurgeVa: 0,
      dcInputCurrentA: 0,
      dcSurgeCurrentA: 0,
      recommendedStandardVa: 0,
      warnings: [],
      errors,
      isValid: false,
    };
  }

  return calculateInternal(input);
}
