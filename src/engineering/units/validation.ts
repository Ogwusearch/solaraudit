/**
 * SolarAudit — Units Engine: Validation
 *
 * Structural validation of the ConversionInput. Collects ALL errors.
 * Never throws. Returns string[] (empty == valid).
 *
 * Cross-dimension compatibility checks are performed in calculation.ts.
 */

import type { ConversionInput } from "./types";
import {
  ERROR_INVALID_VALUE,
  errorUnknownUnit,
  ERROR_POWER_FACTOR_OUT_OF_RANGE,
  ERROR_SYSTEM_VOLTAGE_OUT_OF_RANGE,
} from "./errors";
import { DIMENSION_OF } from "./constants";

export function validateInput(input: ConversionInput): string[] {
  const errors: string[] = [];

  if (typeof input.value !== "number" || !Number.isFinite(input.value)) {
    errors.push(ERROR_INVALID_VALUE);
  }

  if (!(input.from in DIMENSION_OF)) {
    errors.push(errorUnknownUnit(String(input.from)));
  }
  if (!(input.to in DIMENSION_OF)) {
    errors.push(errorUnknownUnit(String(input.to)));
  }

  if (
    input.powerFactor !== undefined &&
    (input.powerFactor <= 0 || input.powerFactor > 1 || !Number.isFinite(input.powerFactor))
  ) {
    errors.push(ERROR_POWER_FACTOR_OUT_OF_RANGE);
  }

  if (
    input.systemVoltage !== undefined &&
    (input.systemVoltage <= 0 || !Number.isFinite(input.systemVoltage))
  ) {
    errors.push(ERROR_SYSTEM_VOLTAGE_OUT_OF_RANGE);
  }

  return errors;
}
