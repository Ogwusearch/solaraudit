/**
 * SolarAudit — Protection Engine: Public API
 *
 * Boundary:
 *   Input -> Validation -> Calculation -> Engineering Result
 *
 * Like the Charge Controller Engine, electrical compatibility checks
 * (device voltage / interrupt / current ratings) run during calculation,
 * so a structurally-valid input can still return isValid:false when a
 * candidate device is under-rated for the circuit.
 */

import type { ProtectionInput, ProtectionResult } from "./types";
import { validateInput } from "./validation";
import { calculateInternal } from "./calculation";

export * from "./types";

export function calculateProtection(
  input: ProtectionInput,
): ProtectionResult {
  const errors = validateInput(input);

  if (errors.length > 0) {
    return {
      role: input.role,
      technology: input.technology,
      designCurrentA: 0,
      recommendedRatingA: 0,
      minimumVoltageRatingV: 0,
      minimumInterruptRatingKa: 0,
      voltageCompatible: false,
      interruptCompatible: false,
      currentRatingSufficient: false,
      selectedRatingA: 0,
      warnings: [],
      errors,
      isValid: false,
    };
  }

  return calculateInternal(input);
}
