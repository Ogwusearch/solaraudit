/**
 * SolarAudit — Charge Controller Engine: Error & Warning Messages
 */

// ---------------------------------------------------------------------------
// Input validation errors
// ---------------------------------------------------------------------------

export const ERROR_INVALID_ARRAY_POWER =
  "pvArrayKwp must be > 0.";

export const ERROR_INVALID_PV_VMP =
  "pvVmp must be > 0.";

export const ERROR_INVALID_PV_VOC =
  "pvVoc must be > 0.";

export const ERROR_INVALID_PV_IMP =
  "pvImp must be > 0.";

export const ERROR_INVALID_PV_ISC =
  "pvIsc must be > 0.";

export const ERROR_INVALID_BATTERY_VOLTAGE =
  "batteryVoltage must be > 0.";

export const ERROR_INVALID_BATTERY_CAPACITY =
  "batteryCapacityAh must be > 0.";

export const ERROR_INVALID_TECHNOLOGY =
  "technology must be 'mppt' or 'pwm'.";

export const ERROR_INVALID_DESIGN_MARGIN =
  "designMargin must be between 0.0 and 1.0.";

export const ERROR_INVALID_EFFICIENCY =
  "controllerEfficiency must be between 0.7 and 1.0.";

export const ERROR_INVALID_MAX_PV_VOLTAGE =
  "maxPvInputVoltage must be > 0 when provided.";

export const ERROR_INVALID_MAX_PV_CURRENT =
  "maxPvInputCurrentA must be > 0 when provided.";

export const ERROR_INVALID_MAX_OUTPUT_CURRENT =
  "maxOutputCurrentA must be > 0 when provided.";

// ---------------------------------------------------------------------------
// Electrical compatibility errors
// ---------------------------------------------------------------------------

export const ERROR_VOC_EXCEEDS_CONTROLLER = (
  voc: number,
  max: number,
): string =>
  `PV array Voc (${voc} V) exceeds controller maximum (${max} V).`;

export const ERROR_ISC_EXCEEDS_CONTROLLER = (
  isc: number,
  max: number,
): string =>
  `PV array Isc (${isc} A) exceeds controller maximum (${max} A).`;

export const ERROR_OUTPUT_EXCEEDS_CONTROLLER = (
  need: number,
  max: number,
): string =>
  `Required charge current (${need} A) exceeds controller output limit (${max} A).`;

export const ERROR_PWM_VOLTAGE_MISMATCH =
  "For PWM controllers, array Vmp must be within the configured battery-voltage compatibility range.";

// ---------------------------------------------------------------------------
// Warnings
// ---------------------------------------------------------------------------

export const WARN_LOW_EFFICIENCY = (
  value: number,
): string =>
  `Controller efficiency is low (${value}). Losses reduce available charging energy.`;

export const WARN_UNSUPPORTED_BATTERY_VOLTAGE = (
  value: number,
): string =>
  `Battery voltage ${value} V is unusual; typical values are 12 / 24 / 36 / 48 V.`;

export const WARN_NO_STANDARD_MATCH =
  "Required controller current exceeds the standard size table; verify against the vendor catalogue.";

export const WARN_ARRAY_OVERSIZED_FOR_VOLTAGE = (
  kwp: number,
  v: number,
): string =>
  `Array (${kwp} kWp) is large for a ${v} V battery bank; consider a higher-voltage battery system.`;

export const WARN_ARRAY_UNDERSIZED =
  "Array power is very small relative to the expected charging requirement; controller may be oversized.";

export const WARN_PWM_LOW_YIELD =
  "PWM controller does not track the array maximum power point; available PV energy may be lower than an equivalent MPPT system.";