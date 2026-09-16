
/**
 * SolarAudit — Load Engine Constants
 *
 * Centralized engineering constants used by the load calculation engine.
 */

/* ============================================================
 * Design Defaults
 * ============================================================ */

/**
 * Default diversity factor.
 *
 * 1.0 means no diversity reduction is applied.
 */
export const DEFAULT_DIVERSITY_FACTOR = 1.0;

/**
 * Default additional safety/design margin.
 *
 * 0.0 means no additional margin is applied by default.
 */
export const DEFAULT_SAFETY_MARGIN = 0.0;


/* ============================================================
 * Diversity Factor Limits
 * ============================================================ */

export const MIN_DIVERSITY_FACTOR = 0.0;
export const MAX_DIVERSITY_FACTOR = 1.0;

/**
 * Values below this threshold may be treated as
 * highly diversified loads by higher-level logic.
 */
export const LOW_DIVERSITY_THRESHOLD = 0.5;


/* ============================================================
 * Operating-Hour Limits
 * ============================================================ */

export const MIN_HOURS_PER_DAY = 0;
export const MAX_HOURS_PER_DAY = 24;

export const HOURS_PER_DAY = 24;


/* ============================================================
 * Numerical Precision
 * ============================================================ */

/**
 * Number of decimal places used when presenting
 * normalized load-engine results.
 */
export const ROUND_DECIMALS = 3;