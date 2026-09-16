/**
 * SolarAudit — Validation Engine: Error & Warning Messages
 *
 * Messages for the engine's OWN structural validation. Rule messages
 * are emitted from calculation.ts and reference the rule codes.
 */

export const ERROR_MISSING_CONFIG =
  "config is required.";

export const ERROR_NEGATIVE_DAILY_ENERGY =
  "config.dailyEnergyRequirementKwh must be >= 0.";

export const ERROR_NEGATIVE_ARRAY_KWP =
  "pv.arrayKwp must be >= 0 when provided.";

export const ERROR_NEGATIVE_BATTERY_CAPACITY =
  "battery.bankCapacityAh must be >= 0 when provided.";

export const ERROR_INVALID_RULE_CODE = (code: string): string =>
  `skipRules contains unknown rule code: '${code}'.`;

export const WARN_NO_PV =
  "No PV configuration provided; solar-related rules will be skipped.";

export const WARN_NO_BATTERY =
  "No battery configuration provided; battery-related rules will be skipped.";

export const WARN_NO_INVERTER =
  "No inverter configuration provided; inverter-related rules will be skipped.";

export const WARN_NO_CONTROLLER =
  "No charge controller configuration provided; controller-related rules will be skipped.";

export const WARN_NO_CABLES =
  "No cable snapshots provided; cable-related rules will be skipped.";

export const WARN_NO_PROTECTION =
  "No protection snapshots provided; protection-related rules will be skipped.";
