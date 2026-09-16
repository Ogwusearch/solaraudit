/**
 * SolarAudit — Charge Controller Engine: Calculation
 *
 * Pure math. Assumes input is valid.
 *
 * Model:
 *
 *   chargeCurrent
 *     = PV array watts / battery voltage
 *
 *   designCurrent
 *     = chargeCurrent × (1 + design margin)
 *
 * Controller selection:
 *   recommended controller current >= design current
 *
 * MPPT:
 *   PV Voc <= controller maximum PV voltage
 *   PV Isc <= controller maximum PV current
 *
 * PWM:
 *   PV Vmp must remain within the configured
 *   battery-voltage compatibility window.
 */

import type {
  ChargeControllerInput,
  ChargeControllerResult,
} from "./types";

import {
  STANDARD_CONTROLLER_CURRENTS_A,
  SUPPORTED_BATTERY_VOLTAGES,
  PWM_VMP_MIN_RATIO,
  PWM_VMP_MAX_RATIO,
  LOW_CONTROLLER_EFFICIENCY_THRESHOLD,
  UNDERSIZED_ARRAY_THRESHOLD,
  ROUND_DECIMALS,
} from "./constants";

import {
  ERROR_VOC_EXCEEDS_CONTROLLER,
  ERROR_ISC_EXCEEDS_CONTROLLER,
  ERROR_OUTPUT_EXCEEDS_CONTROLLER,
  ERROR_PWM_VOLTAGE_MISMATCH,
  WARN_LOW_EFFICIENCY,
  WARN_UNSUPPORTED_BATTERY_VOLTAGE,
  WARN_NO_STANDARD_MATCH,
  WARN_ARRAY_OVERSIZED_FOR_VOLTAGE,
  WARN_ARRAY_UNDERSIZED,
  WARN_PWM_LOW_YIELD,
} from "./errors";

function round(
  value: number,
  decimals = ROUND_DECIMALS,
): number {
  const factor = 10 ** decimals;

  return Math.round(value * factor) / factor;
}

function nextStandardCurrent(
  currentA: number,
): number | null {
  for (const standardCurrent of STANDARD_CONTROLLER_CURRENTS_A) {
    if (standardCurrent >= currentA) {
      return standardCurrent;
    }
  }

  return null;
}

export function calculateInternal(
  input: ChargeControllerInput,
): ChargeControllerResult {
  const warnings: string[] = [];
  const errors: string[] = [];

  // -----------------------------------------------------------------------
  // 1. PV charging current
  // -----------------------------------------------------------------------

  const pvWatts =
    input.pvArrayKwp * 1000;

  /*
   * Conservative controller sizing:
   *
   * PV power is divided directly by battery voltage.
   * Controller efficiency is monitored separately as a warning.
   */
  const requiredChargeCurrentA =
    pvWatts / input.batteryVoltage;

  const designChargeCurrentA =
    requiredChargeCurrentA *
    (1 + input.designMargin);

  // -----------------------------------------------------------------------
  // 2. Standard controller selection
  // -----------------------------------------------------------------------

  const standardMatch =
    nextStandardCurrent(
      designChargeCurrentA,
    );

  const recommendedControllerCurrentA =
    standardMatch ?? designChargeCurrentA;

  if (standardMatch === null) {
    warnings.push(WARN_NO_STANDARD_MATCH);
  }

  // -----------------------------------------------------------------------
  // 3. PV voltage compatibility
  // -----------------------------------------------------------------------

  let pvVoltageCompatible = true;

  if (
    input.maxPvInputVoltage !== undefined &&
    input.pvVoc > input.maxPvInputVoltage
  ) {
    pvVoltageCompatible = false;

    errors.push(
      ERROR_VOC_EXCEEDS_CONTROLLER(
        round(input.pvVoc, 2),
        input.maxPvInputVoltage,
      ),
    );
  }

  // -----------------------------------------------------------------------
  // 4. PV current compatibility
  // -----------------------------------------------------------------------

  let pvCurrentCompatible = true;

  if (
    input.maxPvInputCurrentA !== undefined &&
    input.pvIsc > input.maxPvInputCurrentA
  ) {
    pvCurrentCompatible = false;

    errors.push(
      ERROR_ISC_EXCEEDS_CONTROLLER(
        round(input.pvIsc, 2),
        input.maxPvInputCurrentA,
      ),
    );
  }

  // -----------------------------------------------------------------------
  // 5. Controller output compatibility
  // -----------------------------------------------------------------------

  let outputCurrentCompatible = true;

  if (
    input.maxOutputCurrentA !== undefined &&
    designChargeCurrentA >
      input.maxOutputCurrentA
  ) {
    outputCurrentCompatible = false;

    errors.push(
      ERROR_OUTPUT_EXCEEDS_CONTROLLER(
        round(designChargeCurrentA, 2),
        input.maxOutputCurrentA,
      ),
    );
  }

  // -----------------------------------------------------------------------
  // 6. PWM-specific compatibility
  // -----------------------------------------------------------------------

  if (input.technology === "pwm") {
    const vmpRatio =
      input.pvVmp /
      input.batteryVoltage;

    const withinTolerance =
      vmpRatio >= PWM_VMP_MIN_RATIO &&
      vmpRatio <= PWM_VMP_MAX_RATIO;

    if (!withinTolerance) {
      pvVoltageCompatible = false;

      errors.push(
        ERROR_PWM_VOLTAGE_MISMATCH,
      );
    }

    warnings.push(
      WARN_PWM_LOW_YIELD,
    );
  }

  // -----------------------------------------------------------------------
  // 7. General warnings
  // -----------------------------------------------------------------------

  if (
    input.controllerEfficiency <
    LOW_CONTROLLER_EFFICIENCY_THRESHOLD
  ) {
    warnings.push(
      WARN_LOW_EFFICIENCY(
        input.controllerEfficiency,
      ),
    );
  }

  if (
    !SUPPORTED_BATTERY_VOLTAGES.includes(
      input.batteryVoltage as (typeof SUPPORTED_BATTERY_VOLTAGES)[number],
    )
  ) {
    warnings.push(
      WARN_UNSUPPORTED_BATTERY_VOLTAGE(
        input.batteryVoltage,
      ),
    );
  }

  if (
    input.batteryVoltage <= 24 &&
    input.pvArrayKwp > 2
  ) {
    warnings.push(
      WARN_ARRAY_OVERSIZED_FOR_VOLTAGE(
        input.pvArrayKwp,
        input.batteryVoltage,
      ),
    );
  }

  if (
    input.pvArrayKwp <
    UNDERSIZED_ARRAY_THRESHOLD
  ) {
    warnings.push(
      WARN_ARRAY_UNDERSIZED,
    );
  }

  // -----------------------------------------------------------------------
  // 8. Final validity
  // -----------------------------------------------------------------------

  const isValid =
    errors.length === 0;

  return {
    requiredChargeCurrentA:
      round(requiredChargeCurrentA),

    designChargeCurrentA:
      round(designChargeCurrentA),

    minControllerCurrentA:
      round(designChargeCurrentA),

    recommendedControllerCurrentA:
      round(recommendedControllerCurrentA),

    pvVoltageCompatible,

    pvCurrentCompatible,

    outputCurrentCompatible,

    recommendedStandardA:
      standardMatch,

    technology:
      input.technology,

    warnings,

    errors,

    isValid,
  };
}