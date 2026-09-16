/**
 * SolarAudit — Units Engine: Calculation
 *
 * Pure math. Assumes input is valid.
 *
 * Dispatch:
 *   1. Same dimension:
 *        - temperature → affine (via Celsius)
 *        - all others  → linear (via base unit)
 *   2. Power ↔ apparent-power:
 *        W, kW, MW, hp  ↔  VA, kVA, MVA
 *        Requires powerFactor. pf = P / S
 *   3. Energy ↔ charge:
 *        Wh, kWh, MWh, J, BTU  ↔  mAh, Ah, C
 *        Requires systemVoltage.  E = Q × V
 *   4. Anything else → incompatible.
 */

import type { ConversionInput, ConversionResult, Unit } from "./types";
import {
  DIMENSION_OF,
  LINEAR_FACTOR,
  TEMPERATURE_UNITS,
  POWER_UNITS,
  APPARENT_POWER_UNITS,
  ENERGY_UNITS,
  CHARGE_UNITS,
  LOW_POWER_FACTOR_THRESHOLD,
  ROUND_DECIMALS,
} from "./constants";
import {
  errorIncompatibleUnits,
  ERROR_POWER_FACTOR_REQUIRED,
  ERROR_SYSTEM_VOLTAGE_REQUIRED,
  WARN_IDENTITY_CONVERSION,
  WARN_PRECISION_LOSS,
  WARN_LOW_POWER_FACTOR,
  WARN_HP_MECHANICAL,
} from "./errors";

function round(value: number, decimals = ROUND_DECIMALS): number {
  const factor = 10 ** decimals;
  return Math.round(value * factor) / factor;
}

// ---- Temperature ----------------------------------------------------

function toCelsius(value: number, unit: Unit): number {
  switch (unit) {
    case "degC": return value;
    case "degF": return (value - 32) * (5 / 9);
    case "K":    return value - 273.15;
    default:     throw new Error(`Not a temperature unit: ${unit}`);
  }
}

function fromCelsius(value: number, unit: Unit): number {
  switch (unit) {
    case "degC": return value;
    case "degF": return value * (9 / 5) + 32;
    case "K":    return value + 273.15;
    default:     throw new Error(`Not a temperature unit: ${unit}`);
  }
}

// ---- Linear --------------------------------------------------------

function linearFactor(unit: Unit): number {
  const f = LINEAR_FACTOR[unit];
  if (f === undefined) {
    throw new Error(`No linear factor for unit: ${unit}`);
  }
  return f;
}

function convertLinear(value: number, from: Unit, to: Unit): number {
  return (value * linearFactor(from)) / linearFactor(to);
}

// ---- Power ↔ apparent power ----------------------------------------

function convertPowerApparent(
  value: number,
  from: Unit,
  to: Unit,
  powerFactor: number,
): number {
  // Step 1: normalise source to base of its own dimension
  const fromBase = value * linearFactor(from);

  // Step 2: cross over — either base W or base VA
  let watts: number;
  if (POWER_UNITS.has(from)) {
    watts = fromBase;
  } else {
    // from is apparent power; convert to real power
    watts = fromBase * powerFactor;
  }

  // Step 3: convert base W to target
  const toFactor = linearFactor(to);
  if (POWER_UNITS.has(to)) {
    return watts / toFactor;
  }
  // to is apparent power: W → VA by dividing by pf
  return watts / powerFactor / toFactor;
}

// ---- Energy ↔ charge -----------------------------------------------

function convertEnergyCharge(
  value: number,
  from: Unit,
  to: Unit,
  systemVoltage: number,
): number {
  // Step 1: normalise source to base of its own dimension (Wh or Ah)
  const fromBase = value * linearFactor(from);

  // Step 2: cross over — E (Wh) = Q (Ah) × V
  let wattHours: number;
  if (ENERGY_UNITS.has(from)) {
    wattHours = fromBase;
  } else {
    wattHours = fromBase * systemVoltage;
  }

  // Step 3: convert base Wh to target
  const toFactor = linearFactor(to);
  if (ENERGY_UNITS.has(to)) {
    return wattHours / toFactor;
  }
  // to is charge: Ah = Wh / V
  return wattHours / systemVoltage / toFactor;
}

// ---- Result builders -----------------------------------------------

function emptyResult(
  input: ConversionInput,
  warnings: string[],
  errors: string[],
): ConversionResult {
  return {
    value: 0,
    from: input.from,
    to: input.to,
    originalValue: input.value,
    fromDimension: DIMENSION_OF[input.from],
    toDimension: DIMENSION_OF[input.to],
    warnings,
    errors,
    isValid: false,
  };
}

// ---- Main ----------------------------------------------------------

export function calculateInternal(
  input: ConversionInput,
): ConversionResult {
  const warnings: string[] = [];

  const fromDim = DIMENSION_OF[input.from];
  const toDim = DIMENSION_OF[input.to];

  // Identity: same unit, no-op
  if (input.from === input.to) {
    warnings.push(WARN_IDENTITY_CONVERSION);
    return {
      value: input.value,
      from: input.from,
      to: input.to,
      originalValue: input.value,
      fromDimension: fromDim,
      toDimension: toDim,
      warnings,
      errors: [],
      isValid: true,
    };
  }

  // Horsepower convention note
  if (input.from === "hp" || input.to === "hp") {
    warnings.push(WARN_HP_MECHANICAL);
  }

  let raw: number;

  if (fromDim === toDim) {
    if (fromDim === "temperature" && TEMPERATURE_UNITS.has(input.from)) {
      raw = fromCelsius(toCelsius(input.value, input.from), input.to);
    } else {
      raw = convertLinear(input.value, input.from, input.to);
    }
  } else if (
    (POWER_UNITS.has(input.from) && APPARENT_POWER_UNITS.has(input.to)) ||
    (APPARENT_POWER_UNITS.has(input.from) && POWER_UNITS.has(input.to))
  ) {
    if (input.powerFactor === undefined) {
      return emptyResult(input, warnings, [ERROR_POWER_FACTOR_REQUIRED]);
    }
    if (input.powerFactor < LOW_POWER_FACTOR_THRESHOLD) {
      warnings.push(WARN_LOW_POWER_FACTOR(input.powerFactor));
    }
    raw = convertPowerApparent(
      input.value,
      input.from,
      input.to,
      input.powerFactor,
    );
  } else if (
    (ENERGY_UNITS.has(input.from) && CHARGE_UNITS.has(input.to)) ||
    (CHARGE_UNITS.has(input.from) && ENERGY_UNITS.has(input.to))
  ) {
    if (input.systemVoltage === undefined) {
      return emptyResult(input, warnings, [ERROR_SYSTEM_VOLTAGE_REQUIRED]);
    }
    raw = convertEnergyCharge(
      input.value,
      input.from,
      input.to,
      input.systemVoltage,
    );
  } else {
    return emptyResult(input, warnings, [
      errorIncompatibleUnits(input.from, input.to),
    ]);
  }

  const rounded = round(raw);

  // Precision-loss warning
  if (input.value !== 0 && rounded === 0) {
    warnings.push(WARN_PRECISION_LOSS);
  }

  return {
    value: rounded,
    from: input.from,
    to: input.to,
    originalValue: input.value,
    fromDimension: fromDim,
    toDimension: toDim,
    warnings,
    errors: [],
    isValid: true,
  };
}
