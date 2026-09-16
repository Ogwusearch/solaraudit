/**
 * SolarAudit — Load Engine: Calculation
 *
 * Pure math. Assumes input has already been validated.
 * No I/O, no side effects.
 */

import type { LoadInput, LoadResult } from "./types";
import {
  HOURS_PER_DAY,
  LOW_DIVERSITY_THRESHOLD,
  ROUND_DECIMALS,
} from "./constants";
import {
  WARN_ZERO_ENERGY,
  WARN_ZERO_PEAK,
  warnLowDiversity,
} from "./errors";

function round(value: number, decimals = ROUND_DECIMALS): number {
  const factor = 10 ** decimals;
  return Math.round(value * factor) / factor;
}

export function calculateInternal(
  input: LoadInput,
  diversityFactor: number,
  safetyMargin: number,
): LoadResult {
  let totalDailyEnergy = 0;
  let rawPeak = 0;

  for (const app of input.appliances) {
    totalDailyEnergy +=
      (app.powerWatts * app.hoursPerDay * app.quantity) / 1000;
    rawPeak += (app.powerWatts * app.quantity) / 1000;
  }

  let peakLoad = rawPeak * diversityFactor;

  // Apply safety margin
  totalDailyEnergy *= 1 + safetyMargin;
  peakLoad *= 1 + safetyMargin;

  // Load factor (average / peak), clamped to [0, 1]
  let loadFactor = 0;
  if (peakLoad > 0) {
    const averageLoad = totalDailyEnergy / HOURS_PER_DAY;
    loadFactor = averageLoad / peakLoad;
    loadFactor = Math.min(Math.max(loadFactor, 0), 1);
  }

  const warnings: string[] = [];
  if (totalDailyEnergy === 0) warnings.push(WARN_ZERO_ENERGY);
  if (peakLoad === 0) warnings.push(WARN_ZERO_PEAK);
  if (diversityFactor < LOW_DIVERSITY_THRESHOLD) {
    warnings.push(warnLowDiversity(diversityFactor));
  }

  return {
    totalDailyEnergyKwh: round(totalDailyEnergy),
    peakLoadKw: round(peakLoad),
    loadFactor: round(loadFactor),
    warnings,
    errors: [],
    isValid: true,
  };
}
