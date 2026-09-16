
/**
 * SolarAudit — Energy Engine: Calculation
 *
 * Pure math. Assumes input is valid.
 *
 * Per-day energy-balance model:
 *
 *   1. PV generation = Σ (kWp × peakSunHours × PR)
 *   2. PV serves the load directly
 *   3. PV surplus charges the battery
 *   4. Remaining PV surplus is exported
 *   5. PV deficit is supplied by the battery
 *   6. Remaining deficit is imported
 *
 * Battery:
 *   - SoC is maintained as a fraction from 0 to 1
 *   - DoD determines the minimum usable SoC
 *   - Round-trip efficiency is split between charge/discharge
 */

import type { EnergyInput, EnergyResult } from "./types";

import {
  LOW_PERFORMANCE_RATIO_THRESHOLD,
  LOW_SELF_CONSUMPTION_THRESHOLD,
  ROUND_DECIMALS,
} from "./constants";

import {
  WARN_ZERO_GENERATION,
  WARN_ZERO_CONSUMPTION,
  WARN_LOW_PR,
  WARN_LOW_SELF_CONSUMPTION,
  WARN_BATTERY_OVERSIZED,
  WARN_BATTERY_UNDERSIZED,
} from "./warnings";

// -----------------------------------------------------------------------------
// Utilities
// -----------------------------------------------------------------------------

function round(
  value: number,
  decimals = ROUND_DECIMALS,
): number {
  const factor = 10 ** decimals;
  return Math.round(value * factor) / factor;
}

// -----------------------------------------------------------------------------
// Calculation
// -----------------------------------------------------------------------------

export function calculateInternal(
  input: EnergyInput,
): EnergyResult {
  const warnings: string[] = [];

  // ===========================================================================
  // 1. DAILY PV GENERATION
  // ===========================================================================

  let dailyGeneration = 0;

  for (const pv of input.pvArrays) {
    const generation =
      pv.capacityKwp *
      pv.peakSunHours *
      pv.performanceRatio;

    dailyGeneration += generation;

    if (
      pv.performanceRatio <
      LOW_PERFORMANCE_RATIO_THRESHOLD
    ) {
      warnings.push(
        WARN_LOW_PR(pv.performanceRatio),
      );
    }
  }

  // ===========================================================================
  // 2. HORIZON TOTALS
  // ===========================================================================

  const pvGeneration =
    dailyGeneration * input.days;

  const consumption =
    input.dailyConsumptionKwh * input.days;

  // ===========================================================================
  // 3. ENERGY FLOW
  // ===========================================================================

  const b = input.battery;

  let batteryCharge = 0;
  let batteryDischarge = 0;

  let batteryFinalSoc = b
    ? b.initialSoc
    : 0;

  let directSelfConsume = 0;
  let gridImport = 0;
  let gridExport = 0;

  // ===========================================================================
  // 4. BATTERY SIMULATION
  // ===========================================================================

  if (b) {
    const usableCapacity =
      b.capacityKwh *
      b.depthOfDischarge;

    const socMin =
      1 - b.depthOfDischarge;

    const socMax = 1;

    let soc = Math.min(
      Math.max(
        b.initialSoc,
        socMin,
      ),
      socMax,
    );

    /*
     * Split round-trip efficiency equally between
     * charging and discharging.
     *
     * Example:
     *
     *   RTE = 0.90
     *   oneWayEff = sqrt(0.90)
     *             ≈ 0.9487
     */
    const oneWayEff =
      Math.sqrt(
        b.roundTripEfficiency,
      );

    // -------------------------------------------------------------------------
    // Simulate each day
    // -------------------------------------------------------------------------

    for (
      let d = 0;
      d < input.days;
      d++
    ) {
      const generation =
        dailyGeneration;

      const load =
        input.dailyConsumptionKwh;

      // =======================================================================
      // 4A. PV → LOAD
      // =======================================================================

      const direct =
        Math.min(
          generation,
          load,
        );

      directSelfConsume += direct;

      // =======================================================================
      // 4B. PV SURPLUS
      // =======================================================================

      const surplus =
        Math.max(
          0,
          generation - direct,
        );

      if (surplus > 0) {
        /*
         * Battery headroom in stored-energy terms.
         */
        const headroom =
          Math.max(
            0,
            (socMax - soc) *
              b.capacityKwh,
          );

        /*
         * PV energy converted into stored
         * battery energy after charging losses.
         */
        const requestedStored =
          surplus * oneWayEff;

        const stored =
          Math.min(
            requestedStored,
            headroom,
          );

        if (stored > 0) {
          /*
           * Increase SoC.
           */
          soc +=
            stored /
            b.capacityKwh;

          /*
           * Record energy taken from PV.
           */
          const energySentToBattery =
            stored /
            oneWayEff;

          batteryCharge +=
            energySentToBattery;

          /*
           * Anything that cannot be stored
           * becomes grid export.
           */
          const remainingSurplus =
            Math.max(
              0,
              surplus -
                energySentToBattery,
            );

          gridExport +=
            remainingSurplus;
        } else {
          /*
           * Battery cannot accept any more energy.
           * Entire surplus is exported.
           */
          gridExport += surplus;
        }
      }

      // =======================================================================
      // 4C. PV DEFICIT
      // =======================================================================

      const deficit =
        Math.max(
          0,
          load - generation,
        );

      if (deficit > 0) {
        /*
         * Energy currently available above
         * the minimum usable SoC.
         */
        const available =
          Math.max(
            0,
            (soc - socMin) *
              b.capacityKwh,
          );

        /*
         * Maximum energy battery can deliver
         * to the load after discharge losses.
         */
        const deliverable =
          available *
          oneWayEff;

        const discharged =
          Math.min(
            deficit,
            deliverable,
          );

        if (discharged > 0) {
          /*
           * Stored energy removed from battery.
           */
          const storedEnergyRemoved =
            discharged /
            oneWayEff;

          soc -=
            storedEnergyRemoved /
            b.capacityKwh;

          batteryDischarge +=
            discharged;
        }

        /*
         * Any remaining load deficit comes
         * from the grid.
         */
        const remainingDeficit =
          Math.max(
            0,
            deficit -
              discharged,
          );

        gridImport +=
          remainingDeficit;
      }

      // =======================================================================
      // 4D. SOC SAFETY CLAMP
      // =======================================================================

      soc = Math.min(
        Math.max(
          soc,
          socMin,
        ),
        socMax,
      );
    }

    batteryFinalSoc = soc;

    // =========================================================================
    // 5. BATTERY SIZING WARNINGS
    // =========================================================================

    if (
      usableCapacity >
      input.dailyConsumptionKwh * 1.5
    ) {
      warnings.push(
        WARN_BATTERY_OVERSIZED,
      );
    }

    if (
      usableCapacity <
      input.dailyConsumptionKwh * 0.2
    ) {
      warnings.push(
        WARN_BATTERY_UNDERSIZED,
      );
    }
  } else {
    // =========================================================================
    // 6. NO BATTERY
    // =========================================================================

    directSelfConsume =
      Math.min(
        pvGeneration,
        consumption,
      );

    gridImport =
      Math.max(
        0,
        consumption -
          directSelfConsume,
      );

    gridExport =
      Math.max(
        0,
        pvGeneration -
          directSelfConsume,
      );
  }

  // ===========================================================================
  // 7. TOTAL SELF-CONSUMPTION
  // ===========================================================================

  /*
   * Energy consumed on-site:
   *
   *   Direct PV → Load
   *   +
   *   Battery → Load
   *
   * It cannot exceed total consumption.
   */
  const selfConsumed =
    Math.min(
      consumption,
      directSelfConsume +
        batteryDischarge,
    );

  // ===========================================================================
  // 8. PERFORMANCE RATES
  // ===========================================================================

  const selfConsumptionRate =
    pvGeneration > 0
      ? selfConsumed /
        pvGeneration
      : 0;

  const selfSufficiencyRate =
    consumption > 0
      ? selfConsumed /
        consumption
      : 0;

  // ===========================================================================
  // 9. BATTERY CYCLES
  // ===========================================================================

  const batteryCycles =
    b &&
    b.capacityKwh > 0 &&
    b.depthOfDischarge > 0
      ? batteryDischarge /
        (b.capacityKwh *
          b.depthOfDischarge)
      : 0;

  // ===========================================================================
  // 10. GENERAL WARNINGS
  // ===========================================================================

  if (pvGeneration === 0) {
    warnings.push(
      WARN_ZERO_GENERATION,
    );
  }

  if (consumption === 0) {
    warnings.push(
      WARN_ZERO_CONSUMPTION,
    );
  }

  if (
    pvGeneration > 0 &&
    selfConsumptionRate <
      LOW_SELF_CONSUMPTION_THRESHOLD
  ) {
    warnings.push(
      WARN_LOW_SELF_CONSUMPTION(
        selfConsumptionRate,
      ),
    );
  }

  // ===========================================================================
  // 11. RESULT
  // ===========================================================================

  return {
    pvGenerationKwh:
      round(pvGeneration),

    consumptionKwh:
      round(consumption),

    selfConsumedKwh:
      round(selfConsumed),

    gridImportKwh:
      round(gridImport),

    gridExportKwh:
      round(gridExport),

    batteryChargeKwh:
      round(batteryCharge),

    batteryDischargeKwh:
      round(batteryDischarge),

    batteryFinalSoc:
      round(batteryFinalSoc),

    batteryCycles:
      round(batteryCycles),

    selfConsumptionRate:
      round(selfConsumptionRate),

    selfSufficiencyRate:
      round(selfSufficiencyRate),

    warnings,

    errors: [],

    isValid: true,
  };
}