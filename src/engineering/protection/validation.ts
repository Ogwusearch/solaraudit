/**
 * SolarAudit — Protection Engine: Validation
 *
 * Collects ALL errors. Never throws. Returns string[] (empty == valid).
 */

import type { ProtectionInput, CircuitRole, ProtectionTechnology } from "./types";
import {
  ERROR_INVALID_CURRENT,
  ERROR_INVALID_VOLTAGE,
  ERROR_INVALID_VOLTAGE_TYPE,
  ERROR_INVALID_ROLE,
  ERROR_INVALID_TECHNOLOGY,
  ERROR_INVALID_SAFETY_FACTOR,
  ERROR_INVALID_FAULT_CURRENT,
  ERROR_INVALID_DEVICE_VOLTAGE,
  ERROR_INVALID_DEVICE_INTERRUPT,
  ERROR_INVALID_DEVICE_CURRENT,
} from "./errors";

const VALID_ROLES: Set<CircuitRole> = new Set([
  "battery",
  "pv-string",
  "pv-array",
  "charge-controller",
  "inverter-dc",
  "inverter-ac",
  "ac-load",
  "ac-grid",
]);

const VALID_TECHNOLOGIES: Set<ProtectionTechnology> = new Set([
  "fuse",
  "mcb",
  "mccb",
  "dc-breaker",
  "dc-isolator",
  "spd",
  "rcd",
]);

export function validateInput(input: ProtectionInput): string[] {
  const errors: string[] = [];

  if (input.continuousCurrentA <= 0) errors.push(ERROR_INVALID_CURRENT);
  if (input.systemVoltageV <= 0) errors.push(ERROR_INVALID_VOLTAGE);
  if (input.voltageType !== "dc" && input.voltageType !== "ac") {
    errors.push(ERROR_INVALID_VOLTAGE_TYPE);
  }
  if (!VALID_ROLES.has(input.role)) errors.push(ERROR_INVALID_ROLE);
  if (!VALID_TECHNOLOGIES.has(input.technology)) {
    errors.push(ERROR_INVALID_TECHNOLOGY);
  }

  if (input.safetyFactor !== undefined && input.safetyFactor < 1.0) {
    errors.push(ERROR_INVALID_SAFETY_FACTOR);
  }
  if (
    input.availableFaultCurrentKa !== undefined &&
    input.availableFaultCurrentKa < 0
  ) {
    errors.push(ERROR_INVALID_FAULT_CURRENT);
  }
  if (
    input.deviceVoltageRatingV !== undefined &&
    input.deviceVoltageRatingV <= 0
  ) {
    errors.push(ERROR_INVALID_DEVICE_VOLTAGE);
  }
  if (
    input.deviceInterruptRatingKa !== undefined &&
    input.deviceInterruptRatingKa <= 0
  ) {
    errors.push(ERROR_INVALID_DEVICE_INTERRUPT);
  }
  if (
    input.deviceCurrentRatingA !== undefined &&
    input.deviceCurrentRatingA <= 0
  ) {
    errors.push(ERROR_INVALID_DEVICE_CURRENT);
  }

  return errors;
}
