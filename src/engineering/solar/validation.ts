 /**
  * SolarAudit — Solar Engine: Validation
  *
  * Collects ALL errors.
  * Never throws.
  * Returns string[] (empty == valid).
  */

import type { SolarInput } from "./types";

import {
  MIN_SYSTEM_EFFICIENCY,
  MAX_SYSTEM_EFFICIENCY,
  MIN_DESIGN_MARGIN,
  MAX_DESIGN_MARGIN,
  MIN_PSH,
  MAX_PSH,
} from "./constants";

import {
  ERROR_INVALID_DAILY_ENERGY,
  ERROR_INVALID_PSH,
  ERROR_INVALID_EFFICIENCY,
  ERROR_INVALID_MARGIN,
  ERROR_PANEL_RATED_POWER,
  ERROR_PANEL_VMP,
  ERROR_PANEL_IMP,
  ERROR_PANEL_VOC,
  ERROR_PANEL_ISC,
  ERROR_INVALID_MAX_SERIES,
  ERROR_INVALID_MAX_PARALLEL,
  ERROR_INVALID_MAX_VOC,
  ERROR_INVALID_MIN_VMP,
} from "./errors";

export function validateInput(input: SolarInput): string[] {
  const errors: string[] = [];

  // -----------------------------------------------------------------------
  // Energy input
  // -----------------------------------------------------------------------

  if (
    !Number.isFinite(input.dailyEnergyKwh) ||
    input.dailyEnergyKwh <= 0
  ) {
    errors.push(ERROR_INVALID_DAILY_ENERGY);
  }

  // -----------------------------------------------------------------------
  // Peak sun hours
  // -----------------------------------------------------------------------

  if (
    !Number.isFinite(input.peakSunHours) ||
    input.peakSunHours < MIN_PSH ||
    input.peakSunHours > MAX_PSH
  ) {
    errors.push(ERROR_INVALID_PSH);
  }

  // -----------------------------------------------------------------------
  // System efficiency
  // -----------------------------------------------------------------------

  if (
    !Number.isFinite(input.systemEfficiency) ||
    input.systemEfficiency < MIN_SYSTEM_EFFICIENCY ||
    input.systemEfficiency > MAX_SYSTEM_EFFICIENCY
  ) {
    errors.push(ERROR_INVALID_EFFICIENCY);
  }

  // -----------------------------------------------------------------------
  // Design margin
  // -----------------------------------------------------------------------

  if (
    !Number.isFinite(input.designMargin) ||
    input.designMargin < MIN_DESIGN_MARGIN ||
    input.designMargin > MAX_DESIGN_MARGIN
  ) {
    errors.push(ERROR_INVALID_MARGIN);
  }

  // -----------------------------------------------------------------------
  // Panel specification
  // -----------------------------------------------------------------------

  const p = input.panel;

  if (
    !Number.isFinite(p.ratedPowerWatts) ||
    p.ratedPowerWatts <= 0
  ) {
    errors.push(ERROR_PANEL_RATED_POWER);
  }

  if (
    !Number.isFinite(p.vmp) ||
    p.vmp <= 0
  ) {
    errors.push(ERROR_PANEL_VMP);
  }

  if (
    !Number.isFinite(p.imp) ||
    p.imp <= 0
  ) {
    errors.push(ERROR_PANEL_IMP);
  }

  if (
    !Number.isFinite(p.voc) ||
    p.voc <= 0
  ) {
    errors.push(ERROR_PANEL_VOC);
  }

  if (
    !Number.isFinite(p.isc) ||
    p.isc <= 0
  ) {
    errors.push(ERROR_PANEL_ISC);
  }

  // -----------------------------------------------------------------------
  // Series string limit
  // -----------------------------------------------------------------------

  if (
    input.maxSeriesPanels !== undefined &&
    (
      !Number.isInteger(input.maxSeriesPanels) ||
      input.maxSeriesPanels < 1
    )
  ) {
    errors.push(ERROR_INVALID_MAX_SERIES);
  }

  // -----------------------------------------------------------------------
  // Parallel string limit
  // -----------------------------------------------------------------------

  if (
    input.maxParallelStrings !== undefined &&
    (
      !Number.isInteger(input.maxParallelStrings) ||
      input.maxParallelStrings < 1
    )
  ) {
    errors.push(ERROR_INVALID_MAX_PARALLEL);
  }

  // -----------------------------------------------------------------------
  // Maximum array Voc
  // -----------------------------------------------------------------------

  if (
    input.maxArrayVoc !== undefined &&
    (
      !Number.isFinite(input.maxArrayVoc) ||
      input.maxArrayVoc <= 0
    )
  ) {
    errors.push(ERROR_INVALID_MAX_VOC);
  }

  // -----------------------------------------------------------------------
  // Minimum array Vmp
  // -----------------------------------------------------------------------

  if (
    input.minArrayVmp !== undefined &&
    (
      !Number.isFinite(input.minArrayVmp) ||
      input.minArrayVmp <= 0
    )
  ) {
    errors.push(ERROR_INVALID_MIN_VMP);
  }

  return errors;
}