/**
 * SolarAudit — Costing Engine: Constants
 */

export const DEFAULT_WASTE_FACTOR = 0.0;
export const DEFAULT_PERCENT = 0.0;

// ---------------------------------------------------------------------------
// Validation limits
// ---------------------------------------------------------------------------

export const MIN_WASTE_FACTOR = 0.0;
export const MAX_WASTE_FACTOR = 1.0;

export const MIN_PERCENT = 0.0;
export const MAX_PERCENT = 100.0;

// ---------------------------------------------------------------------------
// Warning thresholds
// ---------------------------------------------------------------------------

// Waste factor is stored as a fraction.
// 0.15 = 15%
export const HIGH_WASTE_THRESHOLD = 0.15;

// Percentage fields are stored as percentages.
// 20 = 20%
export const HIGH_CONTINGENCY_THRESHOLD = 20.0;
export const HIGH_DISCOUNT_THRESHOLD = 25.0;

export const LOW_TAX_THRESHOLD = 0.0;
export const HIGH_TAX_THRESHOLD = 30.0;

// ---------------------------------------------------------------------------
// Currency
// ---------------------------------------------------------------------------

export const CURRENCY_PATTERN = /^[A-Z]{3}$/;

// ---------------------------------------------------------------------------
// Rounding
// ---------------------------------------------------------------------------

export const ROUND_DECIMALS = 2;
export const ROUND_DECIMALS_QTY = 3;