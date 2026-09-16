/**
 * SolarAudit — Voltage Drop Engine: Validation
 *
 * Collects ALL errors. Never throws. Returns string[] (empty == valid).
 */

import type { VoltageDropInput } from "./types";
import {
  ERROR_INVALID_CURRENT,
  ERROR_INVALID_LENGTH,
  ERROR_INVALID_VOLTAGE,
  ERROR_INVALID_MATERIAL,
  ERROR_INVALID_CIRCUIT_TYPE,
  ERROR_INVALID_AREA,
  ERROR_INVALID_TARGET_DROP,
  ERROR_INVALID_CONDUCTOR_TEMP,
  ERROR_INVALID_POWER_FACTOR,
  ERROR_INVALID_REACTANCE,
  ERROR_NO_MODE,
} from "./errors";

export function validateInput(input: VoltageDropInput): string[] {
  const errors: string[] = [];

  if (input.currentA <= 0) errors.push(ERROR_INVALID_CURRENT);
  if (input.lengthM <= 0) errors.push(ERROR_INVALID_LENGTH);
  if (input.systemVoltageV <= 0) errors.push(ERROR_INVALID_VOLTAGE);

  if (input.material !== "copper" && input.material !== "aluminium") {
    errors.push(ERROR_INVALID_MATERIAL);
  }
  if (
    input.circuitType !== "dc" &&
    input.circuitType !== "ac-single-phase" &&
    input.circuitType !== "ac-three-phase"
  ) {
    errors.push(ERROR_INVALID_CIRCUIT_TYPE);
  }

  if (input.conductorAreaMm2 !== undefined && input.conductorAreaMm2 <= 0) {
    errors.push(ERROR_INVALID_AREA);
  }
  if (input.targetDropPercent !== undefined && input.targetDropPercent <= 0) {
    errors.push(ERROR_INVALID_TARGET_DROP);
  }

  if (
    input.conductorAreaMm2 === undefined &&
    input.targetDropPercent === undefined
  ) {
    errors.push(ERROR_NO_MODE);
  }

  if (
    input.conductorTempC !== undefined &&
    (input.conductorTempC < 30 || input.conductorTempC > 120)
  ) {
    errors.push(ERROR_INVALID_CONDUCTOR_TEMP);
  }

  if (
    input.powerFactor !== undefined &&
    (input.powerFactor < 0.1 || input.powerFactor > 1.0)
  ) {
    errors.push(ERROR_INVALID_POWER_FACTOR);
  }

  if (input.reactanceOhmPerKm !== undefined && input.reactanceOhmPerKm < 0) {
    errors.push(ERROR_INVALID_REACTANCE);
  }

  return errors;
}
