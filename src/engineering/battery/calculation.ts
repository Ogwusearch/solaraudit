/**
 * SolarAudit — Battery Engine: Calculation
 *
 * Pure math. Assumes input is valid.
 *
 * Model:
 *
 *   usableEnergy
 *     = dailyEnergy × autonomyDays
 *
 *   requiredCapacity
 *     = usableEnergy
 *       / (DoD × RTE × temperatureDerating)
 *
 *   designCapacity
 *     = requiredCapacity × (1 + designMargin)
 *
 *   seriesCells
 *     = systemVoltage / cellVoltage
 *
 *   perStringCapacity
 *     = seriesCells × cellVoltage × cellAh / 1000
 *
 *   requiredParallelStrings
 *     = ceil(designCapacity / perStringCapacity)
 */

import type {
  BatteryInput,
  BatteryResult,
} from "./types";

import {
  HIGH_AUTONOMY_THRESHOLD,
  LOW_TEMP_DERATING_THRESHOLD,
  HIGH_DOD_THRESHOLD,
  SUPPORTED_SYSTEM_VOLTAGES,
  ROUND_DECIMALS,
} from "./constants";

import {
  WARN_HIGH_AUTONOMY,
  WARN_LOW_TEMP_DERATING,
  WARN_HIGH_DOD,
  WARN_UNSUPPORTED_SYSTEM_VOLTAGE,
  WARN_PARALLEL_LIMIT,
} from "./errors";

function round(
  value: number,
  decimals = ROUND_DECIMALS,
): number {
  const factor = 10 ** decimals;

  return Math.round(value * factor) / factor;
}

function isSupportedSystemVoltage(
  voltage: number,
): boolean {
  return SUPPORTED_SYSTEM_VOLTAGES.some(
    (supportedVoltage) =>
      supportedVoltage === voltage,
  );
}

export function calculateInternal(
  input: BatteryInput,
): BatteryResult {
  const warnings: string[] = [];

  // -----------------------------------------------------------------------
  // 1. Required energy
  // -----------------------------------------------------------------------

  const usableEnergyKwh =
    input.dailyEnergyKwh *
    input.autonomyDays;

  const deratingFactor =
    input.maxDepthOfDischarge *
    input.roundTripEfficiency *
    input.temperatureDerating;

  const requiredCapacityKwh =
    usableEnergyKwh / deratingFactor;

  const designCapacityKwh =
    requiredCapacityKwh *
    (1 + input.designMargin);

  // -----------------------------------------------------------------------
  // 2. Battery topology
  // -----------------------------------------------------------------------

  const seriesCells =
    Math.round(
      input.systemVoltage /
      input.cell.nominalVoltage,
    );

  const bankVoltage =
    seriesCells *
    input.cell.nominalVoltage;

  const perStringKwh =
    (
      seriesCells *
      input.cell.nominalVoltage *
      input.cell.capacityAh
    ) / 1000;

  // Number of strings actually required to satisfy
  // the calculated design capacity.
  const requiredParallelStrings =
    Math.max(
      1,
      Math.ceil(
        designCapacityKwh /
        perStringKwh,
      ),
    );

  // Start with the mathematically required number.
  let parallelStrings =
    requiredParallelStrings;

  // -----------------------------------------------------------------------
  // 3. Parallel-string constraint
  // -----------------------------------------------------------------------

  if (
    input.maxParallelStrings !== undefined &&
    requiredParallelStrings >
      input.maxParallelStrings
  ) {
    warnings.push(WARN_PARALLEL_LIMIT);

    parallelStrings =
      input.maxParallelStrings;
  }

  // -----------------------------------------------------------------------
  // 4. Installed battery
  // -----------------------------------------------------------------------

  const totalCells =
    seriesCells *
    parallelStrings;

  const actualInstalledKwh =
    perStringKwh *
    parallelStrings;

  const actualUsableKwh =
    actualInstalledKwh *
    input.maxDepthOfDischarge;

  const bankCapacityAh =
    parallelStrings *
    input.cell.capacityAh;

  // -----------------------------------------------------------------------
  // 5. Maximum charge current
  // -----------------------------------------------------------------------

  const maxChargeCurrentA =
    input.cell.maxChargeCurrentA !== undefined
      ? input.cell.maxChargeCurrentA *
        parallelStrings
      : 0;

  // -----------------------------------------------------------------------
  // 6. Warnings
  // -----------------------------------------------------------------------

  if (
    input.autonomyDays >
    HIGH_AUTONOMY_THRESHOLD
  ) {
    warnings.push(
      WARN_HIGH_AUTONOMY(
        input.autonomyDays,
      ),
    );
  }

  if (
    input.temperatureDerating <
    LOW_TEMP_DERATING_THRESHOLD
  ) {
    warnings.push(
      WARN_LOW_TEMP_DERATING(
        input.temperatureDerating,
      ),
    );
  }

  if (
    input.maxDepthOfDischarge >
    HIGH_DOD_THRESHOLD
  ) {
    warnings.push(
      WARN_HIGH_DOD(
        input.maxDepthOfDischarge,
      ),
    );
  }

  if (
    !isSupportedSystemVoltage(
      input.systemVoltage,
    )
  ) {
    warnings.push(
      WARN_UNSUPPORTED_SYSTEM_VOLTAGE(
        input.systemVoltage,
      ),
    );
  }

  // -----------------------------------------------------------------------
  // 7. Result
  // -----------------------------------------------------------------------

  return {
    requiredCapacityKwh:
      round(requiredCapacityKwh),

    designCapacityKwh:
      round(designCapacityKwh),

    requiredParallelStrings,

    totalCells,

    seriesCells,

    parallelStrings,

    actualInstalledKwh:
      round(actualInstalledKwh),

    actualUsableKwh:
      round(actualUsableKwh),

    bankVoltage:
      round(bankVoltage),

    bankCapacityAh:
      round(bankCapacityAh),

    maxChargeCurrentA:
      round(maxChargeCurrentA),

    warnings,

    errors: [],

    isValid: true,
  };
}