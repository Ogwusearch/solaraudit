/**
 * SolarAudit — Validation Engine: Public API
 *
 * Boundary:
 *   Input -> Validation -> Calculation -> Engineering Result
 *
 * Two layers of validation:
 *   1. validateInput  — structural (is the ValidationInput well-formed?)
 *   2. calculateInternal — cross-cutting rules (does the system cohere?)
 *
 * The overall result carries BOTH:
 *   - isValid:   false only when structural validation fails
 *   - overallStatus: "valid" | "warning" | "invalid" for the system itself
 */

import type { ValidationInput, ValidationResult } from "./types";
import { validateInput } from "./validation";
import { calculateInternal } from "./calculation";

export * from "./types";

export function validateSystem(input: ValidationInput): ValidationResult {
  const errors = validateInput(input);

  if (errors.length > 0) {
    return {
      overallStatus: "invalid",
      passedRules: [],
      failedRules: [],
      warningRules: [],
      infoRules: [],
      allRules: [],
      errorCount: 0,
      warningCount: 0,
      infoCount: 0,
      warnings: [],
      errors,
      isValid: false,
    };
  }

  return calculateInternal(input);
}
