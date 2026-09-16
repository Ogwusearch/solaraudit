/**
 * SolarAudit — BOM Engine: Constants
 */

export const DEFAULT_RESERVE_PERCENT = 0.05;
export const MIN_RESERVE_PERCENT = 0.0;
export const MAX_RESERVE_PERCENT = 0.5;

// Cabling allowances (metres) — added on top of engineering cable runs
export const PV_STRING_CABLE_ALLOWANCE_M = 5;   // per string: connectors to combiner
export const BATTERY_INTERCONNECT_ALLOWANCE_M = 2; // per inter-cell link
export const AC_CABLE_ALLOWANCE_M = 3;          // per AC circuit
export const EARTHING_CABLE_ALLOWANCE_M = 10;   // fixed site minimum

// Physical constants used to estimate mounting / hardware counts
export const PANEL_AREA_M2_ESTIMATE = 2.0;      // ~400 W panel footprint
export const MID_CLAMPS_PER_PANEL = 2;
export const END_CLAMPS_PER_ROW = 2;
export const RAIL_OVERHANG_M = 0.4;

// Standard combiner / enclosure sizing
export const MAX_STRINGS_PER_COMBINER = 4;
export const MC4_PAIRS_PER_STRING = 1;
export const CABLE_GLAND_PER_BREAKER = 2;

// Warnings thresholds
export const HIGH_PARALLEL_STRINGS_WARN = 4;
export const LARGE_PANEL_COUNT_WARN = 40;

export const ROUND_DECIMALS = 3;
export const ROUND_DECIMALS_QTY = 2;
