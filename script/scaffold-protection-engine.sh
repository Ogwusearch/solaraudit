#!/usr/bin/env bash
# scaffold-protection-engine.sh
# Generates the SolarAudit Protection Engine module.

set -euo pipefail

ROOT="/home/ogwu/workspace/solaraudit/src/engineering/protection"

mkdir -p "$ROOT/__tests__"

# ----------------------------------------------------------------------
# types.ts
# ----------------------------------------------------------------------
cat > "$ROOT/types.ts" <<'EOF'
/**
 * SolarAudit — Protection Engine: Types
 *
 * Pure data definitions. No logic, no imports from siblings.
 *
 * The engine is called once per circuit. The caller assembles a full
 * protection scheme by calling it for each protected run.
 */

export type ProtectionTechnology =
  | "fuse"
  | "mcb"
  | "mccb"
  | "dc-breaker"
  | "dc-isolator"
  | "spd"
  | "rcd";

export type CircuitRole =
  | "battery"
  | "pv-string"
  | "pv-array"
  | "charge-controller"
  | "inverter-dc"
  | "inverter-ac"
  | "ac-load"
  | "ac-grid";

export type VoltageType = "dc" | "ac";

export interface ProtectionInput {
  readonly role: CircuitRole;
  readonly voltageType: VoltageType;
  readonly technology: ProtectionTechnology;

  readonly continuousCurrentA: number;        // circuit's continuous current
  readonly systemVoltageV: number;            // nominal system voltage

  readonly safetyFactor?: number;             // absolute multiplier (default role-specific)
  readonly availableFaultCurrentKa?: number;  // for interrupt-rating requirement

  // Optional: values from a candidate device, for compatibility checks
  readonly deviceVoltageRatingV?: number;
  readonly deviceInterruptRatingKa?: number;
  readonly deviceCurrentRatingA?: number;
}

export interface ProtectionResult {
  readonly role: CircuitRole;
  readonly technology: ProtectionTechnology;

  readonly designCurrentA: number;            // continuous × safety factor
  readonly recommendedRatingA: number;        // next standard size >= designCurrentA
  readonly minimumVoltageRatingV: number;     // system voltage, DC derated
  readonly minimumInterruptRatingKa: number;  // = available fault current, if provided

  readonly voltageCompatible: boolean;
  readonly interruptCompatible: boolean;
  readonly currentRatingSufficient: boolean;

  readonly selectedRatingA: number;           // device rating if provided, else recommended

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
 * SolarAudit — Protection Engine: Constants
 */

import type { CircuitRole } from "./types";

// Default safety factor per role.
//   PV strings follow NEC 690.8 (1.56 × Isc).
//   Continuous loads use the 1.25× rule (NEC 210.20 / 215.3).
//   Battery / DC inverter circuits use 1.25× as standard practice.
export const ROLE_SAFETY_FACTOR: Record<CircuitRole, number> = {
  "battery": 1.25,
  "pv-string": 1.56,
  "pv-array": 1.25,
  "charge-controller": 1.25,
  "inverter-dc": 1.25,
  "inverter-ac": 1.25,
  "ac-load": 1.25,
  "ac-grid": 1.25,
};

// Standard over-current device ratings (A) — NEC 240.6 + common IEC values.
export const STANDARD_RATINGS_A = [
  1, 2, 3, 4, 5, 6, 8, 10, 12, 15, 16, 20, 25, 30, 32, 35, 40, 45, 50, 60, 63,
  70, 80, 90, 100, 110, 125, 150, 160, 175, 200, 225, 250, 300, 350, 400, 450,
  500, 600, 630, 700, 800, 1000, 1200,
];

// DC circuits need extra voltage headroom because arcs do not self-extinguish
// at a zero-crossing. 1.2× is a common conservative practice.
export const DC_VOLTAGE_MARGIN_FACTOR = 1.2;

// Fault-current thresholds for warnings
export const HIGH_FAULT_CURRENT_KA = 10;    // above this needs industrial-grade devices
export const VERY_HIGH_FAULT_CURRENT_KA = 25;

// Safety factor thresholds
export const HIGH_SAFETY_FACTOR_THRESHOLD = 2.0;
export const LOW_SAFETY_FACTOR_THRESHOLD = 1.0;

export const HIGH_CURRENT_THRESHOLD_A = 400;  // > 400 A => consider MCCB over MCB

export const ROUND_DECIMALS = 3;
export const ROUND_DECIMALS_KA = 3;
EOF

# ----------------------------------------------------------------------
# errors.ts
# ----------------------------------------------------------------------
cat > "$ROOT/errors.ts" <<'EOF'
/**
 * SolarAudit — Protection Engine: Error & Warning Messages
 */

export const ERROR_INVALID_CURRENT =
  "continuousCurrentA must be > 0.";

export const ERROR_INVALID_VOLTAGE =
  "systemVoltageV must be > 0.";

export const ERROR_INVALID_VOLTAGE_TYPE =
  "voltageType must be 'dc' or 'ac'.";

export const ERROR_INVALID_ROLE =
  "role is not a recognised circuit role.";

export const ERROR_INVALID_TECHNOLOGY =
  "technology is not a recognised protection technology.";

export const ERROR_INVALID_SAFETY_FACTOR =
  "safetyFactor must be >= 1.0 when provided.";

export const ERROR_INVALID_FAULT_CURRENT =
  "availableFaultCurrentKa must be >= 0 when provided.";

export const ERROR_INVALID_DEVICE_VOLTAGE =
  "deviceVoltageRatingV must be > 0 when provided.";

export const ERROR_INVALID_DEVICE_INTERRUPT =
  "deviceInterruptRatingKa must be > 0 when provided.";

export const ERROR_INVALID_DEVICE_CURRENT =
  "deviceCurrentRatingA must be > 0 when provided.";

export const ERROR_NO_STANDARD_RATING =
  "No standard protection rating is large enough; consider parallel circuits.";

export const ERROR_DEVICE_VOLTAGE_TOO_LOW = (need: number, got: number): string =>
  `Device voltage rating (${got} V) is below the required minimum (${need} V).`;

export const ERROR_DEVICE_INTERRUPT_TOO_LOW = (need: number, got: number): string =>
  `Device interrupt rating (${got} kA) is below the available fault current (${need} kA).`;

export const ERROR_DEVICE_CURRENT_TOO_LOW = (need: number, got: number): string =>
  `Device current rating (${got} A) is below the design current (${need} A).`;

export const WARN_HIGH_SAFETY_FACTOR = (value: number): string =>
  `Safety factor is high (${value}). Verify sizing basis.`;

export const WARN_HIGH_FAULT_CURRENT = (value: number): string =>
  `Available fault current is high (${value} kA). Select devices with adequate interrupt rating.`;

export const WARN_VERY_HIGH_FAULT_CURRENT = (value: number): string =>
  `Fault current (${value} kA) is very high; coordination study is recommended.`;

export const WARN_HIGH_CURRENT_MCB = (value: number): string =>
  `Circuit current is high (${value} A); MCCB or fuse is preferred over MCB.`;

export const WARN_DC_BREAKER_ARC =
  "DC circuits require DC-rated breakers; AC-rated devices must not be used.";

export const WARN_SPD_SEPARATE_ENGINE =
  "SPD sizing uses surge-current ratings (kA, 8/20 µs), not continuous current. Treat this result as informational; a dedicated SPD engine is planned.";

export const WARN_ISOLATOR_NOT_PROTECTION =
  "DC isolators provide disconnection, not over-current protection. Pair with a fuse or DC breaker.";

export const WARN_RCD_REQUIRES_OVERCURRENT =
  "RCDs provide earth-leakage protection only. Pair with an MCB, MCCB, or fuse for over-current protection.";

export const WARN_NO_FAULT_CURRENT =
  "Available fault current not provided; interrupt rating cannot be verified.";
EOF

# ----------------------------------------------------------------------
# validation.ts
# ----------------------------------------------------------------------
cat > "$ROOT/validation.ts" <<'EOF'
/**
 * SolarAudit — Protection Engine: Validation
 *
 * Collects ALL errors. Never throws. Returns string[] (empty == valid).
 */

import type { ProtectionInput, CircuitRole, ProtectionTechnology } from "./types";
import {
  ERROR_INVALID_CURRENT,
  ERROR_INVALID_VOLTAGE,
  ERROR_INVALID_VOLTAGE_TYPE,
  ERROR_INVALID_ROLE,
  ERROR_INVALID_TECHNOLOGY,
  ERROR_INVALID_SAFETY_FACTOR,
  ERROR_INVALID_FAULT_CURRENT,
  ERROR_INVALID_DEVICE_VOLTAGE,
  ERROR_INVALID_DEVICE_INTERRUPT,
  ERROR_INVALID_DEVICE_CURRENT,
} from "./errors";

const VALID_ROLES: Set<CircuitRole> = new Set([
  "battery",
  "pv-string",
  "pv-array",
  "charge-controller",
  "inverter-dc",
  "inverter-ac",
  "ac-load",
  "ac-grid",
]);

const VALID_TECHNOLOGIES: Set<ProtectionTechnology> = new Set([
  "fuse",
  "mcb",
  "mccb",
  "dc-breaker",
  "dc-isolator",
  "spd",
  "rcd",
]);

export function validateInput(input: ProtectionInput): string[] {
  const errors: string[] = [];

  if (input.continuousCurrentA <= 0) errors.push(ERROR_INVALID_CURRENT);
  if (input.systemVoltageV <= 0) errors.push(ERROR_INVALID_VOLTAGE);
  if (input.voltageType !== "dc" && input.voltageType !== "ac") {
    errors.push(ERROR_INVALID_VOLTAGE_TYPE);
  }
  if (!VALID_ROLES.has(input.role)) errors.push(ERROR_INVALID_ROLE);
  if (!VALID_TECHNOLOGIES.has(input.technology)) {
    errors.push(ERROR_INVALID_TECHNOLOGY);
  }

  if (input.safetyFactor !== undefined && input.safetyFactor < 1.0) {
    errors.push(ERROR_INVALID_SAFETY_FACTOR);
  }
  if (
    input.availableFaultCurrentKa !== undefined &&
    input.availableFaultCurrentKa < 0
  ) {
    errors.push(ERROR_INVALID_FAULT_CURRENT);
  }
  if (
    input.deviceVoltageRatingV !== undefined &&
    input.deviceVoltageRatingV <= 0
  ) {
    errors.push(ERROR_INVALID_DEVICE_VOLTAGE);
  }
  if (
    input.deviceInterruptRatingKa !== undefined &&
    input.deviceInterruptRatingKa <= 0
  ) {
    errors.push(ERROR_INVALID_DEVICE_INTERRUPT);
  }
  if (
    input.deviceCurrentRatingA !== undefined &&
    input.deviceCurrentRatingA <= 0
  ) {
    errors.push(ERROR_INVALID_DEVICE_CURRENT);
  }

  return errors;
}
EOF

# ----------------------------------------------------------------------
# calculation.ts
# ----------------------------------------------------------------------
cat > "$ROOT/calculation.ts" <<'EOF'
/**
 * SolarAudit — Protection Engine: Calculation
 *
 * Pure math. Assumes input is valid.
 *
 * Model:
 *   factor              = safetyFactor ?? ROLE_SAFETY_FACTOR[role]
 *   designCurrentA      = continuousCurrentA × factor
 *   recommendedRatingA  = next standard rating >= designCurrentA
 *   minimumVoltageRatingV = systemVoltageV × (dc ? DC_VOLTAGE_MARGIN_FACTOR : 1)
 *   minimumInterruptRatingKa = availableFaultCurrentKa ?? 0
 *
 * Compatibility checks (only when the corresponding device value is provided):
 *   voltageCompatible       = deviceVoltageRatingV       >= minimumVoltageRatingV
 *   interruptCompatible     = deviceInterruptRatingKa    >= minimumInterruptRatingKa
 *   currentRatingSufficient = deviceCurrentRatingA       >= designCurrentA
 */

import type { ProtectionInput, ProtectionResult } from "./types";
import {
  ROLE_SAFETY_FACTOR,
  STANDARD_RATINGS_A,
  DC_VOLTAGE_MARGIN_FACTOR,
  HIGH_FAULT_CURRENT_KA,
  VERY_HIGH_FAULT_CURRENT_KA,
  HIGH_SAFETY_FACTOR_THRESHOLD,
  HIGH_CURRENT_THRESHOLD_A,
  ROUND_DECIMALS,
} from "./constants";
import {
  ERROR_NO_STANDARD_RATING,
  ERROR_DEVICE_VOLTAGE_TOO_LOW,
  ERROR_DEVICE_INTERRUPT_TOO_LOW,
  ERROR_DEVICE_CURRENT_TOO_LOW,
  WARN_HIGH_SAFETY_FACTOR,
  WARN_HIGH_FAULT_CURRENT,
  WARN_VERY_HIGH_FAULT_CURRENT,
  WARN_HIGH_CURRENT_MCB,
  WARN_DC_BREAKER_ARC,
  WARN_SPD_SEPARATE_ENGINE,
  WARN_ISOLATOR_NOT_PROTECTION,
  WARN_RCD_REQUIRES_OVERCURRENT,
  WARN_NO_FAULT_CURRENT,
} from "./errors";

function round(value: number, decimals = ROUND_DECIMALS): number {
  const factor = 10 ** decimals;
  return Math.round(value * factor) / factor;
}

function nextStandardRating(a: number): number | null {
  for (const s of STANDARD_RATINGS_A) {
    if (s >= a) return s;
  }
  return null;
}

export function calculateInternal(
  input: ProtectionInput,
): ProtectionResult {
  const warnings: string[] = [];
  const errors: string[] = [];

  // ---- 1. Safety factor & design current -----------------------------
  const factor = input.safetyFactor ?? ROLE_SAFETY_FACTOR[input.role];
  const designCurrentA = input.continuousCurrentA * factor;

  // ---- 2. Recommended standard rating --------------------------------
  const standardMatch = nextStandardRating(designCurrentA);
  const recommendedRatingA = standardMatch ?? designCurrentA;

  if (standardMatch === null) {
    errors.push(ERROR_NO_STANDARD_RATING);
  }

  // ---- 3. Minimum voltage rating -------------------------------------
  const voltageMargin =
    input.voltageType === "dc" ? DC_VOLTAGE_MARGIN_FACTOR : 1;
  const minimumVoltageRatingV = input.systemVoltageV * voltageMargin;

  // ---- 4. Minimum interrupt rating -----------------------------------
  const minimumInterruptRatingKa = input.availableFaultCurrentKa ?? 0;

  // ---- 5. Compatibility checks ---------------------------------------
  let voltageCompatible = true;
  let interruptCompatible = true;
  let currentRatingSufficient = true;

  // SPD current ratings follow a different convention — skip current checks
  const isSpd = input.technology === "spd";

  if (input.deviceVoltageRatingV !== undefined) {
    if (input.deviceVoltageRatingV < minimumVoltageRatingV) {
      voltageCompatible = false;
      errors.push(
        ERROR_DEVICE_VOLTAGE_TOO_LOW(
          round(minimumVoltageRatingV, 2),
          input.deviceVoltageRatingV,
        ),
      );
    }
  }

  if (
    input.deviceInterruptRatingKa !== undefined &&
    input.availableFaultCurrentKa !== undefined
  ) {
    if (input.deviceInterruptRatingKa < input.availableFaultCurrentKa) {
      interruptCompatible = false;
      errors.push(
        ERROR_DEVICE_INTERRUPT_TOO_LOW(
          input.availableFaultCurrentKa,
          input.deviceInterruptRatingKa,
        ),
      );
    }
  }

  if (!isSpd && input.deviceCurrentRatingA !== undefined) {
    if (input.deviceCurrentRatingA < designCurrentA) {
      currentRatingSufficient = false;
      errors.push(
        ERROR_DEVICE_CURRENT_TOO_LOW(
          round(designCurrentA, 2),
          input.deviceCurrentRatingA,
        ),
      );
    }
  }

  // ---- 6. Selected rating --------------------------------------------
  const selectedRatingA =
    !isSpd && input.deviceCurrentRatingA !== undefined
      ? input.deviceCurrentRatingA
      : recommendedRatingA;

  // ---- 7. Warnings ---------------------------------------------------
  if (factor > HIGH_SAFETY_FACTOR_THRESHOLD) {
    warnings.push(WARN_HIGH_SAFETY_FACTOR(factor));
  }

  if (input.availableFaultCurrentKa !== undefined) {
    if (input.availableFaultCurrentKa >= VERY_HIGH_FAULT_CURRENT_KA) {
      warnings.push(WARN_VERY_HIGH_FAULT_CURRENT(input.availableFaultCurrentKa));
    } else if (input.availableFaultCurrentKa >= HIGH_FAULT_CURRENT_KA) {
      warnings.push(WARN_HIGH_FAULT_CURRENT(input.availableFaultCurrentKa));
    }
  } else {
    warnings.push(WARN_NO_FAULT_CURRENT);
  }

  if (input.technology === "mcb" && designCurrentA > HIGH_CURRENT_THRESHOLD_A) {
    warnings.push(WARN_HIGH_CURRENT_MCB(round(designCurrentA, 1)));
  }

  if (input.voltageType === "dc" && input.technology === "mcb") {
    warnings.push(WARN_DC_BREAKER_ARC);
  }

  if (input.technology === "spd") {
    warnings.push(WARN_SPD_SEPARATE_ENGINE);
  }

  if (input.technology === "dc-isolator") {
    warnings.push(WARN_ISOLATOR_NOT_PROTECTION);
  }

  if (input.technology === "rcd") {
    warnings.push(WARN_RCD_REQUIRES_OVERCURRENT);
  }

  const isValid = errors.length === 0;

  return {
    role: input.role,
    technology: input.technology,
    designCurrentA: round(designCurrentA),
    recommendedRatingA: round(recommendedRatingA),
    minimumVoltageRatingV: round(minimumVoltageRatingV),
    minimumInterruptRatingKa: round(minimumInterruptRatingKa),
    voltageCompatible,
    interruptCompatible,
    currentRatingSufficient,
    selectedRatingA: round(selectedRatingA),
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
 * SolarAudit — Protection Engine: Public API
 *
 * Boundary:
 *   Input -> Validation -> Calculation -> Engineering Result
 *
 * Like the Charge Controller Engine, electrical compatibility checks
 * (device voltage / interrupt / current ratings) run during calculation,
 * so a structurally-valid input can still return isValid:false when a
 * candidate device is under-rated for the circuit.
 */

import type { ProtectionInput, ProtectionResult } from "./types";
import { validateInput } from "./validation";
import { calculateInternal } from "./calculation";

export * from "./types";

export function calculateProtection(
  input: ProtectionInput,
): ProtectionResult {
  const errors = validateInput(input);

  if (errors.length > 0) {
    return {
      role: input.role,
      technology: input.technology,
      designCurrentA: 0,
      recommendedRatingA: 0,
      minimumVoltageRatingV: 0,
      minimumInterruptRatingKa: 0,
      voltageCompatible: false,
      interruptCompatible: false,
      currentRatingSufficient: false,
      selectedRatingA: 0,
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
  ERROR_INVALID_VOLTAGE,
  ERROR_INVALID_VOLTAGE_TYPE,
  ERROR_INVALID_ROLE,
  ERROR_INVALID_TECHNOLOGY,
  ERROR_INVALID_SAFETY_FACTOR,
  ERROR_INVALID_FAULT_CURRENT,
} from "../errors";

const base = {
  role: "battery" as const,
  voltageType: "dc" as const,
  technology: "fuse" as const,
  continuousCurrentA: 100,
  systemVoltageV: 48,
};

describe("validateInput", () => {
  it("accepts a valid input", () => {
    expect(validateInput(base)).toEqual([]);
  });

  it("rejects zero current", () => {
    expect(validateInput({ ...base, continuousCurrentA: 0 }))
      .toContain(ERROR_INVALID_CURRENT);
  });

  it("rejects zero voltage", () => {
    expect(validateInput({ ...base, systemVoltageV: 0 }))
      .toContain(ERROR_INVALID_VOLTAGE);
  });

  it("rejects bad voltage type", () => {
    expect(validateInput({ ...base, voltageType: "xyz" as never }))
      .toContain(ERROR_INVALID_VOLTAGE_TYPE);
  });

  it("rejects unknown role", () => {
    expect(validateInput({ ...base, role: "unknown" as never }))
      .toContain(ERROR_INVALID_ROLE);
  });

  it("rejects unknown technology", () => {
    expect(validateInput({ ...base, technology: "xyz" as never }))
      .toContain(ERROR_INVALID_TECHNOLOGY);
  });

  it("rejects safety factor < 1", () => {
    expect(validateInput({ ...base, safetyFactor: 0.5 }))
      .toContain(ERROR_INVALID_SAFETY_FACTOR);
  });

  it("rejects negative fault current", () => {
    expect(validateInput({ ...base, availableFaultCurrentKa: -1 }))
      .toContain(ERROR_INVALID_FAULT_CURRENT);
  });

  it("collects multiple errors", () => {
    const errs = validateInput({
      ...base,
      continuousCurrentA: 0,
      systemVoltageV: 0,
      safetyFactor: 0.5,
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
import type { ProtectionInput } from "../types";

const baseBattery: ProtectionInput = {
  role: "battery",
  voltageType: "dc",
  technology: "dc-breaker",
  continuousCurrentA: 100,
  systemVoltageV: 48,
};

const basePv: ProtectionInput = {
  role: "pv-string",
  voltageType: "dc",
  technology: "fuse",
  continuousCurrentA: 10,
  systemVoltageV: 200,
};

describe("calculateInternal", () => {
  it("applies role-specific safety factor (battery = 1.25×)", () => {
    const r = calculateInternal(baseBattery);
    expect(r.designCurrentA).toBeCloseTo(125, 1);
  });

  it("applies role-specific safety factor (pv-string = 1.56×)", () => {
    const r = calculateInternal(basePv);
    expect(r.designCurrentA).toBeCloseTo(15.6, 1);
  });

  it("respects a caller-provided safety factor", () => {
    const r = calculateInternal({ ...baseBattery, safetyFactor: 1.5 });
    expect(r.designCurrentA).toBeCloseTo(150, 1);
  });

  it("recommends the next standard rating >= design current", () => {
    const r = calculateInternal(baseBattery); // design 125 A
    expect(r.recommendedRatingA).toBe(125);
  });

  it("rounds up to the next standard rating when needed", () => {
    const r = calculateInternal(basePv); // design 15.6 A -> 20 A
    expect(r.recommendedRatingA).toBe(20);
  });

  it("applies DC voltage margin (1.2×)", () => {
    const r = calculateInternal(baseBattery); // 48 × 1.2 = 57.6
    expect(r.minimumVoltageRatingV).toBeCloseTo(57.6, 1);
  });

  it("no DC margin for AC circuits", () => {
    const r = calculateInternal({
      ...baseBattery,
      voltageType: "ac",
      systemVoltageV: 230,
    });
    expect(r.minimumVoltageRatingV).toBe(230);
  });

  it("sets minimum interrupt rating from fault current", () => {
    const r = calculateInternal({ ...baseBattery, availableFaultCurrentKa: 6 });
    expect(r.minimumInterruptRatingKa).toBe(6);
  });

  it("flags an under-rated device voltage", () => {
    const r = calculateInternal({
      ...baseBattery,
      deviceVoltageRatingV: 50, // below 57.6 V minimum
    });
    expect(r.voltageCompatible).toBe(false);
    expect(r.isValid).toBe(false);
  });

  it("flags an under-rated interrupt capability", () => {
    const r = calculateInternal({
      ...baseBattery,
      availableFaultCurrentKa: 10,
      deviceInterruptRatingKa: 6,
    });
    expect(r.interruptCompatible).toBe(false);
    expect(r.isValid).toBe(false);
  });

  it("flags an under-rated device current", () => {
    const r = calculateInternal({
      ...baseBattery,
      deviceCurrentRatingA: 100, // design is 125 A
    });
    expect(r.currentRatingSufficient).toBe(false);
    expect(r.isValid).toBe(false);
  });

  it("accepts a properly rated device", () => {
    const r = calculateInternal({
      ...baseBattery,
      deviceVoltageRatingV: 125,
      deviceInterruptRatingKa: 10,
      deviceCurrentRatingA: 150,
      availableFaultCurrentKa: 6,
    });
    expect(r.isValid).toBe(true);
    expect(r.voltageCompatible).toBe(true);
    expect(r.interruptCompatible).toBe(true);
    expect(r.currentRatingSufficient).toBe(true);
    expect(r.selectedRatingA).toBe(150);
  });

  it("warns when fault current is not provided", () => {
    const r = calculateInternal(baseBattery);
    expect(r.warnings.some((w) => /fault current not provided/i.test(w))).toBe(true);
  });

  it("warns on very high fault current", () => {
    const r = calculateInternal({ ...baseBattery, availableFaultCurrentKa: 30 });
    expect(r.warnings.some((w) => /coordination/i.test(w))).toBe(true);
  });

  it("warns on DC circuit protected by MCB", () => {
    const r = calculateInternal({ ...baseBattery, technology: "mcb" });
    expect(r.warnings.some((w) => /DC circuits/i.test(w))).toBe(true);
  });

  it("warns that SPD uses a different sizing convention", () => {
    const r = calculateInternal({ ...baseBattery, technology: "spd" });
    expect(r.warnings.some((w) => /SPD/i.test(w))).toBe(true);
  });

  it("warns that DC isolator is not over-current protection", () => {
    const r = calculateInternal({ ...baseBattery, technology: "dc-isolator" });
    expect(r.warnings.some((w) => /disconnection/i.test(w))).toBe(true);
  });

  it("warns that RCD requires over-current protection too", () => {
    const r = calculateInternal({
      ...baseBattery,
      voltageType: "ac",
      technology: "rcd",
    });
    expect(r.warnings.some((w) => /RCD|earth-leakage/i.test(w))).toBe(true);
  });
});
EOF

# ----------------------------------------------------------------------
# __tests__/integration.test.ts
# ----------------------------------------------------------------------
cat > "$ROOT/__tests__/integration.test.ts" <<'EOF'
import { describe, it, expect } from "vitest";
import { calculateProtection } from "../index";

describe("calculateProtection (public API)", () => {
  it("returns invalid on structural errors", () => {
    const r = calculateProtection({
      role: "battery",
      voltageType: "dc",
      technology: "fuse",
      continuousCurrentA: 0,
      systemVoltageV: 48,
    });
    expect(r.isValid).toBe(false);
    expect(r.errors.length).toBeGreaterThan(0);
  });

  it("sizes a 48 V battery fuse for a 100 A circuit", () => {
    const r = calculateProtection({
      role: "battery",
      voltageType: "dc",
      technology: "fuse",
      continuousCurrentA: 100,
      systemVoltageV: 48,
      availableFaultCurrentKa: 6,
    });
    expect(r.isValid).toBe(true);
    expect(r.designCurrentA).toBeCloseTo(125, 1);
    expect(r.recommendedRatingA).toBe(125);
    expect(r.minimumVoltageRatingV).toBeCloseTo(57.6, 1);
    expect(r.minimumInterruptRatingKa).toBe(6);
  });

  it("sizes a PV string fuse with NEC 1.56× factor", () => {
    const r = calculateProtection({
      role: "pv-string",
      voltageType: "dc",
      technology: "fuse",
      continuousCurrentA: 10,
      systemVoltageV: 200,
      availableFaultCurrentKa: 3,
    });
    expect(r.isValid).toBe(true);
    expect(r.designCurrentA).toBeCloseTo(15.6, 1);
    expect(r.recommendedRatingA).toBe(20);
    expect(r.minimumVoltageRatingV).toBeCloseTo(240, 1);
  });

  it("returns invalid when a candidate device is under-rated", () => {
    const r = calculateProtection({
      role: "battery",
      voltageType: "dc",
      technology: "dc-breaker",
      continuousCurrentA: 100,
      systemVoltageV: 48,
      availableFaultCurrentKa: 10,
      deviceVoltageRatingV: 48,  // < 57.6 required
      deviceInterruptRatingKa: 5, // < 10 required
      deviceCurrentRatingA: 100,  // < 125 required
    });
    expect(r.isValid).toBe(false);
    expect(r.voltageCompatible).toBe(false);
    expect(r.interruptCompatible).toBe(false);
    expect(r.currentRatingSufficient).toBe(false);
    expect(r.errors.length).toBeGreaterThanOrEqual(3);
  });

  it("accepts a correctly rated device", () => {
    const r = calculateProtection({
      role: "inverter-dc",
      voltageType: "dc",
      technology: "dc-breaker",
      continuousCurrentA: 120,
      systemVoltageV: 48,
      availableFaultCurrentKa: 6,
      deviceVoltageRatingV: 125,
      deviceInterruptRatingKa: 10,
      deviceCurrentRatingA: 150,
    });
    expect(r.isValid).toBe(true);
    expect(r.errors).toEqual([]);
    expect(r.selectedRatingA).toBe(150);
  });
});
EOF

echo "✔ Protection engine scaffolded at: $ROOT"
echo
if command -v tree >/dev/null 2>&1; then
  tree "$ROOT"
else
  find "$ROOT" -type f | sort
fi