/**
 * SolarAudit — Load Engine: Public API
 *
 * The ONLY entry point. Nothing else in this folder should be imported
 * from outside the engine.
 *
 * Boundary:
 *   Input -> Validation -> Calculation -> Engineering Result
 */

/**
 * SolarAudit — Load Engine: Public API
 *
 * The ONLY entry point. Nothing else in this folder should be imported
 * from outside the engine.
 *
 * Boundary:
 *   Input -> Validation -> Calculation -> Engineering Result
 */
import type { LoadInput, LoadResult } from "./types";
import { validateInput } from "./validation";
import { calculateInternal } from "./calculation";
import {
  DEFAULT_DIVERSITY_FACTOR,
  DEFAULT_SAFETY_MARGIN,
} from "./constants";

export * from "./types";

export function calculateLoad(input: LoadInput): LoadResult {
  const diversityFactor =
    input.diversityFactor ?? DEFAULT_DIVERSITY_FACTOR;
  const safetyMargin =
    input.safetyMargin ?? DEFAULT_SAFETY_MARGIN;

  const errors = validateInput(input, diversityFactor, safetyMargin);

  if (errors.length > 0) {
    return {
      totalDailyEnergyKwh: 0,
      peakLoadKw: 0,
      loadFactor: 0,
      warnings: [],
      errors,
      isValid: false,
    };
  }

  return calculateInternal(input, diversityFactor, safetyMargin);
}
