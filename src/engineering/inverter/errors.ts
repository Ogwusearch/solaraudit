/**
 * SolarAudit — Inverter Engine: Error & Warning Messages
 */

// -----------------------------------------------------------------------------
// Input validation errors
// -----------------------------------------------------------------------------

export const ERROR_INVALID_CONTINUOUS_LOAD =
  "continuousLoadW must be finite and > 0.";

export const ERROR_INVALID_PEAK_LOAD =
  "peakLoadW must be finite and >= continuousLoadW.";

export const ERROR_INVALID_SURGE_LOAD =
  "surgeLoadW must be finite and >= peakLoadW.";

export const ERROR_INVALID_SYSTEM_VOLTAGE =
  "systemVoltage must be finite and > 0.";

export const ERROR_INVALID_OUTPUT_VOLTAGE =
  "outputVoltage must be finite and > 0.";

export const ERROR_INVALID_OUTPUT_FREQUENCY =
  "outputFrequency must be finite and > 0.";

export const ERROR_INVALID_POWER_FACTOR =
  "powerFactor must be between 0.1 and 1.0.";

export const ERROR_INVALID_DESIGN_MARGIN =
  "designMargin must be between 0.0 and 1.0.";

export const ERROR_INVALID_EFFICIENCY =
  "inverterEfficiency must be between 0.5 and 1.0.";

export const ERROR_INVALID_SURGE_DURATION =
  "surgeDurationSec must be finite and >= 0 when provided.";

export const ERROR_INVALID_MAX_DC_CURRENT =
  "maxDcInputCurrentA must be finite and > 0 when provided.";

// -----------------------------------------------------------------------------
// Engineering warnings
// -----------------------------------------------------------------------------

export const WARN_UNSUPPORTED_OUTPUT_VOLTAGE = (
  value: number,
): string =>
  `Output voltage ${value} V is unusual; typical values are 120 / 220 / 230 / 240 V.`;

export const WARN_UNSUPPORTED_FREQUENCY = (
  value: number,
): string =>
  `Output frequency ${value} Hz is unusual; typical values are 50 or 60 Hz.`;

export const WARN_LOW_EFFICIENCY = (
  value: number,
): string =>
  `Inverter efficiency is low (${value}). Higher losses are expected at full load.`;

export const WARN_LOW_POWER_FACTOR = (
  value: number,
): string =>
  `Power factor is low (${value}). VA rating requirement increases.`;

export const WARN_HIGH_SURGE_RATIO = (
  value: number,
): string =>
  `Surge-to-continuous ratio is high (${value}×). Verify motor-start and surge capability.`;

export const WARN_DC_CURRENT_EXCEEDS_LIMIT = (
  value: number,
): string =>
  `Calculated DC input current (${value} A) exceeds the configured limit.`;

export const WARN_NO_STANDARD_MATCH =
  "Required inverter capacity exceeds the standard size table; verify against the vendor catalogue.";