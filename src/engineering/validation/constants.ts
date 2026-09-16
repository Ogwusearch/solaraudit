/**
 * SolarAudit — Validation Engine: Constants
 */

export const VOLTAGE_MATCH_TOLERANCE_V = 0.5;    // ±0.5 V for "match"
export const C_RATE_WARN_THRESHOLD = 0.5;        // charge/discharge below this warns
export const C_RATE_MIN_THRESHOLD = 0.2;         // below this is an error

export const ENERGY_SURPLUS_WARN_RATIO = 1.5;    // array > 150% of need
export const ENERGY_DEFICIT_WARN_RATIO = 0.9;    // array < 90% of need

export const AMPACITY_SAFETY_RATIO = 1.0;        // derated must be >= current
export const DROP_OVERSHOOT_WARN = 1.05;         // 5 % over target warns

export const PROTECTION_CURRENT_RATIO = 1.0;     // device >= design current
export const PROTECTION_VOLTAGE_RATIO = 1.0;     // device >= minimum voltage
export const PROTECTION_INTERRUPT_RATIO = 1.0;   // device >= fault current

export const PV_POWER_C_RATE_LOW = 0.3;          // kWp / battery kWh below warns
export const PV_POWER_C_RATE_HIGH = 1.0;         // kWp / battery kWh above warns

export const ROUND_DECIMALS = 4;
