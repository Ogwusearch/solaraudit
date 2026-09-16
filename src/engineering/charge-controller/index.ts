/**
 * SolarAudit — Charge Controller Engine: Public API
 *
 * Boundary:
 *   Input -> Validation -> Calculation -> Engineering Result
 *
 * NOTE: Unlike most engines, validation errors here come from TWO sources:
 *   1. Structural validation (missing/invalid fields) — short-circuits.
 *   2. Electrical compatibility checks (Voc, Isc, output current, PWM Vmp)
 *      — performed during calculation, so a structurally-valid input may
 *      still return isValid:false.
 */

import type {
  ChargeControllerInput,
  ChargeControllerResult,
} from "./types";
import { validateInput } from "./validation";
import { calculateInternal } from "./calculation";

export * from "./types";

export function calculateChargeController(
  input: ChargeControllerInput,
): ChargeControllerResult {
  const errors = validateInput(input);

  if (errors.length > 0) {
    return {
      requiredChargeCurrentA: 0,
      designChargeCurrentA: 0,
      minControllerCurrentA: 0,
      recommendedControllerCurrentA: 0,
      pvVoltageCompatible: false,
      pvCurrentCompatible: false,
      outputCurrentCompatible: false,
      recommendedStandardA: 0,
      technology: input.technology ?? "mppt",
      warnings: [],
      errors,
      isValid: false,
    };
  }

  return calculateInternal(input);
}
