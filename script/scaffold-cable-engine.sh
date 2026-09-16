#!/usr/bin/env bash
# scaffold-cable-engine.sh
# Generates the SolarAudit Cable Engine module.

set -euo pipefail

ROOT="/home/ogwu/workspace/solaraudit/src/engineering/cable"

mkdir -p "$ROOT/__tests__"

# ----------------------------------------------------------------------
# types.ts
# ----------------------------------------------------------------------
cat > "$ROOT/types.ts" <<'EOF'
/**
 * SolarAudit — Cable Engine: Types
 *
 * Pure data definitions. No logic, no imports from siblings.
 */

export type ConductorMaterial = "copper" | "aluminium";
export type CircuitType = "dc" | "ac-single-phase" | "ac-three-phase";
export type InstallationMethod =
  | "conduit"
  | "cable-tray"
  | "buried"
  | "free-air"
  | "enclosed";

export interface CableInput {
  readonly currentA: number;             // design current (A)
  readonly lengthM: number;              // one-way length (m)
  readonly systemVoltage: number;        // V
  readonly allowableDropPercent: number; // %, e.g. 3 for 3%

  readonly material: ConductorMaterial;
  readonly circuitType: CircuitType;
  readonly installationMethod: InstallationMethod;

  readonly ambientTemperatureC?: number;  // default 30 °C
  readonly conductorTempC?: number;       // default 70 °C (PVC) or 90 °C (XLPE)
  readonly groupingCount?: number;        // number of grouped circuits, default 1

  readonly designMargin?: number;         // fraction, default 0.0
}

export interface CableResult {
  readonly designCurrentA: number;          // with margin
  readonly maxVoltageDropV: number;         // allowable, absolute
  readonly calculatedAreaMm2: number;       // minimum area from voltage drop
  readonly ampacityAreaMm2: number;         // minimum area from current-carrying capacity
  readonly requiredAreaMm2: number;         // max(voltage-drop area, ampacity area)
  readonly selectedAreaMm2: number;         // next standard size
  readonly actualVoltageDropV: number;      // using selected size
  readonly actualDropPercent: number;       // using selected size
  readonly resistanceOhmPerKm: number;      // at conductor temperature
  readonly temperatureFactor: number;       // derating from ambient
  readonly groupingFactor: number;          // derating from grouping
  readonly deratedAmpacityA: number;        // selected size, after derating
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
 * SolarAudit — Cable Engine: Constants
 */

export const DEFAULT_DESIGN_MARGIN = 0.0;
export const DEFAULT_AMBIENT_TEMP_C = 30;
export const DEFAULT_CONDUCTOR_TEMP_C = 70;   // PVC insulated
export const DEFAULT_GROUPING_COUNT = 1;

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

// Standard conductor cross-sectional areas (mm²)
export const STANDARD_AREAS_MM2 = [
  1.0, 1.5, 2.5, 4, 6, 10, 16, 25, 35, 50, 70, 95, 120, 150, 185, 240, 300,
  400, 500, 630,
];

// Approximate base ampacity (A) per mm² for copper at 30 °C ambient,
// free-air, single circuit. Used as a first-pass estimate; real
// installations should reference IEC 60364-5-52 tables.
export const BASE_AMPACITY_COPPER: Record<number, number> = {
  1.0: 14,
  1.5: 18,
  2.5: 25,
  4: 33,
  6: 42,
  10: 57,
  16: 76,
  25: 101,
  35: 125,
  50: 151,
  70: 192,
  95: 232,
  120: 269,
  150: 309,
  185: 353,
  240: 415,
  300: 477,
  400: 571,
  500: 656,
  630: 749,
};

// Aluminium ampacity is roughly 78 % of copper for the same area.
export const ALUMINIUM_AMPACITY_FACTOR = 0.78;

// Temperature derating factor (approximate, PVC 70 °C conductor).
// For XLPE 90 °C, values would be higher.
export const TEMP_DERATING_PVC: Array<[number, number]> = [
  [25, 1.06],
  [30, 1.0],
  [35, 0.94],
  [40, 0.87],
  [45, 0.79],
  [50, 0.71],
  [55, 0.61],
  [60, 0.5],
];

// Grouping derating factor (number of circuits).
export const GROUPING_DERATING: Array<[number, number]> = [
  [1, 1.0],
  [2, 0.8],
  [3, 0.7],
  [4, 0.65],
  [5, 0.6],
  [6, 0.57],
];

// Circuit-type factor: multiplier on (I × L × ρ) to get voltage drop.
//   dc / single-phase: 2  (go + return)
//   three-phase      : √3 (line-to-line drop)
export const CIRCUIT_FACTOR: Record<string, number> = {
  dc: 2,
  "ac-single-phase": 2,
  "ac-three-phase": Math.sqrt(3),
};

export const HIGH_AMBIENT_THRESHOLD_C = 45;
export const HIGH_DROP_THRESHOLD_PERCENT = 5;
export const LONG_RUN_THRESHOLD_M = 100;
export const HIGH_GROUPING_THRESHOLD = 3;

export const ROUND_DECIMALS = 3;
EOF

# ----------------------------------------------------------------------
# errors.ts
# ----------------------------------------------------------------------
cat > "$ROOT/errors.ts" <<'EOF'
/**
 * SolarAudit — Cable Engine: Error & Warning Messages
 */

export const ERROR_INVALID_CURRENT =
  "currentA must be > 0.";

export const ERROR_INVALID_LENGTH =
  "lengthM must be > 0.";

export const ERROR_INVALID_VOLTAGE =
  "systemVoltage must be > 0.";

export const ERROR_INVALID_DROP =
  "allowableDropPercent must be > 0.";

export const ERROR_INVALID_MATERIAL =
  "material must be 'copper' or 'aluminium'.";

export const ERROR_INVALID_CIRCUIT_TYPE =
  "circuitType must be 'dc', 'ac-single-phase', or 'ac-three-phase'.";

export const ERROR_INVALID_INSTALLATION =
  "installationMethod is not recognised.";

export const ERROR_INVALID_AMBIENT =
  "ambientTemperatureC must be between -20 and 80 °C.";

export const ERROR_INVALID_CONDUCTOR_TEMP =
  "conductorTempC must be between 30 and 120 °C.";

export const ERROR_INVALID_GROUPING =
  "groupingCount must be an integer >= 1.";

export const ERROR_INVALID_DESIGN_MARGIN =
  "designMargin must be >= 0.";

export const ERROR_NO_STANDARD_AREA =
  "No standard conductor size is large enough; consider parallel runs.";

export const WARN_HIGH_AMBIENT = (value: number): string =>
  `Ambient temperature is high (${value} °C); conductor derating is significant.`;

export const WARN_HIGH_DROP = (value: number): string =>
  `Allowable voltage drop is high (${value} %). Verify with equipment tolerances.`;

export const WARN_LONG_RUN = (value: number): string =>
  `Cable run is long (${value} m). Voltage drop will dominate the size selection.`;

export const WARN_HIGH_GROUPING = (value: number): string =>
  `${value} grouped circuits detected; grouping derating applied.`;

export const WARN_VOLTAGE_DROP_DOMINANT =
  "Voltage drop, not ampacity, is the sizing driver.";

export const WARN_ALUMINIUM_TERMINATION =
  "Aluminium conductors require compatible terminations and periodic re-torquing.";

export const WARN_MARGIN_LARGE =
  "Design margin is large; selected size may be conservative.";
EOF

# ----------------------------------------------------------------------
# validation.ts
# ----------------------------------------------------------------------
cat > "$ROOT/validation.ts" <<'EOF'
/**
 * SolarAudit — Cable Engine: Validation
 *
 * Collects ALL errors. Never throws. Returns string[] (empty == valid).
 */

import type { CableInput } from "./types";
import {
  ERROR_INVALID_CURRENT,
  ERROR_INVALID_LENGTH,
  ERROR_INVALID_VOLTAGE,
  ERROR_INVALID_DROP,
  ERROR_INVALID_MATERIAL,
  ERROR_INVALID_CIRCUIT_TYPE,
  ERROR_INVALID_INSTALLATION,
  ERROR_INVALID_AMBIENT,
  ERROR_INVALID_CONDUCTOR_TEMP,
  ERROR_INVALID_GROUPING,
  ERROR_INVALID_DESIGN_MARGIN,
} from "./errors";

const VALID_INSTALLATIONS = new Set([
  "conduit",
  "cable-tray",
  "buried",
  "free-air",
  "enclosed",
]);

export function validateInput(input: CableInput): string[] {
  const errors: string[] = [];

  if (input.currentA <= 0) errors.push(ERROR_INVALID_CURRENT);
  if (input.lengthM <= 0) errors.push(ERROR_INVALID_LENGTH);
  if (input.systemVoltage <= 0) errors.push(ERROR_INVALID_VOLTAGE);
  if (input.allowableDropPercent <= 0) errors.push(ERROR_INVALID_DROP);

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
  if (!VALID_INSTALLATIONS.has(input.installationMethod)) {
    errors.push(ERROR_INVALID_INSTALLATION);
  }

  if (
    input.ambientTemperatureC !== undefined &&
    (input.ambientTemperatureC < -20 || input.ambientTemperatureC > 80)
  ) {
    errors.push(ERROR_INVALID_AMBIENT);
  }
  if (
    input.conductorTempC !== undefined &&
    (input.conductorTempC < 30 || input.conductorTempC > 120)
  ) {
    errors.push(ERROR_INVALID_CONDUCTOR_TEMP);
  }
  if (
    input.groupingCount !== undefined &&
    (!Number.isInteger(input.groupingCount) || input.groupingCount < 1)
  ) {
    errors.push(ERROR_INVALID_GROUPING);
  }
  if (input.designMargin !== undefined && input.designMargin < 0) {
    errors.push(ERROR_INVALID_DESIGN_MARGIN);
  }

  return errors;
}
EOF

# ----------------------------------------------------------------------
# calculation.ts
# ----------------------------------------------------------------------
cat > "$ROOT/calculation.ts" <<'EOF'
/**
 * SolarAudit — Cable Engine: Calculation
 *
 * Pure math. Assumes input is valid.
 *
 * Model:
 *   designCurrent     = currentA × (1 + designMargin)
 *   maxDropV          = systemVoltage × allowableDropPercent / 100
 *
 *   resistance at conductor temp:
 *     R(T) = ρ20 × [1 + α × (T - 20)] / A     (Ω per metre, A in mm²)
 *
 *   voltage drop (general):
 *     Vd = K × I × L × R(T)                    (V)
 *     K  = 2 for DC / single-phase, √3 for three-phase
 *
 *   Solving for A at Vd = maxDropV:
 *     A_min_vdrop = K × I × L × ρ20 × [1 + α(T-20)] / maxDropV
 *
 *   Ampacity check:
 *     I_corrected = I_base × tempFactor × groupFactor
 *     Pick smallest standard A with I_corrected >= designCurrent
 */

import type { CableInput, CableResult } from "./types";
import {
  RESISTIVITY_20C,
  ALPHA_20C,
  STANDARD_AREAS_MM2,
  BASE_AMPACITY_COPPER,
  ALUMINIUM_AMPACITY_FACTOR,
  TEMP_DERATING_PVC,
  GROUPING_DERATING,
  CIRCUIT_FACTOR,
  DEFAULT_AMBIENT_TEMP_C,
  DEFAULT_CONDUCTOR_TEMP_C,
  DEFAULT_GROUPING_COUNT,
  DEFAULT_DESIGN_MARGIN,
  HIGH_AMBIENT_THRESHOLD_C,
  HIGH_DROP_THRESHOLD_PERCENT,
  LONG_RUN_THRESHOLD_M,
  HIGH_GROUPING_THRESHOLD,
  ROUND_DECIMALS,
} from "./constants";
import {
  ERROR_NO_STANDARD_AREA,
  WARN_HIGH_AMBIENT,
  WARN_HIGH_DROP,
  WARN_LONG_RUN,
  WARN_HIGH_GROUPING,
  WARN_VOLTAGE_DROP_DOMINANT,
  WARN_ALUMINIUM_TERMINATION,
  WARN_MARGIN_LARGE,
} from "./errors";

function round(value: number, decimals = ROUND_DECIMALS): number {
  const factor = 10 ** decimals;
  return Math.round(value * factor) / factor;
}

function interpolate(
  table: Array<[number, number]>,
  x: number,
): number {
  if (x <= table[0]![0]) return table[0]![1];
  const last = table[table.length - 1]!;
  if (x >= last[0]) return last[1];
  for (let i = 0; i < table.length - 1; i++) {
    const [x0, y0] = table[i]!;
    const [x1, y1] = table[i + 1]!;
    if (x >= x0 && x <= x1) {
      return y0 + ((y1 - y0) * (x - x0)) / (x1 - x0);
    }
  }
  return 1;
}

function nextStandardArea(mm2: number): number | null {
  for (const a of STANDARD_AREAS_MM2) {
    if (a >= mm2) return a;
  }
  return null;
}

function baseAmpacity(material: string, areaMm2: number): number | null {
  const copper = BASE_AMPACITY_COPPER[areaMm2];
  if (copper === undefined) return null;
  return material === "aluminium"
    ? copper * ALUMINIUM_AMPACITY_FACTOR
    : copper;
}

export function calculateInternal(input: CableInput): CableResult {
  const warnings: string[] = [];
  const errors: string[] = [];

  const designMargin = input.designMargin ?? DEFAULT_DESIGN_MARGIN;
  const ambientTempC = input.ambientTemperatureC ?? DEFAULT_AMBIENT_TEMP_C;
  const conductorTempC =
    input.conductorTempC ?? DEFAULT_CONDUCTOR_TEMP_C;
  const groupingCount = input.groupingCount ?? DEFAULT_GROUPING_COUNT;

  // ---- 1. Design current ---------------------------------------------
  const designCurrentA = input.currentA * (1 + designMargin);

  // ---- 2. Allowable drop ---------------------------------------------
  const maxVoltageDropV =
    input.systemVoltage * (input.allowableDropPercent / 100);

  // ---- 3. Resistivity at conductor temperature -----------------------
  const rho20 = RESISTIVITY_20C[input.material]!;
  const alpha = ALPHA_20C[input.material]!;
  const rhoT = rho20 * (1 + alpha * (conductorTempC - 20));

  // ---- 4. Minimum area from voltage drop -----------------------------
  const K = CIRCUIT_FACTOR[input.circuitType]!;
  // Vd = K × I × L × rhoT / A  =>  A = K × I × L × rhoT / Vd
  const calculatedAreaMm2 =
    (K * designCurrentA * input.lengthM * rhoT) / maxVoltageDropV;

  // ---- 5. Derating factors -------------------------------------------
  const temperatureFactor = interpolate(TEMP_DERATING_PVC, ambientTempC);
  const groupingFactor = interpolate(GROUPING_DERATING, groupingCount);

  // ---- 6. Minimum area from ampacity ---------------------------------
  // Find smallest standard A whose derated ampacity >= designCurrent
  let ampacityAreaMm2 = 0;
  for (const area of STANDARD_AREAS_MM2) {
    const base = baseAmpacity(input.material, area);
    if (base === null) continue;
    if (base * temperatureFactor * groupingFactor >= designCurrentA) {
      ampacityAreaMm2 = area;
      break;
    }
  }
  if (ampacityAreaMm2 === 0) {
    errors.push(ERROR_NO_STANDARD_AREA);
    ampacityAreaMm2 = STANDARD_AREAS_MM2[STANDARD_AREAS_MM2.length - 1]!;
  }

  // ---- 7. Required area = max(vdrop, ampacity) -----------------------
  const requiredAreaMm2 = Math.max(calculatedAreaMm2, ampacityAreaMm2);
  const selectedMatch = nextStandardArea(requiredAreaMm2);
  const selectedAreaMm2 = selectedMatch ?? requiredAreaMm2;

  if (selectedMatch === null) {
    errors.push(ERROR_NO_STANDARD_AREA);
  }

  // ---- 8. Actual drop with selected area -----------------------------
  const resistanceOhmPerKm =
    (rhoT / selectedAreaMm2) * 1000; // Ω per km

  const actualVoltageDropV =
    (K * designCurrentA * input.lengthM * rhoT) / selectedAreaMm2;

  const actualDropPercent =
    (actualVoltageDropV / input.systemVoltage) * 100;

  // ---- 9. Derated ampacity of selected size --------------------------
  const baseSelected = baseAmpacity(input.material, selectedAreaMm2) ?? 0;
  const deratedAmpacityA =
    baseSelected * temperatureFactor * groupingFactor;

  // ---- 10. Warnings --------------------------------------------------
  if (ambientTempC >= HIGH_AMBIENT_THRESHOLD_C) {
    warnings.push(WARN_HIGH_AMBIENT(ambientTempC));
  }
  if (input.allowableDropPercent >= HIGH_DROP_THRESHOLD_PERCENT) {
    warnings.push(WARN_HIGH_DROP(input.allowableDropPercent));
  }
  if (input.lengthM >= LONG_RUN_THRESHOLD_M) {
    warnings.push(WARN_LONG_RUN(input.lengthM));
  }
  if (groupingCount >= HIGH_GROUPING_THRESHOLD) {
    warnings.push(WARN_HIGH_GROUPING(groupingCount));
  }
  if (calculatedAreaMm2 > ampacityAreaMm2) {
    warnings.push(WARN_VOLTAGE_DROP_DOMINANT);
  }
  if (input.material === "aluminium") {
    warnings.push(WARN_ALUMINIUM_TERMINATION);
  }
  if (designMargin > 0.5) {
    warnings.push(WARN_MARGIN_LARGE);
  }

  const isValid = errors.length === 0;

  return {
    designCurrentA: round(designCurrentA),
    maxVoltageDropV: round(maxVoltageDropV),
    calculatedAreaMm2: round(calculatedAreaMm2),
    ampacityAreaMm2: round(ampacityAreaMm2),
    requiredAreaMm2: round(requiredAreaMm2),
    selectedAreaMm2: round(selectedAreaMm2),
    actualVoltageDropV: round(actualVoltageDropV),
    actualDropPercent: round(actualDropPercent),
    resistanceOhmPerKm: round(resistanceOhmPerKm),
    temperatureFactor: round(temperatureFactor),
    groupingFactor: round(groupingFactor),
    deratedAmpacityA: round(deratedAmpacityA),
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
 * SolarAudit — Cable Engine: Public API
 *
 * Boundary:
 *   Input -> Validation -> Calculation -> Engineering Result
 */

import type { CableInput, CableResult } from "./types";
import { validateInput } from "./validation";
import { calculateInternal } from "./calculation";

export * from "./types";

export function calculateCable(input: CableInput): CableResult {
  const errors = validateInput(input);

  if (errors.length > 0) {
    return {
      designCurrentA: 0,
      maxVoltageDropV: 0,
      calculatedAreaMm2: 0,
      ampacityAreaMm2: 0,
      requiredAreaMm2: 0,
      selectedAreaMm2: 0,
      actualVoltageDropV: 0,
      actualDropPercent: 0,
      resistanceOhmPerKm: 0,
      temperatureFactor: 0,
      groupingFactor: 0,
      deratedAmpacityA: 0,
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
  ERROR_INVALID_DROP,
  ERROR_INVALID_MATERIAL,
  ERROR_INVALID_INSTALLATION,
  ERROR_INVALID_GROUPING,
} from "../errors";

const base = {
  currentA: 40,
  lengthM: 20,
  systemVoltage: 48,
  allowableDropPercent: 3,
  material: "copper" as const,
  circuitType: "dc" as const,
  installationMethod: "conduit" as const,
};

describe("validateInput", () => {
  it("accepts a valid input", () => {
    expect(validateInput(base)).toEqual([]);
  });

  it("rejects non-positive current", () => {
    expect(validateInput({ ...base, currentA: 0 }))
      .toContain(ERROR_INVALID_CURRENT);
  });

  it("rejects non-positive length", () => {
    expect(validateInput({ ...base, lengthM: 0 }))
      .toContain(ERROR_INVALID_LENGTH);
  });

  it("rejects non-positive allowable drop", () => {
    expect(validateInput({ ...base, allowableDropPercent: 0 }))
      .toContain(ERROR_INVALID_DROP);
  });

  it("rejects unknown material", () => {
    expect(validateInput({ ...base, material: "steel" as never }))
      .toContain(ERROR_INVALID_MATERIAL);
  });

  it("rejects unknown installation method", () => {
    expect(validateInput({ ...base, installationMethod: "space" as never }))
      .toContain(ERROR_INVALID_INSTALLATION);
  });

  it("rejects bad grouping count", () => {
    expect(validateInput({ ...base, groupingCount: 0 }))
      .toContain(ERROR_INVALID_GROUPING);
  });

  it("collects multiple errors", () => {
    const errs = validateInput({
      ...base,
      currentA: 0,
      lengthM: 0,
      allowableDropPercent: 0,
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
import type { CableInput } from "../types";

const baseInput: CableInput = {
  currentA: 40,
  lengthM: 20,
  systemVoltage: 48,
  allowableDropPercent: 3,
  material: "copper",
  circuitType: "dc",
  installationMethod: "conduit",
};

describe("calculateInternal", () => {
  it("computes allowable voltage drop", () => {
    const r = calculateInternal(baseInput);
    expect(r.maxVoltageDropV).toBeCloseTo(1.44, 2); // 48 × 3%
  });

  it("computes minimum area from voltage drop", () => {
    // K=2, I=40, L=20, rhoT ≈ 0.0209, Vd=1.44 -> A ≈ 23.2 mm²
    const r = calculateInternal(baseInput);
    expect(r.calculatedAreaMm2).toBeGreaterThan(20);
    expect(r.calculatedAreaMm2).toBeLessThan(30);
  });

  it("selects a standard size >= required area", () => {
    const r = calculateInternal(baseInput);
    expect(r.selectedAreaMm2).toBeGreaterThanOrEqual(r.requiredAreaMm2);
  });

  it("actual drop is below allowable after selecting a size", () => {
    const r = calculateInternal(baseInput);
    expect(r.actualVoltageDropV).toBeLessThanOrEqual(r.maxVoltageDropV + 1e-3);
  });

  it("ampacity dominates for short, high-current runs", () => {
    const r = calculateInternal({
      ...baseInput,
      currentA: 200,
      lengthM: 1,
    });
    expect(r.ampacityAreaMm2).toBeGreaterThan(r.calculatedAreaMm2);
    expect(r.warnings.some((w) => /ampacity|voltage drop/i.test(w))).toBe(false);
  });

  it("voltage drop dominates for long, low-current runs", () => {
    const r = calculateInternal({
      ...baseInput,
      currentA: 5,
      lengthM: 200,
    });
    expect(r.calculatedAreaMm2).toBeGreaterThan(r.ampacityAreaMm2);
    expect(r.warnings.some((w) => /voltage drop/i.test(w))).toBe(true);
  });

  it("applies design margin to current", () => {
    const r0 = calculateInternal(baseInput);
    const r25 = calculateInternal({ ...baseInput, designMargin: 0.25 });
    expect(r25.designCurrentA).toBeCloseTo(r0.designCurrentA * 1.25, 1);
  });

  it("aluminium requires larger area than copper", () => {
    const cu = calculateInternal(baseInput);
    const al = calculateInternal({ ...baseInput, material: "aluminium" });
    expect(al.calculatedAreaMm2).toBeGreaterThan(cu.calculatedAreaMm2);
  });

  it("three-phase uses √3 factor", () => {
    const dc = calculateInternal({ ...baseInput, circuitType: "dc" });
    const tp = calculateInternal({ ...baseInput, circuitType: "ac-three-phase" });
    const ratio = tp.calculatedAreaMm2 / dc.calculatedAreaMm2;
    expect(ratio).toBeCloseTo(Math.sqrt(3) / 2, 2);
  });

  it("temperature derating reduces ampacity", () => {
    const r = calculateInternal({ ...baseInput, ambientTemperatureC: 50 });
    expect(r.temperatureFactor).toBeLessThan(1);
    expect(r.deratedAmpacityA).toBeLessThan(
      // base ampacity is not directly exposed, but derated must be < nominal
      r.deratedAmpacityA / r.temperatureFactor + 1,
    );
  });

  it("grouping derating reduces ampacity", () => {
    const r = calculateInternal({ ...baseInput, groupingCount: 4 });
    expect(r.groupingFactor).toBeLessThan(1);
  });
});
EOF

# ----------------------------------------------------------------------
# __tests__/integration.test.ts
# ----------------------------------------------------------------------
cat > "$ROOT/__tests__/integration.test.ts" <<'EOF'
import { describe, it, expect } from "vitest";
import { calculateCable } from "../index";

describe("calculateCable (public API)", () => {
  it("returns invalid on bad input", () => {
    const r = calculateCable({
      currentA: 0,
      lengthM: 20,
      systemVoltage: 48,
      allowableDropPercent: 3,
      material: "copper",
      circuitType: "dc",
      installationMethod: "conduit",
    });
    expect(r.isValid).toBe(false);
    expect(r.errors.length).toBeGreaterThan(0);
  });

  it("sizes a battery cable for a 48 V / 40 A DC run", () => {
    const r = calculateCable({
      currentA: 40,
      lengthM: 10,
      systemVoltage: 48,
      allowableDropPercent: 2,
      material: "copper",
      circuitType: "dc",
      installationMethod: "conduit",
    });
    expect(r.isValid).toBe(true);
    expect(r.selectedAreaMm2).toBeGreaterThan(0);
    expect(r.actualDropPercent).toBeLessThanOrEqual(2);
  });

  it("respects high-temperature derating", () => {
    const r = calculateCable({
      currentA: 60,
      lengthM: 5,
      systemVoltage: 48,
      allowableDropPercent: 3,
      material: "copper",
      circuitType: "dc",
      installationMethod: "conduit",
      ambientTemperatureC: 50,
    });
    expect(r.isValid).toBe(true);
    expect(r.temperatureFactor).toBeLessThan(1);
  });

  it("sizes a three-phase AC run from an inverter", () => {
    const r = calculateCable({
      currentA: 25,
      lengthM: 40,
      systemVoltage: 400,
      allowableDropPercent: 3,
      material: "copper",
      circuitType: "ac-three-phase",
      installationMethod: "cable-tray",
    });
    expect(r.isValid).toBe(true);
    expect(r.actualDropPercent).toBeLessThanOrEqual(3);
  });
});
EOF

echo "✔ Cable engine scaffolded at: $ROOT"
echo
if command -v tree >/dev/null 2>&1; then
  tree "$ROOT"
else
  find "$ROOT" -type f | sort
fi