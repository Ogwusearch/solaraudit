
/**
 * SolarAudit — Inverter Engine: Calculation
 *
 * Pure mathematical calculation.
 * Input validation is handled separately by validation.ts.
 *
 * Model:
 *
 *   continuousVa = continuousLoadW / powerFactor
 *   peakVa       = peakLoadW / powerFactor
 *   surgeVa      = surgeLoadW / powerFactor
 *
 *   minInverterVa =
 *     peakVa × (1 + designMargin)
 *
 *   requiredSurgeVa =
 *     surgeVa × (1 + designMargin)
 *
 *   sizingVa =
 *     max(minInverterVa, requiredSurgeVa)
 *
 *   recommendedInverterVa =
 *     next standard inverter size >= sizingVa
 *     OR calculated sizingVa when no standard size exists
 *
 *   recommendedStandardVa =
 *     matching standard inverter size
 *     OR null when no standard size is large enough
 *
 *   dcInputCurrentA =
 *     peakLoadW /
 *     (inverterEfficiency × systemVoltage)
 *
 *   dcSurgeCurrentA =
 *     surgeLoadW /
 *     (inverterEfficiency × systemVoltage)
 */

import type {
  InverterInput,
  InverterResult,
} from "./types";

import {
  SUPPORTED_OUTPUT_VOLTAGES,
  SUPPORTED_FREQUENCIES,
  STANDARD_INVERTER_SIZES_VA,
  LOW_EFFICIENCY_THRESHOLD,
  LOW_POWER_FACTOR_THRESHOLD,
  HIGH_SURGE_RATIO_THRESHOLD,
  ROUND_DECIMALS,
} from "./constants";

import {
  WARN_UNSUPPORTED_OUTPUT_VOLTAGE,
  WARN_UNSUPPORTED_FREQUENCY,
  WARN_LOW_EFFICIENCY,
  WARN_LOW_POWER_FACTOR,
  WARN_HIGH_SURGE_RATIO,
  WARN_DC_CURRENT_EXCEEDS_LIMIT,
  WARN_NO_STANDARD_MATCH,
} from "./errors";

/**
 * Round a number to a fixed number of decimal places.
 */
function round(
  value: number,
  decimals = ROUND_DECIMALS,
): number {
  const factor = 10 ** decimals;

  return Math.round(value * factor) / factor;
}

/**
 * Return the smallest standard inverter size
 * that is greater than or equal to the required VA.
 *
 * Returns null when the required VA exceeds
 * the largest standard inverter size.
 */
function nextStandardSize(
  va: number,
): number | null {
  for (const size of STANDARD_INVERTER_SIZES_VA) {
    if (size >= va) {
      return size;
    }
  }

  return null;
}

/**
 * Check whether the configured AC output voltage
 * is one of the supported standard values.
 */
function isSupportedOutputVoltage(
  voltage: number,
): boolean {
  return SUPPORTED_OUTPUT_VOLTAGES.some(
    (supportedVoltage) =>
      supportedVoltage === voltage,
  );
}

/**
 * Check whether the configured output frequency
 * is one of the supported standard values.
 */
function isSupportedFrequency(
  frequency: number,
): boolean {
  return SUPPORTED_FREQUENCIES.some(
    (supportedFrequency) =>
      supportedFrequency === frequency,
  );
}

/**
 * Calculate inverter sizing and DC-side requirements.
 *
 * Assumes the input has already passed validation.
 */
export function calculateInternal(
  input: InverterInput,
): InverterResult {
  const warnings: string[] = [];

  const pf = input.powerFactor;

  // ------------------------------------------------------------
  // 1. Apparent Power
  // ------------------------------------------------------------

  const continuousVa =
    input.continuousLoadW / pf;

  const peakVa =
    input.peakLoadW / pf;

  const surgeVa =
    input.surgeLoadW / pf;

  // ------------------------------------------------------------
  // 2. Required Inverter Capacity
  // ------------------------------------------------------------

  const minInverterVa =
    peakVa * (1 + input.designMargin);

  const requiredSurgeVa =
    surgeVa * (1 + input.designMargin);

  /*
   * The inverter must satisfy both:
   *
   *   - peak operating load
   *   - surge/startup requirement
   *
   * Therefore the larger requirement determines
   * the required inverter capacity.
   */
  const sizingVa = Math.max(
    minInverterVa,
    requiredSurgeVa,
  );

  /*
   * Find the next available standard inverter size.
   */
  const standardMatch =
    nextStandardSize(sizingVa);

  /*
   * If a standard inverter exists, use it.
   *
   * If no standard inverter is large enough,
   * preserve the calculated engineering requirement.
   */
  const recommendedInverterVa =
    standardMatch ?? sizingVa;

  /*
   * No standard inverter is large enough.
   */
  if (standardMatch === null) {
    warnings.push(WARN_NO_STANDARD_MATCH);
  }

  // ------------------------------------------------------------
  // 3. DC-Side Current
  // ------------------------------------------------------------

  const dcInputCurrentA =
    input.peakLoadW /
    (
      input.inverterEfficiency *
      input.systemVoltage
    );

  const dcSurgeCurrentA =
    input.surgeLoadW /
    (
      input.inverterEfficiency *
      input.systemVoltage
    );

  // ------------------------------------------------------------
  // 4. Configuration Warnings
  // ------------------------------------------------------------

  if (
    !isSupportedOutputVoltage(
      input.outputVoltage,
    )
  ) {
    warnings.push(
      WARN_UNSUPPORTED_OUTPUT_VOLTAGE(
        input.outputVoltage,
      ),
    );
  }

  if (
    !isSupportedFrequency(
      input.outputFrequency,
    )
  ) {
    warnings.push(
      WARN_UNSUPPORTED_FREQUENCY(
        input.outputFrequency,
      ),
    );
  }

  if (
    input.inverterEfficiency <
    LOW_EFFICIENCY_THRESHOLD
  ) {
    warnings.push(
      WARN_LOW_EFFICIENCY(
        input.inverterEfficiency,
      ),
    );
  }

  if (
    input.powerFactor <
    LOW_POWER_FACTOR_THRESHOLD
  ) {
    warnings.push(
      WARN_LOW_POWER_FACTOR(
        input.powerFactor,
      ),
    );
  }

  // ------------------------------------------------------------
  // 5. Surge Ratio
  // ------------------------------------------------------------

  const surgeRatio =
    input.surgeLoadW /
    input.continuousLoadW;

  if (
    surgeRatio >
    HIGH_SURGE_RATIO_THRESHOLD
  ) {
    warnings.push(
      WARN_HIGH_SURGE_RATIO(
        round(surgeRatio, 2),
      ),
    );
  }

  // ------------------------------------------------------------
  // 6. DC Current Limit
  // ------------------------------------------------------------

  if (
    input.maxDcInputCurrentA !== undefined &&
    dcSurgeCurrentA >
      input.maxDcInputCurrentA
  ) {
    warnings.push(
      WARN_DC_CURRENT_EXCEEDS_LIMIT(
        round(dcSurgeCurrentA),
      ),
    );
  }

  // ------------------------------------------------------------
  // 7. Result
  // ------------------------------------------------------------

  return {
    continuousVa:
      round(continuousVa),

    peakVa:
      round(peakVa),

    surgeVa:
      round(surgeVa),

    minInverterVa:
      round(minInverterVa),

    recommendedInverterVa:
      round(recommendedInverterVa),

    requiredSurgeVa:
      round(requiredSurgeVa),

    dcInputCurrentA:
      round(dcInputCurrentA),

    dcSurgeCurrentA:
      round(dcSurgeCurrentA),

    /*
     * IMPORTANT:
     *
     * This is the actual standard-table match.
     * It must remain null when the required inverter
     * exceeds the standard inverter table.
     */
    recommendedStandardVa:
      standardMatch,

    warnings,

    errors: [],

    isValid: true,
  };
}
