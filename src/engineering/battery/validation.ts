/**
 * SolarAudit — Battery Engine: Validation
 *
 * Collects ALL errors. Never throws. Returns string[] (empty == valid).
 */

import type { BatteryInput } from "./types";
import {
  ERROR_INVALID_DAILY_ENERGY,
  ERROR_INVALID_AUTONOMY,
  ERROR_INVALID_SYSTEM_VOLTAGE,
  ERROR_INVALID_DESIGN_MARGIN,
  ERROR_INVALID_TEMP_DERATING,
  ERROR_INVALID_DOD,
  ERROR_INVALID_RTE,
  ERROR_CELL_VOLTAGE,
  ERROR_CELL_CAPACITY,
  ERROR_CELL_DOD,
  ERROR_CELL_RTE,
  ERROR_INVALID_MAX_PARALLEL,
  ERROR_VOLTAGE_MISMATCH,
  ERROR_DOD_EXCEEDS_CELL,
} from "./errors";

export function validateInput(input: BatteryInput): string[] {
  const errors: string[] = [];

  if (input.dailyEnergyKwh <= 0) errors.push(ERROR_INVALID_DAILY_ENERGY);
  if (input.autonomyDays < 0) errors.push(ERROR_INVALID_AUTONOMY);
  if (input.systemVoltage <= 0) errors.push(ERROR_INVALID_SYSTEM_VOLTAGE);
  if (input.designMargin < 0) errors.push(ERROR_INVALID_DESIGN_MARGIN);
  if (input.temperatureDerating <= 0 || input.temperatureDerating > 1) {
    errors.push(ERROR_INVALID_TEMP_DERATING);
  }
  if (input.maxDepthOfDischarge <= 0 || input.maxDepthOfDischarge > 1) {
    errors.push(ERROR_INVALID_DOD);
  }
  if (input.roundTripEfficiency <= 0 || input.roundTripEfficiency > 1) {
    errors.push(ERROR_INVALID_RTE);
  }

  const c = input.cell;
  if (c.nominalVoltage <= 0) errors.push(ERROR_CELL_VOLTAGE);
  if (c.capacityAh <= 0) errors.push(ERROR_CELL_CAPACITY);
  if (c.maxDepthOfDischarge <= 0 || c.maxDepthOfDischarge > 1) {
    errors.push(ERROR_CELL_DOD);
  }
  if (c.roundTripEfficiency <= 0 || c.roundTripEfficiency > 1) {
    errors.push(ERROR_CELL_RTE);
  }

  if (
    input.maxParallelStrings !== undefined &&
    (!Number.isInteger(input.maxParallelStrings) || input.maxParallelStrings < 1)
  ) {
    errors.push(ERROR_INVALID_MAX_PARALLEL);
  }

  // Voltage compatibility
  if (
    c.nominalVoltage > 0 &&
    input.systemVoltage > 0 &&
    input.systemVoltage % c.nominalVoltage !== 0
  ) {
    errors.push(ERROR_VOLTAGE_MISMATCH);
  }

  // DoD compatibility
  if (
    input.maxDepthOfDischarge > 0 &&
    c.maxDepthOfDischarge > 0 &&
    input.maxDepthOfDischarge > c.maxDepthOfDischarge
  ) {
    errors.push(ERROR_DOD_EXCEEDS_CELL);
  }

  return errors;
}
