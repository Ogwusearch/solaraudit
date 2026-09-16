/**
 * SolarAudit — Units Engine: Error & Warning Messages
 */

export const ERROR_INVALID_VALUE =
  "value must be a finite number.";

export const errorUnknownUnit = (unit: string): string =>
  `Unknown unit '${unit}'.`;

export const errorIncompatibleUnits = (from: string, to: string): string =>
  `Cannot convert '${from}' to '${to}': incompatible dimensions.`;

export const ERROR_POWER_FACTOR_REQUIRED =
  "powerFactor is required to convert between real power (W) and apparent power (VA).";

export const ERROR_POWER_FACTOR_OUT_OF_RANGE =
  "powerFactor must be > 0 and <= 1.";

export const ERROR_SYSTEM_VOLTAGE_REQUIRED =
  "systemVoltage is required to convert between energy (Wh) and charge (Ah).";

export const ERROR_SYSTEM_VOLTAGE_OUT_OF_RANGE =
  "systemVoltage must be > 0.";

export const WARN_IDENTITY_CONVERSION =
  "Source and target units are identical; conversion is a no-op.";

export const WARN_PRECISION_LOSS =
  "Result rounds to zero despite a non-zero input; check precision requirements.";

export const WARN_LOW_POWER_FACTOR = (value: number): string =>
  `Power factor is low (${value}); apparent power will be much larger than real power.`;

export const WARN_HP_MECHANICAL =
  "Using mechanical horsepower (745.699872 W); verify against metric or electrical hp if applicable.";
