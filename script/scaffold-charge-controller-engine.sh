#!/usr/bin/env bash
# scaffold-charge-controller-engine.sh
# Generates the SolarAudit Charge Controller Engine module.

set -euo pipefail

ROOT="/home/ogwu/workspace/solaraudit/src/engineering/charge-controller"

mkdir -p "$ROOT/__tests__"

# ----------------------------------------------------------------------
# types.ts
# ----------------------------------------------------------------------
cat > "$ROOT/types.ts" <<'EOF'
/**
 * SolarAudit — Charge Controller Engine: Types
 *
 * Pure data definitions. No logic, no imports from siblings.
 */

export type ControllerTechnology = "mppt" | "pwm";

export interface ChargeControllerInput {
  readonly pvArrayKwp: number;          // total array power (kWp) — from Solar Engine
  readonly pvVmp: number;               // array Vmp (V)
  readonly pvVoc: number;               // array Voc (V)
  readonly pvImp: number;               // array Imp (A)
  readonly pvIsc: number;               // array Isc (A)

  readonly batteryVoltage: number;      // nominal bank voltage (V)
  readonly batteryCapacityAh: number;   // bank capacity (Ah)

  readonly technology: ControllerTechnology;

  readonly designMargin: number;        // fraction, e.g. 0.25 = 25%
  readonly controllerEfficiency: number;// 0..1

  readonly maxPvInputVoltage?: number;  // controller's Voc limit (V)
  readonly maxPvInputCurrentA?: number; // controller's Isc limit (A)
  readonly maxOutputCurrentA?: number;  // controller's charge current limit (A)
}

export interface ChargeControllerResult {
  readonly requiredChargeCurrentA: number;   // from array power / battery voltage
  readonly designChargeCurrentA: number;     // with design margin
  readonly minControllerCurrentA: number;    // = designChargeCurrentA
  readonly recommendedControllerCurrentA: number; // rounded up to standard size

  readonly pvVoltageCompatible: boolean;     // Voc within controller limit
  readonly pvCurrentCompatible: boolean;     // Isc within controller limit
  readonly outputCurrentCompatible: boolean; // charge current within controller limit

  readonly recommendedStandardA: number;     // standard controller rating
  readonly technology: ControllerTechnology;
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
 * SolarAudit — Charge Controller Engine: Constants
 */

export const DEFAULT_DESIGN_MARGIN = 0.25;
export const DEFAULT_CONTROLLER_EFFICIENCY = 0.95;

export const MIN_DESIGN_MARGIN = 0.0;
export const MAX_DESIGN_MARGIN = 1.0;

export const MIN_CONTROLLER_EFFICIENCY = 0.7;
export const MAX_CONTROLLER_EFFICIENCY = 1.0;

export const STANDARD_CONTROLLER_CURRENTS_A = [
  5, 10, 15, 20, 25, 30, 40, 50, 60, 70, 80, 100, 120, 150, 200, 250, 300,
];

export const SUPPORTED_BATTERY_VOLTAGES = [12, 24, 36, 48];

export const LOW_CONTROLLER_EFFICIENCY_THRESHOLD = 0.9;
export const HIGH_VOC_RATIO_THRESHOLD = 1.0;  // array Voc / controller max
export const UNDERSIZED_ARRAY_THRESHOLD = 0.1; // array kWp well below capacity

export const ROUND_DECIMALS = 3;
EOF

# ----------------------------------------------------------------------
# errors.ts
# ----------------------------------------------------------------------
cat > "$ROOT/errors.ts" <<'EOF'
/**
 * SolarAudit — Charge Controller Engine: Error & Warning Messages
 */

export const ERROR_INVALID_ARRAY_POWER =
  "pvArrayKwp must be > 0.";

export const ERROR_INVALID_PV_VMP =
  "pvVmp must be > 0.";

export const ERROR_INVALID_PV_VOC =
  "pvVoc must be > 0.";

export const ERROR_INVALID_PV_IMP =
  "pvImp must be > 0.";

export const ERROR_INVALID_PV_ISC =
  "pvIsc must be > 0.";

export const ERROR_INVALID_BATTERY_VOLTAGE =
  "batteryVoltage must be > 0.";

export const ERROR_INVALID_BATTERY_CAPACITY =
  "batteryCapacityAh must be > 0.";

export const ERROR_INVALID_TECHNOLOGY =
  "technology must be 'mppt' or 'pwm'.";

export const ERROR_INVALID_DESIGN_MARGIN =
  "designMargin must be >= 0.";

export const ERROR_INVALID_EFFICIENCY =
  "controllerEfficiency must be between 0 and 1.";

export const ERROR_INVALID_MAX_PV_VOLTAGE =
  "maxPvInputVoltage must be > 0 when provided.";

export const ERROR_INVALID_MAX_PV_CURRENT =
  "maxPvInputCurrentA must be > 0 when provided.";

export const ERROR_INVALID_MAX_OUTPUT_CURRENT =
  "maxOutputCurrentA must be > 0 when provided.";

export const ERROR_VOC_EXCEEDS_CONTROLLER = (voc: number, max: number): string =>
  `PV array Voc (${voc} V) exceeds controller maximum (${max} V).`;

export const ERROR_ISC_EXCEEDS_CONTROLLER = (isc: number, max: number): string =>
  `PV array Isc (${isc} A) exceeds controller maximum (${max} A).`;

export const ERROR_OUTPUT_EXCEEDS_CONTROLLER = (need: number, max: number): string =>
  `Required charge current (${need} A) exceeds controller output limit (${max} A).`;

export const ERROR_PWM_VOLTAGE_MISMATCH =
  "For PWM controllers, array Vmp should be within ~20% of battery voltage.";

export const WARN_LOW_EFFICIENCY = (value: number): string =>
  `Controller efficiency is low (${value}). Losses reduce harvest.`;

export const WARN_UNSUPPORTED_BATTERY_VOLTAGE = (value: number): string =>
  `Battery voltage ${value} V is unusual; typical values are 12 / 24 / 36 / 48 V.`;

export const WARN_NO_STANDARD_MATCH =
  "Recommended controller current exceeds the standard size table; verify against vendor catalogue.";

export const WARN_ARRAY_OVERSIZED_FOR_VOLTAGE = (kwp: number, v: number): string =>
  `Array (${kwp} kWp) is large for a ${v} V battery bank; consider a higher-voltage bank.`;

export const WARN_ARRAY_UNDERSIZED =
  "Array power is very small relative to controller capacity; controller may be oversized.";

export const WARN_PWM_LOW_YIELD =
  "PWM controller will not track the array's maximum power point; expect lower yield.";
EOF

# ----------------------------------------------------------------------
# validation.ts
# ----------------------------------------------------------------------
cat > "$ROOT/validation.ts" <<'EOF'
/**
 * SolarAudit — Charge Controller Engine: Validation
 *
 * Collects ALL errors. Never throws. Returns string[] (empty == valid).
 */

import type { ChargeControllerInput } from "./types";
import {
  ERROR_INVALID_ARRAY_POWER,
  ERROR_INVALID_PV_VMP,
  ERROR_INVALID_PV_VOC,
  ERROR_INVALID_PV_IMP,
  ERROR_INVALID_PV_ISC,
  ERROR_INVALID_BATTERY_VOLTAGE,
  ERROR_INVALID_BATTERY_CAPACITY,
  ERROR_INVALID_TECHNOLOGY,
  ERROR_INVALID_DESIGN_MARGIN,
  ERROR_INVALID_EFFICIENCY,
  ERROR_INVALID_MAX_PV_VOLTAGE,
  ERROR_INVALID_MAX_PV_CURRENT,
  ERROR_INVALID_MAX_OUTPUT_CURRENT,
} from "./errors";

export function validateInput(input: ChargeControllerInput): string[] {
  const errors: string[] = [];

  if (input.pvArrayKwp <= 0) errors.push(ERROR_INVALID_ARRAY_POWER);
  if (input.pvVmp <= 0) errors.push(ERROR_INVALID_PV_VMP);
  if (input.pvVoc <= 0) errors.push(ERROR_INVALID_PV_VOC);
  if (input.pvImp <= 0) errors.push(ERROR_INVALID_PV_IMP);
  if (input.pvIsc <= 0) errors.push(ERROR_INVALID_PV_ISC);

  if (input.batteryVoltage <= 0) errors.push(ERROR_INVALID_BATTERY_VOLTAGE);
  if (input.batteryCapacityAh <= 0) errors.push(ERROR_INVALID_BATTERY_CAPACITY);

  if (input.technology !== "mppt" && input.technology !== "pwm") {
    errors.push(ERROR_INVALID_TECHNOLOGY);
  }

  if (input.designMargin < 0) errors.push(ERROR_INVALID_DESIGN_MARGIN);
  if (input.controllerEfficiency <= 0 || input.controllerEfficiency > 1) {
    errors.push(ERROR_INVALID_EFFICIENCY);
  }

  if (input.maxPvInputVoltage !== undefined && input.maxPvInputVoltage <= 0) {
    errors.push(ERROR_INVALID_MAX_PV_VOLTAGE);
  }
  if (input.maxPvInputCurrentA !== undefined && input.maxPvInputCurrentA <= 0) {
    errors.push(ERROR_INVALID_MAX_PV_CURRENT);
  }
  if (input.maxOutputCurrentA !== undefined && input.maxOutputCurrentA <= 0) {
    errors.push(ERROR_INVALID_MAX_OUTPUT_CURRENT);
  }

  return errors;
}
EOF

# ----------------------------------------------------------------------
# calculation.ts
# ----------------------------------------------------------------------
cat > "$ROOT/calculation.ts" <<'EOF'
/**
 * SolarAudit — Charge Controller Engine: Calculation
 *
 * Pure math. Assumes input is valid.
 *
 * Model (both technologies):
 *   chargeCurrent = (pvArrayKwp × 1000) / batteryVoltage
 *   designCurrent = chargeCurrent × (1 + designMargin)
 *
 * Electrical compatibility:
 *   MPPT: checks array Voc ≤ controller max PV voltage
 *         checks array Isc ≤ controller max PV current
 *   PWM : additionally checks that Vmp ≈ batteryVoltage (±20%)
 *
 * Output-current compatibility:
 *   designCurrent ≤ maxOutputCurrentA
 */

import type {
  ChargeControllerInput,
  ChargeControllerResult,
} from "./types";
import {
  STANDARD_CONTROLLER_CURRENTS_A,
  SUPPORTED_BATTERY_VOLTAGES,
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

function round(value: number, decimals = ROUND_DECIMALS): number {
  const factor = 10 ** decimals;
  return Math.round(value * factor) / factor;
}

function nextStandardCurrent(a: number): number | null {
  for (const s of STANDARD_CONTROLLER_CURRENTS_A) {
    if (s >= a) return s;
  }
  return null;
}

export function calculateInternal(
  input: ChargeControllerInput,
): ChargeControllerResult {
  const warnings: string[] = [];
  const errors: string[] = [];

  // ---- 1. Charge current ---------------------------------------------
  const pvWatts = input.pvArrayKwp * 1000;
  const requiredChargeCurrentA = pvWatts / input.batteryVoltage;
  const designChargeCurrentA =
    requiredChargeCurrentA * (1 + input.designMargin);

  // ---- 2. Standard size match ----------------------------------------
  const standardMatch = nextStandardCurrent(designChargeCurrentA);
  const recommendedControllerCurrentA = standardMatch ?? designChargeCurrentA;

  if (standardMatch === null) {
    warnings.push(WARN_NO_STANDARD_MATCH);
  }

  // ---- 3. Electrical compatibility ----------------------------------
  let pvVoltageCompatible = true;
  let pvCurrentCompatible = true;
  let outputCurrentCompatible = true;

  if (
    input.maxPvInputVoltage !== undefined &&
    input.pvVoc > input.maxPvInputVoltage
  ) {
    pvVoltageCompatible = false;
    errors.push(
      ERROR_VOC_EXCEEDS_CONTROLLER(input.pvVoc, input.maxPvInputVoltage),
    );
  }
  if (
    input.maxPvInputCurrentA !== undefined &&
    input.pvIsc > input.maxPvInputCurrentA
  ) {
    pvCurrentCompatible = false;
    errors.push(
      ERROR_ISC_EXCEEDS_CONTROLLER(input.pvIsc, input.maxPvInputCurrentA),
    );
  }
  if (
    input.maxOutputCurrentA !== undefined &&
    designChargeCurrentA > input.maxOutputCurrentA
  ) {
    outputCurrentCompatible = false;
    errors.push(
      ERROR_OUTPUT_EXCEEDS_CONTROLLER(
        round(designChargeCurrentA, 2),
        input.maxOutputCurrentA,
      ),
    );
  }

  // PWM-specific: array Vmp must be near battery voltage
  if (input.technology === "pwm") {
    const ratio = input.pvVmp / input.batteryVoltage;
    const withinTolerance = ratio >= 0.8 && ratio <= 1.2;
    if (!withinTolerance) {
      pvVoltageCompatible = false;
      errors.push(ERROR_PWM_VOLTAGE_MISMATCH);
    }
    warnings.push(WARN_PWM_LOW_YIELD);
  }

  // ---- 4. Warnings ---------------------------------------------------
  if (input.controllerEfficiency < LOW_CONTROLLER_EFFICIENCY_THRESHOLD) {
    warnings.push(WARN_LOW_EFFICIENCY(input.controllerEfficiency));
  }
  if (!SUPPORTED_BATTERY_VOLTAGES.includes(input.batteryVoltage)) {
    warnings.push(WARN_UNSUPPORTED_BATTERY_VOLTAGE(input.batteryVoltage));
  }
  if (input.batteryVoltage <= 24 && input.pvArrayKwp > 2) {
    warnings.push(
      WARN_ARRAY_OVERSIZED_FOR_VOLTAGE(input.pvArrayKwp, input.batteryVoltage),
    );
  }
  if (input.pvArrayKwp < UNDERSIZED_ARRAY_THRESHOLD) {
    warnings.push(WARN_ARRAY_UNDERSIZED);
  }

  const isValid = errors.length === 0;

  return {
    requiredChargeCurrentA: round(requiredChargeCurrentA),
    designChargeCurrentA: round(designChargeCurrentA),
    minControllerCurrentA: round(designChargeCurrentA),
    recommendedControllerCurrentA: round(recommendedControllerCurrentA),
    pvVoltageCompatible,
    pvCurrentCompatible,
    outputCurrentCompatible,
    recommendedStandardA: recommendedControllerCurrentA,
    technology: input.technology,
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
 * SolarAudit — Charge Controller Engine: Public API
 *
 * Boundary:
 *   Input -> Validation -> Calculation -> Engineering Result
 *
 * NOTE: Unlike most engines, validation errors here come from TWO sources:
 *   1. Structural validation (missing/invalid fields) — short-circuits.
 *   2. Electrical compatibility checks (Voc, Isc, output current, PWM Vmp)
 *      — performed during calculation, so a structurally-valid input may
 *      still return isValid:false.
 */

import type {
  ChargeControllerInput,
  ChargeControllerResult,
} from "./types";
import { validateInput } from "./validation";
import { calculateInternal } from "./calculation";

export * from "./types";

export function calculateChargeController(
  input: ChargeControllerInput,
): ChargeControllerResult {
  const errors = validateInput(input);

  if (errors.length > 0) {
    return {
      requiredChargeCurrentA: 0,
      designChargeCurrentA: 0,
      minControllerCurrentA: 0,
      recommendedControllerCurrentA: 0,
      pvVoltageCompatible: false,
      pvCurrentCompatible: false,
      outputCurrentCompatible: false,
      recommendedStandardA: 0,
      technology: input.technology ?? "mppt",
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
  ERROR_INVALID_ARRAY_POWER,
  ERROR_INVALID_BATTERY_VOLTAGE,
  ERROR_INVALID_TECHNOLOGY,
  ERROR_INVALID_MAX_PV_VOLTAGE,
} from "../errors";

const base = {
  pvArrayKwp: 5,
  pvVmp: 136,
  pvVoc: 164,
  pvImp: 36.8,
  pvIsc: 39,
  batteryVoltage: 48,
  batteryCapacityAh: 200,
  technology: "mppt" as const,
  designMargin: 0.25,
  controllerEfficiency: 0.95,
};

describe("validateInput", () => {
  it("accepts a valid input", () => {
    expect(validateInput(base)).toEqual([]);
  });

  it("rejects zero array power", () => {
    expect(validateInput({ ...base, pvArrayKwp: 0 }))
      .toContain(ERROR_INVALID_ARRAY_POWER);
  });

  it("rejects bad battery voltage", () => {
    expect(validateInput({ ...base, batteryVoltage: 0 }))
      .toContain(ERROR_INVALID_BATTERY_VOLTAGE);
  });

  it("rejects invalid technology", () => {
    expect(validateInput({ ...base, technology: "bogus" as never }))
      .toContain(ERROR_INVALID_TECHNOLOGY);
  });

  it("rejects bad maxPvInputVoltage", () => {
    expect(validateInput({ ...base, maxPvInputVoltage: 0 }))
      .toContain(ERROR_INVALID_MAX_PV_VOLTAGE);
  });

  it("collects multiple errors", () => {
    const errs = validateInput({
      ...base,
      pvArrayKwp: 0,
      batteryVoltage: 0,
      controllerEfficiency: 0,
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
import type { ChargeControllerInput } from "../types";

const baseInput: ChargeControllerInput = {
  pvArrayKwp: 5,
  pvVmp: 136,
  pvVoc: 164,
  pvImp: 36.8,
  pvIsc: 39,
  batteryVoltage: 48,
  batteryCapacityAh: 200,
  technology: "mppt",
  designMargin: 0.25,
  controllerEfficiency: 0.95,
};

describe("calculateInternal", () => {
  it("computes required charge current from array power / battery voltage", () => {
    // 5000 / 48 = 104.17 A
    const r = calculateInternal(baseInput);
    expect(r.requiredChargeCurrentA).toBeCloseTo(104.17, 1);
  });

  it("applies design margin", () => {
    const r = calculateInternal(baseInput);
    expect(r.designChargeCurrentA).toBeCloseTo(
      r.requiredChargeCurrentA * 1.25, 1,
    );
  });

  it("recommends the next standard controller size", () => {
    const r = calculateInternal(baseInput);
    expect(r.recommendedControllerCurrentA).toBeGreaterThanOrEqual(
      r.designChargeCurrentA,
    );
    expect(r.recommendedStandardA).toBe(150); // 130.2 -> 150
  });

  it("checks Voc against controller limit", () => {
    const r = calculateInternal({
      ...baseInput,
      maxPvInputVoltage: 150, // array Voc is 164 V
    });
    expect(r.pvVoltageCompatible).toBe(false);
    expect(r.isValid).toBe(false);
  });

  it("checks Isc against controller limit", () => {
    const r = calculateInternal({
      ...baseInput,
      maxPvInputCurrentA: 30, // array Isc is 39 A
    });
    expect(r.pvCurrentCompatible).toBe(false);
    expect(r.isValid).toBe(false);
  });

  it("checks output current against controller limit", () => {
    const r = calculateInternal({
      ...baseInput,
      maxOutputCurrentA: 100, // design current is ~130 A
    });
    expect(r.outputCurrentCompatible).toBe(false);
    expect(r.isValid).toBe(false);
  });

  it("PWM rejects mismatched Vmp", () => {
    const r = calculateInternal({
      ...baseInput,
      technology: "pwm",
      pvVmp: 136, // far from 48 V battery
    });
    expect(r.isValid).toBe(false);
    expect(r.errors.some((e) => /PWM/i.test(e))).toBe(true);
  });

  it("PWM accepts matched Vmp", () => {
    const r = calculateInternal({
      ...baseInput,
      technology: "pwm",
      pvVmp: 50, // ~ 48 V
    });
    expect(r.errors.some((e) => /PWM/i.test(e))).toBe(false);
  });

  it("warns on small array", () => {
    const r = calculateInternal({ ...baseInput, pvArrayKwp: 0.05 });
    expect(r.warnings.some((w) => /small/i.test(w))).toBe(true);
  });
});
EOF

# ----------------------------------------------------------------------
# __tests__/integration.test.ts
# ----------------------------------------------------------------------
cat > "$ROOT/__tests__/integration.test.ts" <<'EOF'
import { describe, it, expect } from "vitest";
import { calculateChargeController } from "../index";

const baseInput = {
  pvArrayKwp: 5,
  pvVmp: 136,
  pvVoc: 164,
  pvImp: 36.8,
  pvIsc: 39,
  batteryVoltage: 48,
  batteryCapacityAh: 200,
  technology: "mppt" as const,
  designMargin: 0.25,
  controllerEfficiency: 0.95,
};

describe("calculateChargeController (public API)", () => {
  it("returns invalid on structural errors", () => {
    const r = calculateChargeController({ ...baseInput, pvArrayKwp: 0 });
    expect(r.isValid).toBe(false);
    expect(r.errors.length).toBeGreaterThan(0);
  });

  it("sizes a controller for a 5 kWp array on 48 V", () => {
    const r = calculateChargeController({
      ...baseInput,
      maxPvInputVoltage: 200,
      maxPvInputCurrentA: 50,
      maxOutputCurrentA: 150,
    });
    expect(r.isValid).toBe(true);
    expect(r.errors).toEqual([]);
    expect(r.recommendedStandardA).toBeGreaterThanOrEqual(
      r.designChargeCurrentA,
    );
  });

  it("returns invalid when electrical limits are violated", () => {
    const r = calculateChargeController({
      ...baseInput,
      maxPvInputVoltage: 100, // Voc is 164
      maxPvInputCurrentA: 20, // Isc is 39
      maxOutputCurrentA: 50,  // design current ~130
    });
    expect(r.isValid).toBe(false);
    expect(r.errors.length).toBeGreaterThanOrEqual(3);
    expect(r.pvVoltageCompatible).toBe(false);
    expect(r.pvCurrentCompatible).toBe(false);
    expect(r.outputCurrentCompatible).toBe(false);
  });
});
EOF

echo "✔ Charge controller engine scaffolded at: $ROOT"
echo
if command -v tree >/dev/null 2>&1; then
  tree "$ROOT"
else
  find "$ROOT" -type f | sort
fi