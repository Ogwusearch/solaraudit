/**
 * SolarAudit — Battery Engine: Constants
 */

export const DEFAULT_DESIGN_MARGIN = 0.1;
export const DEFAULT_TEMPERATURE_DERATING = 0.85;
export const DEFAULT_DOD = 0.5;
export const DEFAULT_RTE = 0.9;

export const MIN_DESIGN_MARGIN = 0.0;
export const MAX_DESIGN_MARGIN = 1.0;

export const MIN_TEMP_DERATING = 0.5;
export const MAX_TEMP_DERATING = 1.0;

export const MIN_DOD = 0.0;
export const MAX_DOD = 1.0;

export const MIN_RTE = 0.0;
export const MAX_RTE = 1.0;

export const SUPPORTED_SYSTEM_VOLTAGES = [
  12,
  24,
  36,
  48,
] as const;

export const HIGH_AUTONOMY_THRESHOLD = 3;
// > 3 days => warning

export const LOW_TEMP_DERATING_THRESHOLD = 0.7;

export const HIGH_DOD_THRESHOLD = 0.8;

export const ROUND_DECIMALS = 3;