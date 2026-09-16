
/**
 * SolarAudit — Energy Engine: Constants
 */

// -----------------------------------------------------------------------------
// Engineering Defaults
// -----------------------------------------------------------------------------

export const DEFAULT_PERFORMANCE_RATIO = 0.8;

export const DEFAULT_DEPTH_OF_DISCHARGE = 0.9;

export const DEFAULT_ROUND_TRIP_EFFICIENCY = 0.9;

export const DEFAULT_INITIAL_SOC = 0.5;

// -----------------------------------------------------------------------------
// Performance Ratio Limits
// -----------------------------------------------------------------------------

export const MIN_PERFORMANCE_RATIO = 0.0;

export const MAX_PERFORMANCE_RATIO = 1.0;

/**
 * Performance ratio below 60% generates a warning.
 */
export const LOW_PERFORMANCE_RATIO_THRESHOLD = 0.6;

// -----------------------------------------------------------------------------
// Battery SoC Limits
// -----------------------------------------------------------------------------

export const MIN_SOC = 0.0;

export const MAX_SOC = 1.0;

// -----------------------------------------------------------------------------
// Self-Consumption
// -----------------------------------------------------------------------------

/**
 * Self-consumption below 30% generates a warning.
 */
export const LOW_SELF_CONSUMPTION_THRESHOLD = 0.3;

// -----------------------------------------------------------------------------
// Calculation Precision
// -----------------------------------------------------------------------------

export const ROUND_DECIMALS = 3;
