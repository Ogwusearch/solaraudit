/**
 * SolarAudit — BOM Engine: Validation
 *
 * Collects ALL errors. Never throws. Returns string[] (empty == valid).
 */

import type { BomInput } from "./types";
import {
  ERROR_NO_PROJECT_NAME,
  ERROR_NEGATIVE_KWP,
  ERROR_INVALID_PANEL_POWER,
  ERROR_INVALID_PANEL_COUNT,
  ERROR_INVALID_BATTERY_CELLS,
  ERROR_INVALID_BATTERY_CELL_VOLTAGE,
  ERROR_INVALID_INVERTER_VA,
  ERROR_INVALID_CONTROLLER_CURRENT,
  ERROR_INVALID_RESERVE_PERCENT,
  errorInvalidCableLength,
  errorInvalidCableArea,
  errorInvalidProtectionRating,
} from "./errors";
import {
  MIN_RESERVE_PERCENT,
  MAX_RESERVE_PERCENT,
} from "./constants";

export function validateInput(input: BomInput): string[] {
  const errors: string[] = [];

  if (!input.projectName || input.projectName.trim() === "") {
    errors.push(ERROR_NO_PROJECT_NAME);
  }

  if (input.reservePercent !== undefined) {
    if (
      input.reservePercent < MIN_RESERVE_PERCENT ||
      input.reservePercent > MAX_RESERVE_PERCENT
    ) {
      errors.push(ERROR_INVALID_RESERVE_PERCENT);
    }
  }

  if (input.pv) {
    if (input.pv.arrayKwp < 0) errors.push(ERROR_NEGATIVE_KWP);
    if (input.pv.panelRatedWatts <= 0) errors.push(ERROR_INVALID_PANEL_POWER);
    if (
      !Number.isInteger(input.pv.totalPanels) ||
      input.pv.totalPanels < 0
    ) {
      errors.push(ERROR_INVALID_PANEL_COUNT);
    }
  }

  if (input.battery) {
    if (input.battery.cellVoltage <= 0) {
      errors.push(ERROR_INVALID_BATTERY_CELL_VOLTAGE);
    }
    if (
      !Number.isInteger(input.battery.totalCells) ||
      input.battery.totalCells < 0
    ) {
      errors.push(ERROR_INVALID_BATTERY_CELLS);
    }
  }

  if (input.inverter && input.inverter.recommendedVa <= 0) {
    errors.push(ERROR_INVALID_INVERTER_VA);
  }

  if (
    input.chargeController &&
    input.chargeController.recommendedCurrentA <= 0
  ) {
    errors.push(ERROR_INVALID_CONTROLLER_CURRENT);
  }

  input.cables?.forEach((c, idx) => {
    if (c.lengthM < 0) errors.push(errorInvalidCableLength(idx, c.role));
    if (c.selectedAreaMm2 <= 0) {
      errors.push(errorInvalidCableArea(idx, c.role));
    }
  });

  input.protections?.forEach((p, idx) => {
    if (p.selectedRatingA <= 0) {
      errors.push(errorInvalidProtectionRating(idx, p.role));
    }
  });

  return errors;
}
