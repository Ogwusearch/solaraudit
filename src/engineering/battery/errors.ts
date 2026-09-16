/**
 * SolarAudit — Battery Engine: Error & Warning Messages
 */

// ---------------------------------------------------------------------------
// Input validation errors
// ---------------------------------------------------------------------------

export const ERROR_INVALID_DAILY_ENERGY =
  "dailyEnergyKwh must be > 0.";

export const ERROR_INVALID_AUTONOMY =
  "autonomyDays must be >= 0.";

export const ERROR_INVALID_SYSTEM_VOLTAGE =
  "systemVoltage must be > 0.";

export const ERROR_INVALID_DESIGN_MARGIN =
  "designMargin must be between 0 and 1.";

export const ERROR_INVALID_TEMP_DERATING =
  "temperatureDerating must be between 0.5 and 1.0.";

export const ERROR_INVALID_DOD =
  "maxDepthOfDischarge must be between 0 and 1.";

export const ERROR_INVALID_RTE =
  "roundTripEfficiency must be between 0 and 1.";

// ---------------------------------------------------------------------------
// Battery unit validation
// ---------------------------------------------------------------------------

export const ERROR_CELL_VOLTAGE =
  "cell.nominalVoltage must be > 0.";

export const ERROR_CELL_CAPACITY =
  "cell.capacityAh must be > 0.";

export const ERROR_CELL_DOD =
  "cell.maxDepthOfDischarge must be between 0 and 1.";

export const ERROR_CELL_RTE =
  "cell.roundTripEfficiency must be between 0 and 1.";

// ---------------------------------------------------------------------------
// Configuration validation
// ---------------------------------------------------------------------------

export const ERROR_INVALID_MAX_PARALLEL =
  "maxParallelStrings must be an integer >= 1 when provided.";

export const ERROR_VOLTAGE_MISMATCH =
  "systemVoltage must be an integer multiple of cell.nominalVoltage.";

export const ERROR_DOD_EXCEEDS_CELL =
  "Design DoD exceeds cell.maxDepthOfDischarge.";

export const ERROR_PARALLEL_LIMIT =
  "Required parallel strings exceed maxParallelStrings; battery capacity requirement cannot be met.";

// ---------------------------------------------------------------------------
// Warnings
// ---------------------------------------------------------------------------

export const WARN_HIGH_AUTONOMY = (
  days: number,
): string =>
  `Autonomy of ${days} days is high; battery cost will dominate the design.`;

export const WARN_LOW_TEMP_DERATING = (
  value: number,
): string =>
  `Temperature derating is low (${value}). Verify operating temperature assumptions.`;

export const WARN_HIGH_DOD = (
  value: number,
): string =>
  `Design DoD is high (${value}). Cycle life may be reduced.`;

export const WARN_UNSUPPORTED_SYSTEM_VOLTAGE = (
  value: number,
): string =>
  `systemVoltage ${value} V is unusual; typical values are 12 / 24 / 36 / 48 V.`;

export const WARN_PARALLEL_LIMIT =
  "Parallel string cap prevented an ideal configuration; consider larger cells.";