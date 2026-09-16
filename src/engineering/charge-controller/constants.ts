/**
 * SolarAudit — Charge Controller Engine: Constants
 */

export const DEFAULT_DESIGN_MARGIN = 0.25;
export const DEFAULT_CONTROLLER_EFFICIENCY = 0.95;

export const MIN_DESIGN_MARGIN = 0.0;
export const MAX_DESIGN_MARGIN = 1.0;

export const MIN_CONTROLLER_EFFICIENCY = 0.7;
export const MAX_CONTROLLER_EFFICIENCY = 1.0;

export const STANDARD_CONTROLLER_CURRENTS_A = [
  5,
  10,
  15,
  20,
  25,
  30,
  40,
  50,
  60,
  70,
  80,
  100,
  120,
  150,
  200,
  250,
  300,
] as const;

export const SUPPORTED_BATTERY_VOLTAGES = [
  12,
  24,
  36,
  48,
] as const;

export const LOW_CONTROLLER_EFFICIENCY_THRESHOLD = 0.9;

/**
 * Warning threshold for PV Voc relative to controller maximum PV voltage.
 *
 * Example:
 *   PV Voc = 95 V
 *   Controller max = 100 V
 *   Ratio = 0.95
 */
export const HIGH_VOC_RATIO_THRESHOLD = 1.0;

/**
 * PV array below this size is considered potentially undersized.
 */
export const UNDERSIZED_ARRAY_THRESHOLD = 0.1;

export const ROUND_DECIMALS = 3;

/**
 * PWM array Vmp compatibility window.
 *
 * PV Vmp / battery voltage must remain within this range.
 */
export const PWM_VMP_MIN_RATIO = 0.8;
export const PWM_VMP_MAX_RATIO = 1.2;