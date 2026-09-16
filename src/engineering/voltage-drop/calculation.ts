/**
 * SolarAudit — Voltage Drop Engine: Calculation
 *
 * Pure math. Assumes input is valid.
 *
 * Model:
 *   ρ(T) = ρ₂₀ × [1 + α × (T − 20)]            Ω·mm²/m
 *   R(T) = ρ(T) / A                             Ω/m
 *   R_total = R(T) × L                          Ω
 *
 *   Resistive drop (drop-axis component):
 *     Vd_r = K × I × L × ρ(T) / A × cosφ
 *
 *   Reactive drop (optional, only if X is provided):
 *     Vd_x = K × I × L × X_ohm_per_m × sinφ
 *
 *   Total:
 *     Vd = Vd_r + Vd_x
 *     Vd% = Vd / V_system × 100
 *
 *   Inverse (min area at a target %):
 *     A_min = K × I × L × ρ(T) × cosφ / (V_system × target%/100)
 *     (Reactance term ignored when solving for A; it is a property of the
 *      cable's geometry and is not a linear function of area at this level.)
 */

import type {
  VoltageDropInput,
  VoltageDropResult,
} from "./types";
import {
  RESISTIVITY_20C,
  ALPHA_20C,
  CIRCUIT_FACTOR,
  DEFAULT_CONDUCTOR_TEMP_C,
  DEFAULT_POWER_FACTOR,
  HIGH_DROP_PERCENT,
  VERY_HIGH_DROP_PERCENT,
  LONG_RUN_M,
  TINY_AREA_MM2,
  HUGE_AREA_MM2,
  ROUND_DECIMALS,
  ROUND_DECIMALS_AREA,
} from "./constants";
import {
  ERROR_TARGET_UNREACHABLE,
  WARN_HIGH_DROP,
  WARN_VERY_HIGH_DROP,
  WARN_LONG_RUN,
  WARN_TINY_AREA,
  WARN_HUGE_AREA,
  WARN_NO_TARGET,
  WARN_NON_UNITY_PF_AC,
  WARN_REACTANCE_IGNORED,
} from "./errors";

function round(value: number, decimals = ROUND_DECIMALS): number {
  const factor = 10 ** decimals;
  return Math.round(value * factor) / factor;
}

export function calculateInternal(
  input: VoltageDropInput,
): VoltageDropResult {
  const warnings: string[] = [];
  const errors: string[] = [];

  const conductorTempC =
    input.conductorTempC ?? DEFAULT_CONDUCTOR_TEMP_C;
  const powerFactor = input.powerFactor ?? DEFAULT_POWER_FACTOR;
  const K = CIRCUIT_FACTOR[input.circuitType]!;
  const rho20 = RESISTIVITY_20C[input.material]!;
  const alpha = ALPHA_20C[input.material]!;

  // ---- 1. Temperature-corrected resistivity --------------------------
  const resistivity = rho20 * (1 + alpha * (conductorTempC - 20));

  // ---- 2. Forward mode: compute drop given area ----------------------
  let voltageDropV = 0;
  let voltageDropPercent = 0;
  let resistanceOhmPerKm = 0;
  let resistanceOhm = 0;
  let powerLossW = 0;

  if (input.conductorAreaMm2 !== undefined) {
    const area = input.conductorAreaMm2;

    resistanceOhmPerKm = (resistivity / area) * 1000; // Ω/km
    resistanceOhm = (resistivity / area) * input.lengthM;

    // Resistive drop along the drop axis (cosφ)
    const cosPhi = powerFactor;
    const sinPhi = Math.sqrt(1 - cosPhi * cosPhi);

    const vdResistive =
      (K * input.currentA * input.lengthM * resistivity * cosPhi) / area;

    // Reactive drop (optional)
    let vdReactive = 0;
    if (input.reactanceOhmPerKm !== undefined && input.reactanceOhmPerKm > 0) {
      const xOhmPerM = input.reactanceOhmPerKm / 1000;
      vdReactive =
        K * input.currentA * input.lengthM * xOhmPerM * sinPhi;
    }

    voltageDropV = vdResistive + vdReactive;
    voltageDropPercent = (voltageDropV / input.systemVoltageV) * 100;

    // Power loss uses the total resistance (both go and return carry I)
    powerLossW =
      K === 2
        ? input.currentA * input.currentA * resistanceOhm * 2
        : // three-phase: 3 × I² × R per-phase
          3 * input.currentA * input.currentA * resistanceOhm;

    if (input.reactanceOhmPerKm === undefined) {
      warnings.push(WARN_REACTANCE_IGNORED);
    }
  }

  // ---- 3. Inverse mode: solve minimum area for target ---------------- 
  let calculatedMinAreaMm2 = 0;
  if (input.targetDropPercent !== undefined) {
    const targetV =
      input.systemVoltageV * (input.targetDropPercent / 100);

    const cosPhi = powerFactor;

    calculatedMinAreaMm2 =
      (K * input.currentA * input.lengthM * resistivity * cosPhi) / targetV;

    if (!Number.isFinite(calculatedMinAreaMm2) || calculatedMinAreaMm2 <= 0) {
      errors.push(ERROR_TARGET_UNREACHABLE);
    }
  }

  // ---- 4. Verdict -----------------------------------------------------
  const withinTarget =
    input.targetDropPercent === undefined
      ? true
      : voltageDropPercent > 0 &&
        voltageDropPercent <= input.targetDropPercent;

  // ---- 5. Warnings ----------------------------------------------------
  if (input.conductorAreaMm2 !== undefined) {
    if (voltageDropPercent >= VERY_HIGH_DROP_PERCENT) {
      warnings.push(WARN_VERY_HIGH_DROP(round(voltageDropPercent, 2)));
    } else if (voltageDropPercent >= HIGH_DROP_PERCENT) {
      warnings.push(WARN_HIGH_DROP(round(voltageDropPercent, 2)));
    } else if (input.targetDropPercent === undefined) {
      warnings.push(WARN_NO_TARGET(round(voltageDropPercent, 2)));
    }
  }

  if (input.lengthM >= LONG_RUN_M) {
    warnings.push(WARN_LONG_RUN(input.lengthM));
  }

  if (
    calculatedMinAreaMm2 > 0 &&
    calculatedMinAreaMm2 < TINY_AREA_MM2
  ) {
    warnings.push(WARN_TINY_AREA(round(calculatedMinAreaMm2, 3)));
  }
  if (calculatedMinAreaMm2 > HUGE_AREA_MM2) {
    warnings.push(WARN_HUGE_AREA(round(calculatedMinAreaMm2, 1)));
  }

  if (
    input.circuitType !== "dc" &&
    powerFactor < 1.0
  ) {
    warnings.push(WARN_NON_UNITY_PF_AC);
  }

  const isValid = errors.length === 0;

  return {
    voltageDropV: round(voltageDropV, ROUND_DECIMALS),
    voltageDropPercent: round(voltageDropPercent, ROUND_DECIMALS),
    resistanceOhmPerKm: round(resistanceOhmPerKm, ROUND_DECIMALS),
    resistanceOhm: round(resistanceOhm, ROUND_DECIMALS),
    powerLossW: round(powerLossW, ROUND_DECIMALS),
    calculatedMinAreaMm2: round(
      calculatedMinAreaMm2,
      ROUND_DECIMALS_AREA,
    ),
    withinTarget,
    conductorTempC,
    effectivePowerFactor: powerFactor,
    circuitFactor: K,
    resistivityOhmMm2PerM: round(resistivity, 6),
    warnings,
    errors,
    isValid,
  };
}
