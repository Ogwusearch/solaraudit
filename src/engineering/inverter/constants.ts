/**
 * SolarAudit — Inverter Engine: Constants
 *
 * Central configuration for inverter sizing,
 * validation, warnings, and standard equipment sizes.
 */

// -----------------------------------------------------------------------------
// Defaults
// -----------------------------------------------------------------------------

export const DEFAULT_DESIGN_MARGIN = 0.25;
export const DEFAULT_INVERTER_EFFICIENCY = 0.9;
export const DEFAULT_POWER_FACTOR = 0.8;

// -----------------------------------------------------------------------------
// Design margin
// -----------------------------------------------------------------------------

export const MIN_DESIGN_MARGIN = 0.0;
export const MAX_DESIGN_MARGIN = 1.0;

// -----------------------------------------------------------------------------
// Inverter efficiency
// -----------------------------------------------------------------------------

export const MIN_INVERTER_EFFICIENCY = 0.5;
export const MAX_INVERTER_EFFICIENCY = 1.0;

// -----------------------------------------------------------------------------
// Power factor
// -----------------------------------------------------------------------------

export const MIN_POWER_FACTOR = 0.1;
export const MAX_POWER_FACTOR = 1.0;

// -----------------------------------------------------------------------------
// DC system voltages
// -----------------------------------------------------------------------------

export const SUPPORTED_SYSTEM_VOLTAGES =
  [12, 24, 36, 48] as const;

// -----------------------------------------------------------------------------
// AC output voltages
// -----------------------------------------------------------------------------

export const SUPPORTED_OUTPUT_VOLTAGES =
  [120, 220, 230, 240] as const;

// -----------------------------------------------------------------------------
// AC output frequencies
// -----------------------------------------------------------------------------

export const SUPPORTED_FREQUENCIES =
  [50, 60] as const;

// -----------------------------------------------------------------------------
// Standard inverter sizes
// -----------------------------------------------------------------------------

export const STANDARD_INVERTER_SIZES_VA = [
  300,
  500,
  800,
  1000,
  1200,
  1500,
  2000,
  2500,
  3000,
  4000,
  5000,
  6000,
  8000,
  10000,
  12000,
  15000,
  20000,
] as const;

// -----------------------------------------------------------------------------
// Surge sizing
// -----------------------------------------------------------------------------

/**
 * Typical minimum surge-to-continuous-load ratio.
 */
export const SURGE_RATIO_MIN = 2.0;

/**
 * Typical upper surge-to-continuous-load ratio.
 */
export const SURGE_RATIO_MAX = 3.0;

/**
 * Warning threshold for unusually high surge requirements.
 */
export const HIGH_SURGE_RATIO_THRESHOLD = 3.0;

// -----------------------------------------------------------------------------
// Engineering warning thresholds
// -----------------------------------------------------------------------------

export const LOW_EFFICIENCY_THRESHOLD = 0.85;

export const LOW_POWER_FACTOR_THRESHOLD = 0.7;

// -----------------------------------------------------------------------------
// Output precision
// -----------------------------------------------------------------------------

export const ROUND_DECIMALS = 3;