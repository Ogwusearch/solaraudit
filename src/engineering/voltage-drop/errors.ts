/**
 * SolarAudit — Voltage Drop Engine: Error & Warning Messages
 */

export const ERROR_INVALID_CURRENT =
  "currentA must be > 0.";

export const ERROR_INVALID_LENGTH =
  "lengthM must be > 0.";

export const ERROR_INVALID_VOLTAGE =
  "systemVoltageV must be > 0.";

export const ERROR_INVALID_MATERIAL =
  "material must be 'copper' or 'aluminium'.";

export const ERROR_INVALID_CIRCUIT_TYPE =
  "circuitType must be 'dc', 'ac-single-phase', or 'ac-three-phase'.";

export const ERROR_INVALID_AREA =
  "conductorAreaMm2 must be > 0 when provided.";

export const ERROR_INVALID_TARGET_DROP =
  "targetDropPercent must be > 0 when provided.";

export const ERROR_INVALID_CONDUCTOR_TEMP =
  "conductorTempC must be between 30 and 120 °C when provided.";

export const ERROR_INVALID_POWER_FACTOR =
  "powerFactor must be between 0.1 and 1.0 when provided.";

export const ERROR_INVALID_REACTANCE =
  "reactanceOhmPerKm must be >= 0 when provided.";

export const ERROR_NO_MODE =
  "At least one of conductorAreaMm2 (forward) or targetDropPercent (inverse) must be provided.";

export const ERROR_TARGET_UNREACHABLE =
  "targetDropPercent cannot be met at any realistic conductor area.";

export const WARN_HIGH_DROP = (value: number): string =>
  `Voltage drop is high (${value} %). Verify with equipment tolerances.`;

export const WARN_VERY_HIGH_DROP = (value: number): string =>
  `Voltage drop is very high (${value} %). Equipment may misoperate.`;

export const WARN_LONG_RUN = (value: number): string =>
  `Cable run is long (${value} m). Consider a higher system voltage.`;

export const WARN_TINY_AREA = (value: number): string =>
  `Calculated conductor area (${value} mm²) is below typical minimum sizes; verify current-carrying capacity separately.`;

export const WARN_HUGE_AREA = (value: number): string =>
  `Calculated conductor area (${value} mm²) is very large; consider parallel runs or higher voltage.`;

export const WARN_NO_TARGET = (value: number): string =>
  `Voltage drop (${value} %) computed without a target; set targetDropPercent to get a pass/fail verdict.`;

export const WARN_NON_UNITY_PF_AC =
  "Non-unity power factor on an AC circuit increases drop; reactance is approximated.";

export const WARN_REACTANCE_IGNORED =
  "Reactance not provided; drop is computed from resistance alone (valid for small cables and short runs).";
