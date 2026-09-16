/**
 * SolarAudit — Load Engine: Error & Warning Messages
 *
 * Centralized vocabulary so tests and callers can assert on strings.
 */

export const ERROR_NO_APPLIANCES = "At least one appliance is required.";

export const errorInvalidPower = (idx: number, name: string): string =>
  `Appliance[${idx}] '${name}': powerWatts must be > 0.`;

export const errorInvalidHours = (idx: number, name: string): string =>
  `Appliance[${idx}] '${name}': hoursPerDay must be between 0 and 24.`;

export const errorInvalidQuantity = (idx: number, name: string): string =>
  `Appliance[${idx}] '${name}': quantity must be an integer >= 1.`;

export const ERROR_INVALID_DIVERSITY =
  "diversityFactor must be between 0 and 1.";

export const ERROR_INVALID_SAFETY_MARGIN =
  "safetyMargin must be >= 0.";

export const WARN_ZERO_ENERGY =
  "Total daily energy is zero. Check appliance inputs.";

export const WARN_ZERO_PEAK =
  "Peak load is zero. Check appliance inputs.";

export const warnLowDiversity = (value: number): string =>
  `Diversity factor is low (${value}). Peak load may be underestimated.`;
