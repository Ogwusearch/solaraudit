/**
 * SolarAudit — Cable Engine: Public API
 *
 * Boundary:
 *   Input -> Validation -> Calculation -> Engineering Result
 */

import type {
  CableInput,
  CableResult,
} from "./types";

import { validateInput } from "./validation";
import { calculateInternal } from "./calculation";

export * from "./types";

export function calculateCable(
  input: CableInput,
): CableResult {
  const errors = validateInput(input);

  // -------------------------------------------------------------------------
  // Validation failure
  // -------------------------------------------------------------------------

  if (errors.length > 0) {
    return {
      designCurrentA: 0,
      maxVoltageDropV: 0,

      calculatedAreaMm2: 0,
      ampacityAreaMm2: 0,
      requiredAreaMm2: 0,
      selectedAreaMm2: 0,

      actualVoltageDropV: 0,
      actualDropPercent: 0,

      resistanceOhmPerKm: 0,

      temperatureFactor: 0,
      groupingFactor: 0,
      deratedAmpacityA: 0,

      // Required by CableResult
      ampacityCompatible: false,
      voltageDropCompatible: false,

      warnings: [],
      errors,
      isValid: false,
    };
  }

  // -------------------------------------------------------------------------
  // Valid input -> pure engineering calculation
  // -------------------------------------------------------------------------

  return calculateInternal(input);
}