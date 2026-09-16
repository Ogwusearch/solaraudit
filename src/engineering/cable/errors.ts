/**
 * SolarAudit — Cable Engine: Error & Warning Messages
 */

// ---------------------------------------------------------------------------
// Input validation errors
// ---------------------------------------------------------------------------

export const ERROR_INVALID_CURRENT =
  "currentA must be > 0.";

export const ERROR_INVALID_LENGTH =
  "lengthM must be > 0.";

export const ERROR_INVALID_VOLTAGE =
  "systemVoltage must be > 0.";

export const ERROR_INVALID_DROP =
  "allowableDropPercent must be > 0.";

export const ERROR_INVALID_MATERIAL =
  "material must be 'copper' or 'aluminium'.";

export const ERROR_INVALID_CIRCUIT_TYPE =
  "circuitType must be 'dc', 'ac-single-phase', or 'ac-three-phase'.";

export const ERROR_INVALID_INSTALLATION =
  "installationMethod is not recognised.";

export const ERROR_INVALID_AMBIENT =
  "ambientTemperatureC must be between -20 and 80 °C.";

export const ERROR_INVALID_CONDUCTOR_TEMP =
  "conductorTempC must be between 30 and 120 °C.";

export const ERROR_INVALID_GROUPING =
  "groupingCount must be an integer >= 1.";

export const ERROR_INVALID_DESIGN_MARGIN =
  "designMargin must be >= 0.";

// ---------------------------------------------------------------------------
// Model / sizing errors
// ---------------------------------------------------------------------------

export const ERROR_NO_STANDARD_AREA =
  "No standard conductor size is large enough; consider parallel runs.";

export const ERROR_TEMPERATURE_TABLE_RANGE =
  "Ambient temperature is outside the supported derating-table range.";

export const ERROR_GROUPING_TABLE_RANGE =
  "Grouping count is outside the supported grouping-derating table range.";

// ---------------------------------------------------------------------------
// Engineering warnings
// ---------------------------------------------------------------------------

export const WARN_HIGH_AMBIENT = (value: number): string =>
  `Ambient temperature is high (${value} °C); conductor derating is significant.`;

export const WARN_HIGH_DROP = (value: number): string =>
  `Allowable voltage drop is high (${value} %). Verify with equipment tolerances.`;

export const WARN_LONG_RUN = (value: number): string =>
  `Cable run is long (${value} m). Voltage drop will dominate the size selection.`;

export const WARN_HIGH_GROUPING = (value: number): string =>
  `${value} grouped circuits detected; grouping derating applied.`;

export const WARN_VOLTAGE_DROP_DOMINANT =
  "Voltage drop, not ampacity, is the sizing driver.";

export const WARN_ALUMINIUM_TERMINATION =
  "Aluminium conductors require compatible terminations and appropriate termination hardware.";

export const WARN_MARGIN_LARGE =
  "Design margin is large; selected size may be conservative.";

// ---------------------------------------------------------------------------
// Compatibility warnings
// ---------------------------------------------------------------------------

export const WARN_AMPACITY_DOMINANT =
  "Ampacity, not voltage drop, is the sizing driver.";

export const WARN_VOLTAGE_DROP_EXCEEDS_LIMIT =
  "Actual voltage drop exceeds the configured allowable limit.";

export const WARN_AMPACITY_EXCEEDS_LIMIT =
  "Selected conductor ampacity is below the required design current.";