 /**
  * SolarAudit — Solar Engine: Error & Warning Messages
  */

 // ---------------------------------------------------------------------------
 // Input validation errors
 // ---------------------------------------------------------------------------

 export const ERROR_INVALID_DAILY_ENERGY =
   "dailyEnergyKwh must be > 0.";

 export const ERROR_INVALID_PSH =
   "peakSunHours must be between 0 and 24.";

 export const ERROR_INVALID_EFFICIENCY =
   "systemEfficiency must be between 0.1 and 1.0.";

 export const ERROR_INVALID_MARGIN =
   "designMargin must be between 0.0 and 2.0.";

 export const ERROR_PANEL_RATED_POWER =
   "panel.ratedPowerWatts must be > 0.";

 export const ERROR_PANEL_VMP =
   "panel.vmp must be > 0.";

 export const ERROR_PANEL_IMP =
   "panel.imp must be > 0.";

 export const ERROR_PANEL_VOC =
   "panel.voc must be > 0.";

 export const ERROR_PANEL_ISC =
   "panel.isc must be > 0.";

 // ---------------------------------------------------------------------------
 // Array configuration errors
 // ---------------------------------------------------------------------------

 export const ERROR_INVALID_MAX_SERIES =
   "maxSeriesPanels must be an integer >= 1 when provided.";

 export const ERROR_INVALID_MAX_PARALLEL =
   "maxParallelStrings must be an integer >= 1 when provided.";

 export const ERROR_INVALID_MAX_VOC =
   "maxArrayVoc must be > 0 when provided.";

 export const ERROR_INVALID_MIN_VMP =
   "minArrayVmp must be > 0 when provided.";

 // ---------------------------------------------------------------------------
 // Calculation errors
 // ---------------------------------------------------------------------------

 export const ERROR_PSH_ZERO =
   "peakSunHours is zero; array size cannot be computed.";

 // ---------------------------------------------------------------------------
 // Warnings
 // ---------------------------------------------------------------------------

 export const WARN_LOW_PSH = (value: number): string =>
   `Peak sun hours are low (${value} h). Consider a larger array.`;

 export const WARN_LONG_SERIES_STRING = (value: number): string =>
   `Series string length is high (${value} panels). Check cold-temperature Voc.`;

 export const WARN_VOC_EXCEEDS_LIMIT = (value: number): string =>
   `Array Voc (${value} V) exceeds the configured maxArrayVoc limit.`;

 export const WARN_VMP_BELOW_MINIMUM = (value: number): string =>
   `Array Vmp (${value} V) is below the configured minArrayVmp limit.`;

 export const WARN_OVERSIZED_BY_MARGIN =
   "Installed array exceeds design target by more than one panel; consider re-balancing strings.";