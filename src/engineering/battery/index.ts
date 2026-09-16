/**
 * SolarAudit — Battery Engine: Public API
 *
 * Boundary:
 *   Input -> Validation -> Calculation -> Engineering Result
 */

import type { BatteryInput, BatteryResult } from "./types";
import { validateInput } from "./validation";
import { calculateInternal } from "./calculation";

export * from "./types";

export function calculateBattery(input: BatteryInput): BatteryResult {
  const errors = validateInput(input);

  if (errors.length > 0) {

    return {
  requiredCapacityKwh: 0,
  designCapacityKwh: 0,

  requiredParallelStrings: 0,

  totalCells: 0,
  seriesCells: 0,
  parallelStrings: 0,

  actualInstalledKwh: 0,
  actualUsableKwh: 0,

  bankVoltage: 0,
  bankCapacityAh: 0,
  maxChargeCurrentA: 0,

  warnings: [],
  errors,
  isValid: false,
};
  }

  return calculateInternal(input);
}
