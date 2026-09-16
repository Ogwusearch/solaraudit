/**
 * SolarAudit — Load Engine: Validation
 *
 * Collects ALL errors instead of failing fast.
 * Never throws. Returns a string[] (empty == valid).
 */

import type { LoadInput } from "./types";
import {
  ERROR_NO_APPLIANCES,
  errorInvalidPower,
  errorInvalidHours,
  errorInvalidQuantity,
  ERROR_INVALID_DIVERSITY,
  ERROR_INVALID_SAFETY_MARGIN,
} from "./errors";

export function validateInput(
  input: LoadInput,
  diversityFactor: number,
  safetyMargin: number,
): string[] {
  const errors: string[] = [];

  if (!input.appliances || input.appliances.length === 0) {
    errors.push(ERROR_NO_APPLIANCES);
  }

  input.appliances?.forEach((app, idx) => {
    if (app.powerWatts <= 0) {
      errors.push(errorInvalidPower(idx, app.name));
    }
    if (app.hoursPerDay < 0 || app.hoursPerDay > 24) {
      errors.push(errorInvalidHours(idx, app.name));
    }
    if (app.quantity < 1 || !Number.isInteger(app.quantity)) {
      errors.push(errorInvalidQuantity(idx, app.name));
    }
  });

  if (diversityFactor < 0 || diversityFactor > 1) {
    errors.push(ERROR_INVALID_DIVERSITY);
  }
  if (safetyMargin < 0) {
    errors.push(ERROR_INVALID_SAFETY_MARGIN);
  }

  return errors;
}
