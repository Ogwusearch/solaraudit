
/**
 * SolarAudit — Energy Engine: Validation Errors
 *
 * Centralized validation error messages.
 *
 * Validation errors indicate invalid input and prevent
 * the calculation engine from producing a valid result.
 */

// =============================================================================
// PV ARRAY ERRORS
// =============================================================================

export const ERROR_NO_PV_ARRAYS =
  "At least one PV array is required.";

export const errorInvalidCapacity = (
  idx: number,
  name: string,
): string =>
  `PVArray[${idx}] '${name}': capacityKwp must be > 0.`;

export const errorInvalidSunHours = (
  idx: number,
  name: string,
): string =>
  `PVArray[${idx}] '${name}': peakSunHours must be between 0 and 24.`;

export const errorInvalidPR = (
  idx: number,
  name: string,
): string =>
  `PVArray[${idx}] '${name}': performanceRatio must be between 0 and 1.`;

// =============================================================================
// LOAD / CONSUMPTION ERRORS
// =============================================================================

export const ERROR_INVALID_CONSUMPTION =
  "dailyConsumptionKwh must be >= 0.";

export const ERROR_INVALID_DAYS =
  "days must be an integer >= 1.";

// =============================================================================
// BATTERY ERRORS
// =============================================================================

export const ERROR_INVALID_BATTERY_CAPACITY =
  "battery.capacityKwh must be > 0 when a battery is provided.";

export const ERROR_INVALID_DOD =
  "battery.depthOfDischarge must be between 0 and 1.";

export const ERROR_INVALID_RTE =
  "battery.roundTripEfficiency must be between 0 and 1.";

export const ERROR_INVALID_INITIAL_SOC =
  "battery.initialSoc must be between 0 and 1.";
