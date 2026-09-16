/**
 * SolarAudit — Voltage Drop Engine: Public API
 *
 * Boundary:
 *   Input -> Validation -> Calculation -> Engineering Result
 *
 * Two modes are supported in one call:
 *   - forward  : conductorAreaMm2 provided -> compute voltage drop
 *   - inverse  : targetDropPercent provided -> solve minimum area
 *
 * Both may be provided together to compute drop AND solve the minimum
 * area in one call. At least one is required (structural validation).
 */

import type {
  VoltageDropInput,
  VoltageDropResult,
} from "./types";
import { validateInput } from "./validation";
import { calculateInternal } from "./calculation";

export * from "./types";

export function calculateVoltageDrop(
  input: VoltageDropInput,
): VoltageDropResult {
  const errors = validateInput(input);

  if (errors.length > 0) {
    return {
      voltageDropV: 0,
      voltageDropPercent: 0,
      resistanceOhmPerKm: 0,
      resistanceOhm: 0,
      powerLossW: 0,
      calculatedMinAreaMm2: 0,
      withinTarget: false,
      conductorTempC: input.conductorTempC ?? 70,
      effectivePowerFactor: input.powerFactor ?? 1.0,
      circuitFactor: 0,
      resistivityOhmMm2PerM: 0,
      warnings: [],
      errors,
      isValid: false,
    };
  }

  return calculateInternal(input);
}
