/**
 * SolarAudit — Voltage Drop Engine: Constants
 */

// Resistivity at 20 °C, Ω·mm²/m
export const RESISTIVITY_20C: Record<string, number> = {
  copper: 0.017241,
  aluminium: 0.028264,
};

// Temperature coefficient of resistance, per °C
export const ALPHA_20C: Record<string, number> = {
  copper: 0.00393,
  aluminium: 0.00403,
};

// Circuit-type factor on (I × L × R)
//   dc / single-phase: 2 (go + return)
//   three-phase      : √3 (line-to-line drop)
export const CIRCUIT_FACTOR: Record<string, number> = {
  dc: 2,
  "ac-single-phase": 2,
  "ac-three-phase": Math.sqrt(3),
};

export const DEFAULT_CONDUCTOR_TEMP_C = 70;   // PVC insulated
export const DEFAULT_POWER_FACTOR = 1.0;

export const MIN_POWER_FACTOR = 0.1;
export const MAX_POWER_FACTOR = 1.0;

// Warning thresholds
export const HIGH_DROP_PERCENT = 3;
export const VERY_HIGH_DROP_PERCENT = 5;

export const HIGH_AMBIENT_TEMP_C = 45;
export const LONG_RUN_M = 100;

export const TINY_AREA_MM2 = 1.0;   // below this, physically unusual for this current
export const HUGE_AREA_MM2 = 630;   // above this, consider parallel runs

export const ROUND_DECIMALS = 4;
export const ROUND_DECIMALS_AREA = 4;
