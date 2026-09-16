/**
 * SolarAudit — Cable Engine: Validation
 *
 * Collects ALL errors. Never throws.
 * Returns string[] (empty == valid).
 */

import type { CableInput } from "./types";
import {
  ERROR_INVALID_CURRENT,
  ERROR_INVALID_LENGTH,
  ERROR_INVALID_VOLTAGE,
  ERROR_INVALID_DROP,
  ERROR_INVALID_MATERIAL,
  ERROR_INVALID_CIRCUIT_TYPE,
  ERROR_INVALID_INSTALLATION,
  ERROR_INVALID_AMBIENT,
  ERROR_INVALID_CONDUCTOR_TEMP,
  ERROR_INVALID_GROUPING,
  ERROR_INVALID_DESIGN_MARGIN,
} from "./errors";

const VALID_INSTALLATIONS = new Set([
  "conduit",
  "cable-tray",
  "buried",
  "free-air",
  "enclosed",
]);

function isFiniteNumber(value: number): boolean {
  return Number.isFinite(value);
}

export function validateInput(input: CableInput): string[] {
  const errors: string[] = [];

  // -------------------------------------------------------------------------
  // Required numeric inputs
  // -------------------------------------------------------------------------

  if (
    !isFiniteNumber(input.currentA) ||
    input.currentA <= 0
  ) {
    errors.push(ERROR_INVALID_CURRENT);
  }

  if (
    !isFiniteNumber(input.lengthM) ||
    input.lengthM <= 0
  ) {
    errors.push(ERROR_INVALID_LENGTH);
  }

  if (
    !isFiniteNumber(input.systemVoltage) ||
    input.systemVoltage <= 0
  ) {
    errors.push(ERROR_INVALID_VOLTAGE);
  }

  if (
    !isFiniteNumber(input.allowableDropPercent) ||
    input.allowableDropPercent <= 0
  ) {
    errors.push(ERROR_INVALID_DROP);
  }

  // -------------------------------------------------------------------------
  // Enumerated inputs
  // -------------------------------------------------------------------------

  if (
    input.material !== "copper" &&
    input.material !== "aluminium"
  ) {
    errors.push(ERROR_INVALID_MATERIAL);
  }

  if (
    input.circuitType !== "dc" &&
    input.circuitType !== "ac-single-phase" &&
    input.circuitType !== "ac-three-phase"
  ) {
    errors.push(ERROR_INVALID_CIRCUIT_TYPE);
  }

  if (!VALID_INSTALLATIONS.has(input.installationMethod)) {
    errors.push(ERROR_INVALID_INSTALLATION);
  }

  // -------------------------------------------------------------------------
  // Optional temperature inputs
  // -------------------------------------------------------------------------

  if (
    input.ambientTemperatureC !== undefined &&
    (
      !isFiniteNumber(input.ambientTemperatureC) ||
      input.ambientTemperatureC < -20 ||
      input.ambientTemperatureC > 80
    )
  ) {
    errors.push(ERROR_INVALID_AMBIENT);
  }

  if (
    input.conductorTempC !== undefined &&
    (
      !isFiniteNumber(input.conductorTempC) ||
      input.conductorTempC < 30 ||
      input.conductorTempC > 120
    )
  ) {
    errors.push(ERROR_INVALID_CONDUCTOR_TEMP);
  }

  // -------------------------------------------------------------------------
  // Grouping
  // -------------------------------------------------------------------------

  if (
    input.groupingCount !== undefined &&
    (
      !Number.isInteger(input.groupingCount) ||
      input.groupingCount < 1
    )
  ) {
    errors.push(ERROR_INVALID_GROUPING);
  }

  // -------------------------------------------------------------------------
  // Design margin
  // -------------------------------------------------------------------------

  if (
    input.designMargin !== undefined &&
    (
      !isFiniteNumber(input.designMargin) ||
      input.designMargin < 0
    )
  ) {
    errors.push(ERROR_INVALID_DESIGN_MARGIN);
  }

  return errors;
}