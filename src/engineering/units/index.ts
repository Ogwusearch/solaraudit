/**
 * SolarAudit — Units Engine: Public API
 *
 * Boundary:
 *   Input -> Validation -> Calculation -> Engineering Result
 *
 * Same-dimension conversions are always safe (given valid unit names).
 * Cross-dimension conversions require an extra parameter:
 *   W ↔ VA   requires powerFactor
 *   Wh ↔ Ah  requires systemVoltage
 *
 * isValid reflects BOTH structural validity and conversion viability.
 */

import type { ConversionInput, ConversionResult } from "./types";
import { validateInput } from "./validation";
import { calculateInternal } from "./calculation";

export * from "./types";

export function convertUnit(input: ConversionInput): ConversionResult {
  const errors = validateInput(input);

  if (errors.length > 0) {
    return {
      value: 0,
      from: input.from,
      to: input.to,
      originalValue: input.value,
      fromDimension: input.from ? ({} as never) : ({} as never),
      toDimension: ({} as never),
      warnings: [],
      errors,
      isValid: false,
    };
  }

  return calculateInternal(input);
}
