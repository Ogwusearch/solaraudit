/**
 * SolarAudit — BOM Engine: Error & Warning Messages
 */

export const ERROR_NO_PROJECT_NAME =
  "projectName is required.";

export const ERROR_NEGATIVE_KWP =
  "pv.arrayKwp must be >= 0 when provided.";

export const ERROR_INVALID_PANEL_POWER =
  "pv.panelRatedWatts must be > 0 when pv is provided.";

export const ERROR_INVALID_PANEL_COUNT =
  "pv.totalPanels must be a non-negative integer when pv is provided.";

export const ERROR_INVALID_BATTERY_CELLS =
  "battery.totalCells must be a non-negative integer when battery is provided.";

export const ERROR_INVALID_BATTERY_CELL_VOLTAGE =
  "battery.cellVoltage must be > 0 when battery is provided.";

export const ERROR_INVALID_INVERTER_VA =
  "inverter.recommendedVa must be > 0 when inverter is provided.";

export const ERROR_INVALID_CONTROLLER_CURRENT =
  "chargeController.recommendedCurrentA must be > 0 when controller is provided.";

export const ERROR_INVALID_RESERVE_PERCENT =
  "reservePercent must be between 0 and 0.5.";

export const errorInvalidCableLength = (idx: number, role: string): string =>
  `cables[${idx}] '${role}': lengthM must be >= 0.`;

export const errorInvalidCableArea = (idx: number, role: string): string =>
  `cables[${idx}] '${role}': selectedAreaMm2 must be > 0.`;

export const errorInvalidProtectionRating = (idx: number, role: string): string =>
  `protections[${idx}] '${role}': selectedRatingA must be > 0.`;

export const WARN_NO_PV =
  "No PV snapshot provided; PV-related BOM items skipped.";

export const WARN_NO_BATTERY =
  "No battery snapshot provided; battery-related BOM items skipped.";

export const WARN_NO_INVERTER =
  "No inverter snapshot provided; inverter-related BOM items skipped.";

export const WARN_NO_CONTROLLER =
  "No charge controller snapshot provided; controller-related BOM items skipped.";

export const WARN_NO_CABLES =
  "No cable snapshots provided; cable-related BOM items skipped.";

export const WARN_NO_PROTECTION =
  "No protection snapshots provided; protection-related BOM items skipped.";

export const WARN_HIGH_STRINGS = (value: number): string =>
  `High parallel string count (${value}). Consider a combiner box and DC busbar.`;

export const WARN_LARGE_PANEL_COUNT = (value: number): string =>
  `Large panel count (${value}). Verify mounting structure and roof loading.`;

export const WARN_NO_MOUNTING_TYPE =
  "mountingType not provided; mounting hardware is estimated generically.";

export const WARN_PWM_CONTROLLER =
  "PWM controller selected; confirm array Vmp is compatible with battery voltage.";
