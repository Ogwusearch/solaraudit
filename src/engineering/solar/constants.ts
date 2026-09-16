/**
 * SolarAudit — Solar Engine: Constants
 */

export const DEFAULT_SYSTEM_EFFICIENCY = 0.75;
export const DEFAULT_DESIGN_MARGIN = 0.25;

export const MIN_SYSTEM_EFFICIENCY = 0.1;
export const MAX_SYSTEM_EFFICIENCY = 1.0;

export const MIN_DESIGN_MARGIN = 0.0;
export const MAX_DESIGN_MARGIN = 2.0;

export const MIN_PSH = 0.0;
export const MAX_PSH = 24.0;

export const LOW_PSH_THRESHOLD = 3.0;
// < 3 PSH is marginal

export const HIGH_SERIES_STRING_THRESHOLD = 24;
// More than 24 panels in series requires additional electrical review.

export const ROUND_DECIMALS = 3;