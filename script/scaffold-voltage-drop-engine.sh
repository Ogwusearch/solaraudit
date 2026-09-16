#!/usr/bin/env bash
# scaffold-voltage-drop-engine.sh
# Generates the SolarAudit Voltage Drop Engine module.

set -euo pipefail

ROOT="/home/ogwu/workspace/solaraudit/src/engineering/voltage-drop"

mkdir -p "$ROOT/__tests__"

# ----------------------------------------------------------------------
# types.ts
# ----------------------------------------------------------------------
cat > "$ROOT/types.ts" <<'EOF'
/**
 * SolarAudit — Voltage Drop Engine: Types
 *
 * Pure data definitions. No logic, no imports from siblings.
 *
 * Two modes, both supported in one call:
 *   forward : given conductorAreaMm2, compute the voltage drop
 *   inverse : given targetDropPercent, solve the minimum area
 */

export type ConductorMaterial = "copper" | "aluminium";
export type CircuitType = "dc" | "ac-single-phase" | "ac-three-phase";

export interface VoltageDropInput {
  readonly currentA: number;              // design current (A)
  readonly lengthM: number;               // one-way run length (m)
  readonly systemVoltageV: number;        // nominal system voltage (V)

  readonly material: ConductorMaterial;
  readonly circuitType: CircuitType;

  // Forward mode
  readonly conductorAreaMm2?: number;     // known area; if present, drop is computed

  // Inverse mode
  readonly targetDropPercent?: number;    // e.g. 3 for 3%

  // Conductor conditions
  readonly conductorTempC?: number;       // default 70 °C (PVC)
  readonly powerFactor?: number;          // default 1.0 (DC and unity PF)

  // Optional reactance term (large cables / long runs). If omitted,
  // the engine assumes negligible reactance.
  readonly reactanceOhmPerKm?: number;
}

export interface VoltageDropResult {
  // Forward outputs (0 when forward not requested)
  readonly voltageDropV: number;
  readonly voltageDropPercent: number;
  readonly resistanceOhmPerKm: number;
  readonly resistanceOhm: number;         // total for the run
  readonly powerLossW: number;

  // Inverse outputs (0 when inverse not requested)
  readonly calculatedMinAreaMm2: number;

  // Verdict
  readonly withinTarget: boolean;         // true if drop <= target (or target not given)

  // Context
  readonly conductorTempC: number;
  readonly effectivePowerFactor: number;
  readonly circuitFactor: number;         // 2 (dc / 1φ) or √3 (3φ)
  readonly resistivityOhmMm2PerM: number; // temperature-corrected

  readonly warnings: readonly string[];
  readonly errors: readonly string[];
  readonly isValid: boolean;
}
EOF

# ----------------------------------------------------------------------
# constants.ts
# ----------------------------------------------------------------------
cat > "$ROOT/constants.ts" <<'EOF'
/**
 * SolarAudit — Voltage Drop Engine: Constants
 */

// Resistivity at 20 °C, Ω·mm²/m
export const RESISTIVITY_20C: Record<string, number> = {
  copper: 0.017241,
  aluminium: 0.028264,
};

// Temperature coefficient of resistance, per °C
export const ALPHA_20C: Record<string, number> = {
  copper: 0.00393,
  aluminium: 0.00403,
};

// Circuit-type factor on (I × L × R)
//   dc / single-phase: 2 (go + return)
//   three-phase      : √3 (line-to-line drop)
export const CIRCUIT_FACTOR: Record<string, number> = {
  dc: 2,
  "ac-single-phase": 2,
  "ac-three-phase": Math.sqrt(3),
};

export const DEFAULT_CONDUCTOR_TEMP_C = 70;   // PVC insulated
export const DEFAULT_POWER_FACTOR = 1.0;

export const MIN_POWER_FACTOR = 0.1;
export const MAX_POWER_FACTOR = 1.0;

// Warning thresholds
export const HIGH_DROP_PERCENT = 3;
export const VERY_HIGH_DROP_PERCENT = 5;

export const HIGH_AMBIENT_TEMP_C = 45;
export const LONG_RUN_M = 100;

export const TINY_AREA_MM2 = 1.0;   // below this, physically unusual for this current
export const HUGE_AREA_MM2 = 630;   // above this, consider parallel runs

export const ROUND_DECIMALS = 4;
export const ROUND_DECIMALS_AREA = 4;
EOF

# ----------------------------------------------------------------------
# errors.ts
# ----------------------------------------------------------------------
cat > "$ROOT/errors.ts" <<'EOF'
/**
 * SolarAudit — Voltage Drop Engine: Error & Warning Messages
 */

export const ERROR_INVALID_CURRENT =
  "currentA must be > 0.";

export const ERROR_INVALID_LENGTH =
  "lengthM must be > 0.";

export const ERROR_INVALID_VOLTAGE =
  "systemVoltageV must be > 0.";

export const ERROR_INVALID_MATERIAL =
  "material must be 'copper' or 'aluminium'.";

export const ERROR_INVALID_CIRCUIT_TYPE =
  "circuitType must be 'dc', 'ac-single-phase', or 'ac-three-phase'.";

export const ERROR_INVALID_AREA =
  "conductorAreaMm2 must be > 0 when provided.";

export const ERROR_INVALID_TARGET_DROP =
  "targetDropPercent must be > 0 when provided.";

export const ERROR_INVALID_CONDUCTOR_TEMP =
  "conductorTempC must be between 30 and 120 °C when provided.";

export const ERROR_INVALID_POWER_FACTOR =
  "powerFactor must be between 0.1 and 1.0 when provided.";

export const ERROR_INVALID_REACTANCE =
  "reactanceOhmPerKm must be >= 0 when provided.";

export const ERROR_NO_MODE =
  "At least one of conductorAreaMm2 (forward) or targetDropPercent (inverse) must be provided.";

export const ERROR_TARGET_UNREACHABLE =
  "targetDropPercent cannot be met at any realistic conductor area.";

export const WARN_HIGH_DROP = (value: number): string =>
  `Voltage drop is high (${value} %). Verify with equipment tolerances.`;

export const WARN_VERY_HIGH_DROP = (value: number): string =>
  `Voltage drop is very high (${value} %). Equipment may misoperate.`;

export const WARN_LONG_RUN = (value: number): string =>
  `Cable run is long (${value} m). Consider a higher system voltage.`;

export const WARN_TINY_AREA = (value: number): string =>
  `Calculated conductor area (${value} mm²) is below typical minimum sizes; verify current-carrying capacity separately.`;

export const WARN_HUGE_AREA = (value: number): string =>
  `Calculated conductor area (${value} mm²) is very large; consider parallel runs or higher voltage.`;

export const WARN_NO_TARGET = (value: number): string =>
  `Voltage drop (${value} %) computed without a target; set targetDropPercent to get a pass/fail verdict.`;

export const WARN_NON_UNITY_PF_AC =
  "Non-unity power factor on an AC circuit increases drop; reactance is approximated.";

export const WARN_REACTANCE_IGNORED =
  "Reactance not provided; drop is computed from resistance alone (valid for small cables and short runs).";
EOF

# ----------------------------------------------------------------------
# validation.ts
# ----------------------------------------------------------------------
cat > "$ROOT/validation.ts" <<'EOF'
/**
 * SolarAudit — Voltage Drop Engine: Validation
 *
 * Collects ALL errors. Never throws. Returns string[] (empty == valid).
 */

import type { VoltageDropInput } from "./types";
import {
  ERROR_INVALID_CURRENT,
  ERROR_INVALID_LENGTH,
  ERROR_INVALID_VOLTAGE,
  ERROR_INVALID_MATERIAL,
  ERROR_INVALID_CIRCUIT_TYPE,
  ERROR_INVALID_AREA,
  ERROR_INVALID_TARGET_DROP,
  ERROR_INVALID_CONDUCTOR_TEMP,
  ERROR_INVALID_POWER_FACTOR,
  ERROR_INVALID_REACTANCE,
  ERROR_NO_MODE,
} from "./errors";

export function validateInput(input: VoltageDropInput): string[] {
  const errors: string[] = [];

  if (input.currentA <= 0) errors.push(ERROR_INVALID_CURRENT);
  if (input.lengthM <= 0) errors.push(ERROR_INVALID_LENGTH);
  if (input.systemVoltageV <= 0) errors.push(ERROR_INVALID_VOLTAGE);

  if (input.material !== "copper" && input.material !== "aluminium") {
    errors.push(ERROR_INVALID_MATERIAL);
  }
  if (
    input.circuitType !== "dc" &&
    input.circuitType !== "ac-single-phase" &&
    input.circuitType !== "ac-three-phase"
  ) {
    errors.push(ERROR_INVALID_CIRCUIT_TYPE);
  }

  if (input.conductorAreaMm2 !== undefined && input.conductorAreaMm2 <= 0) {
    errors.push(ERROR_INVALID_AREA);
  }
  if (input.targetDropPercent !== undefined && input.targetDropPercent <= 0) {
    errors.push(ERROR_INVALID_TARGET_DROP);
  }

  if (
    input.conductorAreaMm2 === undefined &&
    input.targetDropPercent === undefined
  ) {
    errors.push(ERROR_NO_MODE);
  }

  if (
    input.conductorTempC !== undefined &&
    (input.conductorTempC < 30 || input.conductorTempC > 120)
  ) {
    errors.push(ERROR_INVALID_CONDUCTOR_TEMP);
  }

  if (
    input.powerFactor !== undefined &&
    (input.powerFactor < 0.1 || input.powerFactor > 1.0)
  ) {
    errors.push(ERROR_INVALID_POWER_FACTOR);
  }

  if (input.reactanceOhmPerKm !== undefined && input.reactanceOhmPerKm < 0) {
    errors.push(ERROR_INVALID_REACTANCE);
  }

  return errors;
}
EOF

# ----------------------------------------------------------------------
# calculation.ts
# ----------------------------------------------------------------------
cat > "$ROOT/calculation.ts" <<'EOF'
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
EOF

# ----------------------------------------------------------------------
# index.ts
# ----------------------------------------------------------------------
cat > "$ROOT/index.ts" <<'EOF'
/**
 * SolarAudit — Voltage Drop Engine: Public API
 *
 * Boundary:
 *   Input -> Validation -> Calculation -> Engineering Result
 *
 * Two modes are supported in one call:
 *   - forward  : conductorAreaMm2 provided -> compute voltage drop
 *   - inverse  : targetDropPercent provided -> solve minimum area
 *
 * Both may be provided together to compute drop AND solve the minimum
 * area in one call. At least one is required (structural validation).
 */

import type {
  VoltageDropInput,
  VoltageDropResult,
} from "./types";
import { validateInput } from "./validation";
import { calculateInternal } from "./calculation";

export * from "./types";

export function calculateVoltageDrop(
  input: VoltageDropInput,
): VoltageDropResult {
  const errors = validateInput(input);

  if (errors.length > 0) {
    return {
      voltageDropV: 0,
      voltageDropPercent: 0,
      resistanceOhmPerKm: 0,
      resistanceOhm: 0,
      powerLossW: 0,
      calculatedMinAreaMm2: 0,
      withinTarget: false,
      conductorTempC: input.conductorTempC ?? 70,
      effectivePowerFactor: input.powerFactor ?? 1.0,
      circuitFactor: 0,
      resistivityOhmMm2PerM: 0,
      warnings: [],
      errors,
      isValid: false,
    };
  }

  return calculateInternal(input);
}
EOF

# ----------------------------------------------------------------------
# __tests__/validation.test.ts
# ----------------------------------------------------------------------
cat > "$ROOT/__tests__/validation.test.ts" <<'EOF'
import { describe, it, expect } from "vitest";
import { validateInput } from "../validation";
import {
  ERROR_INVALID_CURRENT,
  ERROR_INVALID_LENGTH,
  ERROR_INVALID_VOLTAGE,
  ERROR_INVALID_MATERIAL,
  ERROR_INVALID_CIRCUIT_TYPE,
  ERROR_INVALID_AREA,
  ERROR_INVALID_TARGET_DROP,
  ERROR_INVALID_POWER_FACTOR,
  ERROR_INVALID_REACTANCE,
  ERROR_NO_MODE,
} from "../errors";

const base = {
  currentA: 40,
  lengthM: 20,
  systemVoltageV: 48,
  material: "copper" as const,
  circuitType: "dc" as const,
  conductorAreaMm2: 25,
};

describe("validateInput", () => {
  it("accepts a forward-mode input", () => {
    expect(validateInput(base)).toEqual([]);
  });

  it("accepts an inverse-mode input", () => {
    expect(validateInput({
      ...base,
      conductorAreaMm2: undefined,
      targetDropPercent: 3,
    })).toEqual([]);
  });

  it("accepts both modes together", () => {
    expect(validateInput({ ...base, targetDropPercent: 3 })).toEqual([]);
  });

  it("rejects missing mode", () => {
    expect(validateInput({
      ...base,
      conductorAreaMm2: undefined,
    })).toContain(ERROR_NO_MODE);
  });

  it("rejects zero current", () => {
    expect(validateInput({ ...base, currentA: 0 }))
      .toContain(ERROR_INVALID_CURRENT);
  });

  it("rejects zero length", () => {
    expect(validateInput({ ...base, lengthM: 0 }))
      .toContain(ERROR_INVALID_LENGTH);
  });

  it("rejects zero voltage", () => {
    expect(validateInput({ ...base, systemVoltageV: 0 }))
      .toContain(ERROR_INVALID_VOLTAGE);
  });

  it("rejects unknown material", () => {
    expect(validateInput({ ...base, material: "steel" as never }))
      .toContain(ERROR_INVALID_MATERIAL);
  });

  it("rejects unknown circuit type", () => {
    expect(validateInput({ ...base, circuitType: "xyz" as never }))
      .toContain(ERROR_INVALID_CIRCUIT_TYPE);
  });

  it("rejects bad area", () => {
    expect(validateInput({ ...base, conductorAreaMm2: 0 }))
      .toContain(ERROR_INVALID_AREA);
  });

  it("rejects bad target drop", () => {
    expect(validateInput({ ...base, targetDropPercent: 0 }))
      .toContain(ERROR_INVALID_TARGET_DROP);
  });

  it("rejects bad power factor", () => {
    expect(validateInput({ ...base, powerFactor: 0.05 }))
      .toContain(ERROR_INVALID_POWER_FACTOR);
  });

  it("rejects negative reactance", () => {
    expect(validateInput({ ...base, reactanceOhmPerKm: -0.1 }))
      .toContain(ERROR_INVALID_REACTANCE);
  });

  it("collects multiple errors", () => {
    const errs = validateInput({
      ...base,
      currentA: 0,
      lengthM: 0,
      conductorAreaMm2: undefined,
    });
    expect(errs.length).toBeGreaterThanOrEqual(3);
  });
});
EOF

# ----------------------------------------------------------------------
# __tests__/calculation.test.ts
# ----------------------------------------------------------------------
cat > "$ROOT/__tests__/calculation.test.ts" <<'EOF'
import { describe, it, expect } from "vitest";
import { calculateInternal } from "../calculation";
import type { VoltageDropInput } from "../types";

const forwardInput: VoltageDropInput = {
  currentA: 40,
  lengthM: 20,
  systemVoltageV: 48,
  material: "copper",
  circuitType: "dc",
  conductorAreaMm2: 25,
};

const inverseInput: VoltageDropInput = {
  currentA: 40,
  lengthM: 20,
  systemVoltageV: 48,
  material: "copper",
  circuitType: "dc",
  targetDropPercent: 3,
};

describe("calculateInternal — forward mode", () => {
  it("computes a finite voltage drop", () => {
    const r = calculateInternal(forwardInput);
    expect(r.voltageDropV).toBeGreaterThan(0);
    expect(r.voltageDropPercent).toBeGreaterThan(0);
  });

  it("computes resistance per km and total", () => {
    const r = calculateInternal(forwardInput);
    expect(r.resistanceOhmPerKm).toBeGreaterThan(0);
    expect(r.resistanceOhm).toBeCloseTo(
      r.resistanceOhmPerKm * (20 / 1000),
      3,
    );
  });

  it("uses circuit factor 2 for DC", () => {
    const r = calculateInternal(forwardInput);
    expect(r.circuitFactor).toBe(2);
  });

  it("uses √3 for three-phase", () => {
    const r = calculateInternal({
      ...forwardInput,
      circuitType: "ac-three-phase",
    });
    expect(r.circuitFactor).toBeCloseTo(Math.sqrt(3), 4);
  });

  it("drop scales with current", () => {
    const a = calculateInternal({ ...forwardInput, currentA: 20 });
    const b = calculateInternal({ ...forwardInput, currentA: 40 });
    expect(b.voltageDropV).toBeCloseTo(a.voltageDropV * 2, 3);
  });

  it("drop scales with length", () => {
    const a = calculateInternal({ ...forwardInput, lengthM: 10 });
    const b = calculateInternal({ ...forwardInput, lengthM: 20 });
    expect(b.voltageDropV).toBeCloseTo(a.voltageDropV * 2, 3);
  });

  it("drop halves when area doubles", () => {
    const a = calculateInternal({ ...forwardInput, conductorAreaMm2: 25 });
    const b = calculateInternal({ ...forwardInput, conductorAreaMm2: 50 });
    expect(b.voltageDropV).toBeCloseTo(a.voltageDropV / 2, 3);
  });

  it("aluminium drops more than copper", () => {
    const cu = calculateInternal(forwardInput);
    const al = calculateInternal({ ...forwardInput, material: "aluminium" });
    expect(al.voltageDropV).toBeGreaterThan(cu.voltageDropV);
  });

  it("computes power loss", () => {
    const r = calculateInternal(forwardInput);
    expect(r.powerLossW).toBeGreaterThan(0);
  });

  it("warns when no target is provided", () => {
    const r = calculateInternal(forwardInput);
    expect(r.warnings.some((w) => /target/i.test(w))).toBe(true);
  });

  it("warns when reactance is not provided", () => {
    const r = calculateInternal(forwardInput);
    expect(r.warnings.some((w) => /Reactance/i.test(w))).toBe(true);
  });
});

describe("calculateInternal — inverse mode", () => {
  it("computes a minimum area for the target drop", () => {
    const r = calculateInternal(inverseInput);
    expect(r.calculatedMinAreaMm2).toBeGreaterThan(0);
  });

  it("inverse area produces drop <= target when applied", () => {
    const inv = calculateInternal(inverseInput);
    const fwd = calculateInternal({
      ...inverseInput,
      conductorAreaMm2: inv.calculatedMinAreaMm2,
    });
    expect(fwd.voltageDropPercent).toBeLessThanOrEqual(
      inverseInput.targetDropPercent! + 1e-3,
    );
  });

  it("target and area together yield a verdict", () => {
    const r = calculateInternal({
      ...forwardInput,
      targetDropPercent: 3,
    });
    expect(typeof r.withinTarget).toBe("boolean");
  });
});
EOF

# ----------------------------------------------------------------------
# __tests__/integration.test.ts
# ----------------------------------------------------------------------
cat > "$ROOT/__tests__/integration.test.ts" <<'EOF'
import { describe, it, expect } from "vitest";
import { calculateVoltageDrop } from "../index";

describe("calculateVoltageDrop (public API)", () => {
  it("returns invalid when no mode is provided", () => {
    const r = calculateVoltageDrop({
      currentA: 40,
      lengthM: 20,
      systemVoltageV: 48,
      material: "copper",
      circuitType: "dc",
    });
    expect(r.isValid).toBe(false);
    expect(r.errors.length).toBeGreaterThan(0);
  });

  it("forward mode: 48 V DC, 40 A, 20 m, 25 mm² copper", () => {
    const r = calculateVoltageDrop({
      currentA: 40,
      lengthM: 20,
      systemVoltageV: 48,
      material: "copper",
      circuitType: "dc",
      conductorAreaMm2: 25,
      targetDropPercent: 3,
    });
    expect(r.isValid).toBe(true);
    expect(r.voltageDropV).toBeGreaterThan(0);
    expect(typeof r.withinTarget).toBe("boolean");
  });

  it("inverse mode: solves minimum area for 2% target", () => {
    const r = calculateVoltageDrop({
      currentA: 40,
      lengthM: 20,
      systemVoltageV: 48,
      material: "copper",
      circuitType: "dc",
      targetDropPercent: 2,
    });
    expect(r.isValid).toBe(true);
    expect(r.calculatedMinAreaMm2).toBeGreaterThan(0);
  });

  it("AC single-phase with non-unity power factor", () => {
    const r = calculateVoltageDrop({
      currentA: 16,
      lengthM: 30,
      systemVoltageV: 230,
      material: "copper",
      circuitType: "ac-single-phase",
      conductorAreaMm2: 4,
      powerFactor: 0.85,
      targetDropPercent: 3,
    });
    expect(r.isValid).toBe(true);
    expect(r.effectivePowerFactor).toBe(0.85);
    expect(r.warnings.some((w) => /power factor/i.test(w))).toBe(true);
  });

  it("three-phase AC run", () => {
    const r = calculateVoltageDrop({
      currentA: 25,
      lengthM: 40,
      systemVoltageV: 400,
      material: "copper",
      circuitType: "ac-three-phase",
      conductorAreaMm2: 6,
      targetDropPercent: 3,
    });
    expect(r.isValid).toBe(true);
    expect(r.circuitFactor).toBeCloseTo(Math.sqrt(3), 4);
  });

  it("reactance is applied when provided", () => {
    const withoutX = calculateVoltageDrop({
      currentA: 100,
      lengthM: 100,
      systemVoltageV: 400,
      material: "copper",
      circuitType: "ac-three-phase",
      conductorAreaMm2: 25,
      powerFactor: 0.85,
    });
    const withX = calculateVoltageDrop({
      currentA: 100,
      lengthM: 100,
      systemVoltageV: 400,
      material: "copper",
      circuitType: "ac-three-phase",
      conductorAreaMm2: 25,
      powerFactor: 0.85,
      reactanceOhmPerKm: 0.08,
    });
    expect(withX.voltageDropV).toBeGreaterThan(withoutX.voltageDropV);
  });
});
EOF

echo "✔ Voltage drop engine scaffolded at: $ROOT"
echo
if command -v tree >/dev/null 2>&1; then
  tree "$ROOT"
else
  find "$ROOT" -type f | sort
fi