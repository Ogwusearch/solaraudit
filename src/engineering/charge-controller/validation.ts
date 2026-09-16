/**
 * SolarAudit — Charge Controller Engine: Validation
 *
 * Collects ALL errors.
 * Never throws.
 * Returns string[] (empty == valid).
 */

import type { ChargeControllerInput } from "./types";

import {
  MIN_DESIGN_MARGIN,
  MAX_DESIGN_MARGIN,
  MIN_CONTROLLER_EFFICIENCY,
  MAX_CONTROLLER_EFFICIENCY,
  SUPPORTED_BATTERY_VOLTAGES,
} from "./constants";

import {
  ERROR_INVALID_ARRAY_POWER,
  ERROR_INVALID_PV_VMP,
  ERROR_INVALID_PV_VOC,
  ERROR_INVALID_PV_IMP,
  ERROR_INVALID_PV_ISC,
  ERROR_INVALID_BATTERY_VOLTAGE,
  ERROR_INVALID_BATTERY_CAPACITY,
  ERROR_INVALID_TECHNOLOGY,
  ERROR_INVALID_DESIGN_MARGIN,
  ERROR_INVALID_EFFICIENCY,
  ERROR_INVALID_MAX_PV_VOLTAGE,
  ERROR_INVALID_MAX_PV_CURRENT,
  ERROR_INVALID_MAX_OUTPUT_CURRENT,
} from "./errors";

export function validateInput(
  input: ChargeControllerInput,
): string[] {
  const errors: string[] = [];

  // -----------------------------------------------------------------------
  // PV array
  // -----------------------------------------------------------------------

  if (
    !Number.isFinite(input.pvArrayKwp) ||
    input.pvArrayKwp <= 0
  ) {
    errors.push(ERROR_INVALID_ARRAY_POWER);
  }

  if (
    !Number.isFinite(input.pvVmp) ||
    input.pvVmp <= 0
  ) {
    errors.push(ERROR_INVALID_PV_VMP);
  }

  if (
    !Number.isFinite(input.pvVoc) ||
    input.pvVoc <= 0
  ) {
    errors.push(ERROR_INVALID_PV_VOC);
  }

  if (
    !Number.isFinite(input.pvImp) ||
    input.pvImp <= 0
  ) {
    errors.push(ERROR_INVALID_PV_IMP);
  }

  if (
    !Number.isFinite(input.pvIsc) ||
    input.pvIsc <= 0
  ) {
    errors.push(ERROR_INVALID_PV_ISC);
  }

  // -----------------------------------------------------------------------
  // Battery
  // -----------------------------------------------------------------------

  if (
    !Number.isFinite(input.batteryVoltage) ||
    input.batteryVoltage <= 0
  ) {
    errors.push(ERROR_INVALID_BATTERY_VOLTAGE);
  }

  if (
    !Number.isFinite(input.batteryCapacityAh) ||
    input.batteryCapacityAh <= 0
  ) {
    errors.push(ERROR_INVALID_BATTERY_CAPACITY);
  }

  // -----------------------------------------------------------------------
  // Controller technology
  // -----------------------------------------------------------------------

  if (
    input.technology !== "mppt" &&
    input.technology !== "pwm"
  ) {
    errors.push(ERROR_INVALID_TECHNOLOGY);
  }

  // -----------------------------------------------------------------------
  // Design margin
  // -----------------------------------------------------------------------

  if (
    !Number.isFinite(input.designMargin) ||
    input.designMargin < MIN_DESIGN_MARGIN ||
    input.designMargin > MAX_DESIGN_MARGIN
  ) {
    errors.push(ERROR_INVALID_DESIGN_MARGIN);
  }

  // -----------------------------------------------------------------------
  // Controller efficiency
  // -----------------------------------------------------------------------

  if (
    !Number.isFinite(input.controllerEfficiency) ||
    input.controllerEfficiency <
      MIN_CONTROLLER_EFFICIENCY ||
    input.controllerEfficiency >
      MAX_CONTROLLER_EFFICIENCY
  ) {
    errors.push(ERROR_INVALID_EFFICIENCY);
  }

  // -----------------------------------------------------------------------
  // Controller PV voltage limit
  // -----------------------------------------------------------------------

  if (
    input.maxPvInputVoltage !== undefined &&
    (
      !Number.isFinite(input.maxPvInputVoltage) ||
      input.maxPvInputVoltage <= 0
    )
  ) {
    errors.push(
      ERROR_INVALID_MAX_PV_VOLTAGE,
    );
  }

  // -----------------------------------------------------------------------
  // Controller PV current limit
  // -----------------------------------------------------------------------

  if (
    input.maxPvInputCurrentA !== undefined &&
    (
      !Number.isFinite(input.maxPvInputCurrentA) ||
      input.maxPvInputCurrentA <= 0
    )
  ) {
    errors.push(
      ERROR_INVALID_MAX_PV_CURRENT,
    );
  }

  // -----------------------------------------------------------------------
  // Controller output current limit
  // -----------------------------------------------------------------------

  if (
    input.maxOutputCurrentA !== undefined &&
    (
      !Number.isFinite(input.maxOutputCurrentA) ||
      input.maxOutputCurrentA <= 0
    )
  ) {
    errors.push(
      ERROR_INVALID_MAX_OUTPUT_CURRENT,
    );
  }

  return errors;
}