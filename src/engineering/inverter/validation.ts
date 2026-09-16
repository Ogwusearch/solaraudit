/**
 * SolarAudit — Inverter Engine: Validation
 *
 * Collects ALL errors.
 * Never throws.
 * Returns string[] (empty == valid).
 */

import type { InverterInput } from "./types";

import {
  MIN_DESIGN_MARGIN,
  MAX_DESIGN_MARGIN,
  MIN_INVERTER_EFFICIENCY,
  MAX_INVERTER_EFFICIENCY,
  MIN_POWER_FACTOR,
  MAX_POWER_FACTOR,
  SUPPORTED_SYSTEM_VOLTAGES,
} from "./constants";

import {
  ERROR_INVALID_CONTINUOUS_LOAD,
  ERROR_INVALID_PEAK_LOAD,
  ERROR_INVALID_SURGE_LOAD,
  ERROR_INVALID_SYSTEM_VOLTAGE,
  ERROR_INVALID_OUTPUT_VOLTAGE,
  ERROR_INVALID_OUTPUT_FREQUENCY,
  ERROR_INVALID_POWER_FACTOR,
  ERROR_INVALID_DESIGN_MARGIN,
  ERROR_INVALID_EFFICIENCY,
  ERROR_INVALID_SURGE_DURATION,
  ERROR_INVALID_MAX_DC_CURRENT,
} from "./errors";

function isSupportedSystemVoltage(
  voltage: number,
): boolean {
  return SUPPORTED_SYSTEM_VOLTAGES.some(
    (supportedVoltage) =>
      supportedVoltage === voltage,
  );
}

export function validateInput(
  input: InverterInput,
): string[] {
  const errors: string[] = [];

  // ---------------------------------------------------------------------------
  // Load validation
  // ---------------------------------------------------------------------------

  if (
    !Number.isFinite(input.continuousLoadW) ||
    input.continuousLoadW <= 0
  ) {
    errors.push(
      ERROR_INVALID_CONTINUOUS_LOAD,
    );
  }

  if (
    !Number.isFinite(input.peakLoadW) ||
    input.peakLoadW < input.continuousLoadW
  ) {
    errors.push(
      ERROR_INVALID_PEAK_LOAD,
    );
  }

  if (
    !Number.isFinite(input.surgeLoadW) ||
    input.surgeLoadW < input.peakLoadW
  ) {
    errors.push(
      ERROR_INVALID_SURGE_LOAD,
    );
  }

  // ---------------------------------------------------------------------------
  // DC system voltage
  // ---------------------------------------------------------------------------

  if (
    !Number.isFinite(input.systemVoltage) ||
    input.systemVoltage <= 0
  ) {
    errors.push(
      ERROR_INVALID_SYSTEM_VOLTAGE,
    );
  }

  // ---------------------------------------------------------------------------
  // AC output configuration
  // ---------------------------------------------------------------------------

  if (
    !Number.isFinite(input.outputVoltage) ||
    input.outputVoltage <= 0
  ) {
    errors.push(
      ERROR_INVALID_OUTPUT_VOLTAGE,
    );
  }

  if (
    !Number.isFinite(input.outputFrequency) ||
    input.outputFrequency <= 0
  ) {
    errors.push(
      ERROR_INVALID_OUTPUT_FREQUENCY,
    );
  }

  // ---------------------------------------------------------------------------
  // Power factor
  // ---------------------------------------------------------------------------

  if (
    !Number.isFinite(input.powerFactor) ||
    input.powerFactor < MIN_POWER_FACTOR ||
    input.powerFactor > MAX_POWER_FACTOR
  ) {
    errors.push(
      ERROR_INVALID_POWER_FACTOR,
    );
  }

  // ---------------------------------------------------------------------------
  // Design margin
  // ---------------------------------------------------------------------------

  if (
    !Number.isFinite(input.designMargin) ||
    input.designMargin < MIN_DESIGN_MARGIN ||
    input.designMargin > MAX_DESIGN_MARGIN
  ) {
    errors.push(
      ERROR_INVALID_DESIGN_MARGIN,
    );
  }

  // ---------------------------------------------------------------------------
  // Inverter efficiency
  // ---------------------------------------------------------------------------

  if (
    !Number.isFinite(input.inverterEfficiency) ||
    input.inverterEfficiency <
      MIN_INVERTER_EFFICIENCY ||
    input.inverterEfficiency >
      MAX_INVERTER_EFFICIENCY
  ) {
    errors.push(
      ERROR_INVALID_EFFICIENCY,
    );
  }

  // ---------------------------------------------------------------------------
  // Optional surge duration
  // ---------------------------------------------------------------------------

  if (
    input.surgeDurationSec !== undefined &&
    (
      !Number.isFinite(
        input.surgeDurationSec,
      ) ||
      input.surgeDurationSec < 0
    )
  ) {
    errors.push(
      ERROR_INVALID_SURGE_DURATION,
    );
  }

  // ---------------------------------------------------------------------------
  // Optional DC current limit
  // ---------------------------------------------------------------------------

  if (
    input.maxDcInputCurrentA !== undefined &&
    (
      !Number.isFinite(
        input.maxDcInputCurrentA,
      ) ||
      input.maxDcInputCurrentA <= 0
    )
  ) {
    errors.push(
      ERROR_INVALID_MAX_DC_CURRENT,
    );
  }

  return errors;
}