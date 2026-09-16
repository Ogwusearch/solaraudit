/**
 * SolarAudit — Energy Engine: Public API
 *
 * Boundary:
 *   Input -> Validation -> Calculation -> Engineering Result
 */

import type { EnergyInput, EnergyResult } from "./types";
import { validateInput } from "./validation";
import { calculateInternal } from "./calculation";

export * from "./types";

export function calculateEnergy(input: EnergyInput): EnergyResult {
  const errors = validateInput(input);

  if (errors.length > 0) {
    return {
      pvGenerationKwh: 0,
      consumptionKwh: 0,
      selfConsumedKwh: 0,
      gridImportKwh: 0,
      gridExportKwh: 0,
      batteryChargeKwh: 0,
      batteryDischargeKwh: 0,
      batteryFinalSoc: 0,
      batteryCycles: 0,
      selfConsumptionRate: 0,
      selfSufficiencyRate: 0,
      warnings: [],
      errors,
      isValid: false,
    };
  }

  return calculateInternal(input);
}
