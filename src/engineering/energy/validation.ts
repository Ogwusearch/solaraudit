
/**
 * SolarAudit — Energy Engine: Validation
 *
 * Collects ALL errors.
 * Never throws.
 *
 * Returns string[]:
 *   []      = valid
 *   [error] = invalid
 */

import type { EnergyInput } from "./types";

import {
  MIN_PERFORMANCE_RATIO,
  MAX_PERFORMANCE_RATIO,
  MIN_SOC,
  MAX_SOC,
} from "./constants";

import {
  ERROR_NO_PV_ARRAYS,
  errorInvalidCapacity,
  errorInvalidSunHours,
  errorInvalidPR,
  ERROR_INVALID_CONSUMPTION,
  ERROR_INVALID_DAYS,
  ERROR_INVALID_BATTERY_CAPACITY,
  ERROR_INVALID_DOD,
  ERROR_INVALID_RTE,
  ERROR_INVALID_INITIAL_SOC,
} from "./errors";

// -----------------------------------------------------------------------------
// Utilities
// -----------------------------------------------------------------------------

function isFiniteNumber(
  value: number,
): boolean {
  return Number.isFinite(value);
}

// -----------------------------------------------------------------------------
// Validation
// -----------------------------------------------------------------------------

export function validateInput(
  input: EnergyInput,
): string[] {
  const errors: string[] = [];

  // ===========================================================================
  // Input object
  // ===========================================================================

  if (!input) {
    errors.push(
      "Energy input is required.",
    );

    return errors;
  }

  // ===========================================================================
  // PV Arrays
  // ===========================================================================

  if (
    !input.pvArrays ||
    input.pvArrays.length === 0
  ) {
    errors.push(
      ERROR_NO_PV_ARRAYS,
    );
  }

  input.pvArrays?.forEach(
    (pv, idx) => {
      // -----------------------------------------------------------------------
      // PV Capacity
      // -----------------------------------------------------------------------

      if (
        !isFiniteNumber(
          pv.capacityKwp,
        ) ||
        pv.capacityKwp <= 0
      ) {
        errors.push(
          errorInvalidCapacity(
            idx,
            pv.name,
          ),
        );
      }

      // -----------------------------------------------------------------------
      // Peak Sun Hours
      // -----------------------------------------------------------------------

      if (
        !isFiniteNumber(
          pv.peakSunHours,
        ) ||
        pv.peakSunHours < 0 ||
        pv.peakSunHours > 24
      ) {
        errors.push(
          errorInvalidSunHours(
            idx,
            pv.name,
          ),
        );
      }

      // -----------------------------------------------------------------------
      // Performance Ratio
      // -----------------------------------------------------------------------

      if (
        !isFiniteNumber(
          pv.performanceRatio,
        ) ||
        pv.performanceRatio <
          MIN_PERFORMANCE_RATIO ||
        pv.performanceRatio >
          MAX_PERFORMANCE_RATIO
      ) {
        errors.push(
          errorInvalidPR(
            idx,
            pv.name,
          ),
        );
      }
    },
  );

  // ===========================================================================
  // Daily Consumption
  // ===========================================================================

  if (
    !isFiniteNumber(
      input.dailyConsumptionKwh,
    ) ||
    input.dailyConsumptionKwh < 0
  ) {
    errors.push(
      ERROR_INVALID_CONSUMPTION,
    );
  }

  // ===========================================================================
  // Simulation Days
  // ===========================================================================

  if (
    !Number.isInteger(
      input.days,
    ) ||
    input.days < 1
  ) {
    errors.push(
      ERROR_INVALID_DAYS,
    );
  }

  // ===========================================================================
  // Battery
  // ===========================================================================

  if (input.battery) {
    const b = input.battery;

    // -------------------------------------------------------------------------
    // Battery Capacity
    // -------------------------------------------------------------------------

    if (
      !isFiniteNumber(
        b.capacityKwh,
      ) ||
      b.capacityKwh <= 0
    ) {
      errors.push(
        ERROR_INVALID_BATTERY_CAPACITY,
      );
    }

    // -------------------------------------------------------------------------
    // Depth of Discharge
    // -------------------------------------------------------------------------

    if (
      !isFiniteNumber(
        b.depthOfDischarge,
      ) ||
      b.depthOfDischarge <
        MIN_SOC ||
      b.depthOfDischarge >
        MAX_SOC
    ) {
      errors.push(
        ERROR_INVALID_DOD,
      );
    }

    // -------------------------------------------------------------------------
    // Round-Trip Efficiency
    // -------------------------------------------------------------------------

    if (
      !isFiniteNumber(
        b.roundTripEfficiency,
      ) ||
      b.roundTripEfficiency <
        MIN_PERFORMANCE_RATIO ||
      b.roundTripEfficiency >
        MAX_PERFORMANCE_RATIO
    ) {
      errors.push(
        ERROR_INVALID_RTE,
      );
    }

    // -------------------------------------------------------------------------
    // Initial State of Charge
    // -------------------------------------------------------------------------

    if (
      !isFiniteNumber(
        b.initialSoc,
      ) ||
      b.initialSoc <
        MIN_SOC ||
      b.initialSoc >
        MAX_SOC
    ) {
      errors.push(
        ERROR_INVALID_INITIAL_SOC,
      );
    }
  }

  // ===========================================================================
  // Result
  // ===========================================================================

  return errors;
}
