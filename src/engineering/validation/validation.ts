/**
 * SolarAudit — Validation Engine: Validation
 *
 * Structural validation of the ValidationInput itself — NOT the
 * cross-cutting rules (those run during calculation).
 *
 * Collects ALL errors. Never throws. Returns string[] (empty == valid).
 */

import type { ValidationInput } from "./types";
import {
  ERROR_MISSING_CONFIG,
  ERROR_NEGATIVE_DAILY_ENERGY,
  ERROR_NEGATIVE_ARRAY_KWP,
  ERROR_NEGATIVE_BATTERY_CAPACITY,
  ERROR_INVALID_RULE_CODE,
} from "./errors";
import { ALL_RULE_CODES } from "./rulesCatalog";

export function validateInput(input: ValidationInput): string[] {
  const errors: string[] = [];

  if (!input.config) {
    errors.push(ERROR_MISSING_CONFIG);
    return errors;
  }

  const c = input.config;

  if (c.dailyEnergyRequirementKwh < 0) {
    errors.push(ERROR_NEGATIVE_DAILY_ENERGY);
  }
  if (c.pv && c.pv.arrayKwp < 0) {
    errors.push(ERROR_NEGATIVE_ARRAY_KWP);
  }
  if (c.battery && c.battery.bankCapacityAh < 0) {
    errors.push(ERROR_NEGATIVE_BATTERY_CAPACITY);
  }

  input.skipRules?.forEach((code) => {
    if (!ALL_RULE_CODES.has(code)) {
      errors.push(ERROR_INVALID_RULE_CODE(code));
    }
  });

  return errors;
}
