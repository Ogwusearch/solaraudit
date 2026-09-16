#!/usr/bin/env bash
# scaffold-battery-engine.sh
# Generates the SolarAudit Battery Engine module.

set -euo pipefail

ROOT="/home/ogwu/workspace/solaraudit/src/engineering/battery"

mkdir -p "$ROOT/__tests__"

# ----------------------------------------------------------------------
# types.ts
# ----------------------------------------------------------------------
cat > "$ROOT/types.ts" <<'EOF'
/**
 * SolarAudit — Battery Engine: Types
 *
 * Pure data definitions. No logic, no imports from siblings.
 */

export type BatteryTechnology =
  | "flooded-lead-acid"
  | "agm"
  | "gel"
  | "lifepo4"
  | "li-ion-nmc";

export interface BatteryCellSpec {
  readonly name: string;
  readonly technology: BatteryTechnology;
  readonly nominalVoltage: number;   // V (e.g. 12, 24, 48)
  readonly capacityAh: number;       // Ah per unit
  readonly maxDepthOfDischarge: number; // 0..1 (battery's own limit)
  readonly roundTripEfficiency: number; // 0..1
  readonly maxChargeCurrentA?: number;  // optional per-unit limit
}

export interface BatteryInput {
  readonly dailyEnergyKwh: number;      // from Energy/Load engine
  readonly autonomyDays: number;        // days of backup, >= 0
  readonly systemVoltage: number;       // V (12, 24, 36, 48, ...)
  readonly designMargin: number;        // fraction, e.g. 0.1 = 10%
  readonly temperatureDerating: number; // 0..1 (0.85 typical)
  readonly maxDepthOfDischarge: number; // 0..1 (design DoD)
  readonly roundTripEfficiency: number; // 0..1 (design RTE)
  readonly cell: BatteryCellSpec;
  readonly maxParallelStrings?: number; // optional cap
}

export interface BatteryResult {
  readonly requiredCapacityKwh: number;    // usable energy after all derating
  readonly designCapacityKwh: number;      // with design margin
  readonly totalCells: number;
  readonly seriesCells: number;
  readonly parallelStrings: number;
  readonly actualInstalledKwh: number;     // nameplate energy (nominal V × Ah)
  readonly actualUsableKwh: number;        // after DoD
  readonly bankVoltage: number;            // series × cell nominal V
  readonly bankCapacityAh: number;         // parallel × cell Ah
  readonly maxChargeCurrentA: number;      // total for the bank
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
 * SolarAudit — Battery Engine: Constants
 */

export const DEFAULT_DESIGN_MARGIN = 0.1;
export const DEFAULT_TEMPERATURE_DERATING = 0.85;
export const DEFAULT_DOD = 0.5;
export const DEFAULT_RTE = 0.9;

export const MIN_DESIGN_MARGIN = 0.0;
export const MAX_DESIGN_MARGIN = 1.0;

export const MIN_TEMP_DERATING = 0.5;
export const MAX_TEMP_DERATING = 1.0;

export const MIN_DOD = 0.0;
export const MAX_DOD = 1.0;

export const MIN_RTE = 0.0;
export const MAX_RTE = 1.0;

export const SUPPORTED_SYSTEM_VOLTAGES = [12, 24, 36, 48];

export const HIGH_AUTONOMY_THRESHOLD = 3;   // > 3 days => warn
export const LOW_TEMP_DERATING_THRESHOLD = 0.7;
export const HIGH_DOD_THRESHOLD = 0.8;

export const ROUND_DECIMALS = 3;
EOF

# ----------------------------------------------------------------------
# errors.ts
# ----------------------------------------------------------------------
cat > "$ROOT/errors.ts" <<'EOF'
/**
 * SolarAudit — Battery Engine: Error & Warning Messages
 */

export const ERROR_INVALID_DAILY_ENERGY =
  "dailyEnergyKwh must be > 0.";

export const ERROR_INVALID_AUTONOMY =
  "autonomyDays must be >= 0.";

export const ERROR_INVALID_SYSTEM_VOLTAGE =
  "systemVoltage must be > 0.";

export const ERROR_INVALID_DESIGN_MARGIN =
  "designMargin must be >= 0.";

export const ERROR_INVALID_TEMP_DERATING =
  "temperatureDerating must be between 0 and 1.";

export const ERROR_INVALID_DOD =
  "maxDepthOfDischarge must be between 0 and 1.";

export const ERROR_INVALID_RTE =
  "roundTripEfficiency must be between 0 and 1.";

export const ERROR_CELL_VOLTAGE =
  "cell.nominalVoltage must be > 0.";

export const ERROR_CELL_CAPACITY =
  "cell.capacityAh must be > 0.";

export const ERROR_CELL_DOD =
  "cell.maxDepthOfDischarge must be between 0 and 1.";

export const ERROR_CELL_RTE =
  "cell.roundTripEfficiency must be between 0 and 1.";

export const ERROR_INVALID_MAX_PARALLEL =
  "maxParallelStrings must be an integer >= 1 when provided.";

export const ERROR_VOLTAGE_MISMATCH =
  "systemVoltage must be an integer multiple of cell.nominalVoltage.";

export const ERROR_DOD_EXCEEDS_CELL =
  "Design DoD exceeds cell.maxDepthOfDischarge.";

export const WARN_HIGH_AUTONOMY = (days: number): string =>
  `Autonomy of ${days} days is high; battery cost will dominate the design.`;

export const WARN_LOW_TEMP_DERATING = (value: number): string =>
  `Temperature derating is low (${value}). Verify cold-climate operation.`;

export const WARN_HIGH_DOD = (value: number): string =>
  `Design DoD is high (${value}). Cycle life will be reduced.`;

export const WARN_UNSUPPORTED_SYSTEM_VOLTAGE = (value: number): string =>
  `systemVoltage ${value} V is unusual; typical values are 12 / 24 / 36 / 48 V.`;

export const WARN_PARALLEL_LIMIT =
  "Parallel string cap prevented an ideal configuration; consider larger cells.";
EOF

# ----------------------------------------------------------------------
# validation.ts
# ----------------------------------------------------------------------
cat > "$ROOT/validation.ts" <<'EOF'
/**
 * SolarAudit — Battery Engine: Validation
 *
 * Collects ALL errors. Never throws. Returns string[] (empty == valid).
 */

import type { BatteryInput } from "./types";
import {
  ERROR_INVALID_DAILY_ENERGY,
  ERROR_INVALID_AUTONOMY,
  ERROR_INVALID_SYSTEM_VOLTAGE,
  ERROR_INVALID_DESIGN_MARGIN,
  ERROR_INVALID_TEMP_DERATING,
  ERROR_INVALID_DOD,
  ERROR_INVALID_RTE,
  ERROR_CELL_VOLTAGE,
  ERROR_CELL_CAPACITY,
  ERROR_CELL_DOD,
  ERROR_CELL_RTE,
  ERROR_INVALID_MAX_PARALLEL,
  ERROR_VOLTAGE_MISMATCH,
  ERROR_DOD_EXCEEDS_CELL,
} from "./errors";

export function validateInput(input: BatteryInput): string[] {
  const errors: string[] = [];

  if (input.dailyEnergyKwh <= 0) errors.push(ERROR_INVALID_DAILY_ENERGY);
  if (input.autonomyDays < 0) errors.push(ERROR_INVALID_AUTONOMY);
  if (input.systemVoltage <= 0) errors.push(ERROR_INVALID_SYSTEM_VOLTAGE);
  if (input.designMargin < 0) errors.push(ERROR_INVALID_DESIGN_MARGIN);
  if (input.temperatureDerating <= 0 || input.temperatureDerating > 1) {
    errors.push(ERROR_INVALID_TEMP_DERATING);
  }
  if (input.maxDepthOfDischarge <= 0 || input.maxDepthOfDischarge > 1) {
    errors.push(ERROR_INVALID_DOD);
  }
  if (input.roundTripEfficiency <= 0 || input.roundTripEfficiency > 1) {
    errors.push(ERROR_INVALID_RTE);
  }

  const c = input.cell;
  if (c.nominalVoltage <= 0) errors.push(ERROR_CELL_VOLTAGE);
  if (c.capacityAh <= 0) errors.push(ERROR_CELL_CAPACITY);
  if (c.maxDepthOfDischarge <= 0 || c.maxDepthOfDischarge > 1) {
    errors.push(ERROR_CELL_DOD);
  }
  if (c.roundTripEfficiency <= 0 || c.roundTripEfficiency > 1) {
    errors.push(ERROR_CELL_RTE);
  }

  if (
    input.maxParallelStrings !== undefined &&
    (!Number.isInteger(input.maxParallelStrings) || input.maxParallelStrings < 1)
  ) {
    errors.push(ERROR_INVALID_MAX_PARALLEL);
  }

  // Voltage compatibility
  if (
    c.nominalVoltage > 0 &&
    input.systemVoltage > 0 &&
    input.systemVoltage % c.nominalVoltage !== 0
  ) {
    errors.push(ERROR_VOLTAGE_MISMATCH);
  }

  // DoD compatibility
  if (
    input.maxDepthOfDischarge > 0 &&
    c.maxDepthOfDischarge > 0 &&
    input.maxDepthOfDischarge > c.maxDepthOfDischarge
  ) {
    errors.push(ERROR_DOD_EXCEEDS_CELL);
  }

  return errors;
}
EOF

# ----------------------------------------------------------------------
# calculation.ts
# ----------------------------------------------------------------------
cat > "$ROOT/calculation.ts" <<'EOF'
/**
 * SolarAudit — Battery Engine: Calculation
 *
 * Pure math. Assumes input is valid.
 *
 * Model:
 *   usableEnergy    = dailyEnergy × autonomyDays
 *   requiredKwh     = usableEnergy
 *                     / (DoD × RTE × temperatureDerating)
 *   designKwh       = requiredKwh × (1 + designMargin)
 *
 *   seriesCells     = systemVoltage / cellVoltage
 *   parallelStrings = ceil(designKwh / (seriesCells × cellV × cellAh / 1000))
 *   totalCells      = seriesCells × parallelStrings
 */

import type { BatteryInput, BatteryResult } from "./types";
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

function round(value: number, decimals = ROUND_DECIMALS): number {
  const factor = 10 ** decimals;
  return Math.round(value * factor) / factor;
}

export function calculateInternal(input: BatteryInput): BatteryResult {
  const warnings: string[] = [];

  // ---- 1. Required energy ---------------------------------------------
  const usableEnergyKwh = input.dailyEnergyKwh * input.autonomyDays;
  const deratingFactor =
    input.maxDepthOfDischarge *
    input.roundTripEfficiency *
    input.temperatureDerating;

  const requiredCapacityKwh = usableEnergyKwh / deratingFactor;
  const designCapacityKwh = requiredCapacityKwh * (1 + input.designMargin);

  // ---- 2. Topology ----------------------------------------------------
  const seriesCells = Math.round(
    input.systemVoltage / input.cell.nominalVoltage,
  );
  const perStringKwh =
    (seriesCells * input.cell.nominalVoltage * input.cell.capacityAh) / 1000;

  let parallelStrings = Math.max(1, Math.ceil(designCapacityKwh / perStringKwh));

  if (
    input.maxParallelStrings !== undefined &&
    parallelStrings > input.maxParallelStrings
  ) {
    warnings.push(WARN_PARALLEL_LIMIT);
    parallelStrings = input.maxParallelStrings;
  }

  const totalCells = seriesCells * parallelStrings;
  const actualInstalledKwh = perStringKwh * parallelStrings;
  const actualUsableKwh = actualInstalledKwh * input.maxDepthOfDischarge;
  const bankVoltage = seriesCells * input.cell.nominalVoltage;
  const bankCapacityAh = parallelStrings * input.cell.capacityAh;

  const maxChargeCurrentA =
    input.cell.maxChargeCurrentA !== undefined
      ? input.cell.maxChargeCurrentA * parallelStrings
      : 0;

  // ---- 3. Warnings ----------------------------------------------------
  if (input.autonomyDays > HIGH_AUTONOMY_THRESHOLD) {
    warnings.push(WARN_HIGH_AUTONOMY(input.autonomyDays));
  }
  if (input.temperatureDerating < LOW_TEMP_DERATING_THRESHOLD) {
    warnings.push(WARN_LOW_TEMP_DERATING(input.temperatureDerating));
  }
  if (input.maxDepthOfDischarge > HIGH_DOD_THRESHOLD) {
    warnings.push(WARN_HIGH_DOD(input.maxDepthOfDischarge));
  }
  if (!SUPPORTED_SYSTEM_VOLTAGES.includes(input.systemVoltage)) {
    warnings.push(WARN_UNSUPPORTED_SYSTEM_VOLTAGE(input.systemVoltage));
  }

  return {
    requiredCapacityKwh: round(requiredCapacityKwh),
    designCapacityKwh: round(designCapacityKwh),
    totalCells,
    seriesCells,
    parallelStrings,
    actualInstalledKwh: round(actualInstalledKwh),
    actualUsableKwh: round(actualUsableKwh),
    bankVoltage: round(bankVoltage),
    bankCapacityAh: round(bankCapacityAh),
    maxChargeCurrentA: round(maxChargeCurrentA),
    warnings,
    errors: [],
    isValid: true,
  };
}
EOF

# ----------------------------------------------------------------------
# index.ts
# ----------------------------------------------------------------------
cat > "$ROOT/index.ts" <<'EOF'
/**
 * SolarAudit — Battery Engine: Public API
 *
 * Boundary:
 *   Input -> Validation -> Calculation -> Engineering Result
 */

import type { BatteryInput, BatteryResult } from "./types";
import { validateInput } from "./validation";
import { calculateInternal } from "./calculation";

export * from "./types";

export function calculateBattery(input: BatteryInput): BatteryResult {
  const errors = validateInput(input);

  if (errors.length > 0) {
    return {
      requiredCapacityKwh: 0,
      designCapacityKwh: 0,
      totalCells: 0,
      seriesCells: 0,
      parallelStrings: 0,
      actualInstalledKwh: 0,
      actualUsableKwh: 0,
      bankVoltage: 0,
      bankCapacityAh: 0,
      maxChargeCurrentA: 0,
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
  ERROR_INVALID_DAILY_ENERGY,
  ERROR_INVALID_AUTONOMY,
  ERROR_VOLTAGE_MISMATCH,
  ERROR_DOD_EXCEEDS_CELL,
  ERROR_INVALID_MAX_PARALLEL,
} from "../errors";

const cell = {
  name: "LFP-100",
  technology: "lifepo4" as const,
  nominalVoltage: 12,
  capacityAh: 100,
  maxDepthOfDischarge: 0.9,
  roundTripEfficiency: 0.95,
};

const base = {
  dailyEnergyKwh: 5,
  autonomyDays: 1,
  systemVoltage: 48,
  designMargin: 0.1,
  temperatureDerating: 0.85,
  maxDepthOfDischarge: 0.8,
  roundTripEfficiency: 0.9,
  cell,
};

describe("validateInput", () => {
  it("accepts a valid input", () => {
    expect(validateInput(base)).toEqual([]);
  });

  it("rejects non-positive daily energy", () => {
    expect(validateInput({ ...base, dailyEnergyKwh: 0 }))
      .toContain(ERROR_INVALID_DAILY_ENERGY);
  });

  it("rejects negative autonomy", () => {
    expect(validateInput({ ...base, autonomyDays: -1 }))
      .toContain(ERROR_INVALID_AUTONOMY);
  });

  it("rejects non-multiple system voltage", () => {
    const errs = validateInput({ ...base, systemVoltage: 50 });
    expect(errs).toContain(ERROR_VOLTAGE_MISMATCH);
  });

  it("rejects DoD above cell max", () => {
    const errs = validateInput({ ...base, maxDepthOfDischarge: 0.95 });
    expect(errs).toContain(ERROR_DOD_EXCEEDS_CELL);
  });

  it("rejects bad maxParallelStrings", () => {
    const errs = validateInput({ ...base, maxParallelStrings: 0 });
    expect(errs).toContain(ERROR_INVALID_MAX_PARALLEL);
  });
});
EOF

# ----------------------------------------------------------------------
# __tests__/calculation.test.ts
# ----------------------------------------------------------------------
cat > "$ROOT/__tests__/calculation.test.ts" <<'EOF'
import { describe, it, expect } from "vitest";
import { calculateInternal } from "../calculation";
import type { BatteryInput } from "../types";

const cell = {
  name: "LFP-100",
  technology: "lifepo4" as const,
  nominalVoltage: 12,
  capacityAh: 100,
  maxDepthOfDischarge: 0.9,
  roundTripEfficiency: 0.95,
  maxChargeCurrentA: 50,
};

const baseInput: BatteryInput = {
  dailyEnergyKwh: 5,
  autonomyDays: 1,
  systemVoltage: 48,
  designMargin: 0.1,
  temperatureDerating: 0.85,
  maxDepthOfDischarge: 0.8,
  roundTripEfficiency: 0.9,
  cell,
};

describe("calculateInternal", () => {
  it("computes required capacity with derating", () => {
    // usable = 5 kWh
    // factor = 0.8 × 0.9 × 0.85 = 0.612
    // required = 5 / 0.612 = 8.170 kWh
    const r = calculateInternal(baseInput);
    expect(r.requiredCapacityKwh).toBeCloseTo(8.17, 1);
  });

  it("applies design margin", () => {
    const r = calculateInternal(baseInput);
    expect(r.designCapacityKwh).toBeCloseTo(r.requiredCapacityKwh * 1.1, 1);
  });

  it("computes correct series cells for system voltage", () => {
    const r = calculateInternal(baseInput);
    expect(r.seriesCells).toBe(4);      // 48 / 12
    expect(r.bankVoltage).toBe(48);
  });

  it("picks enough parallel strings to meet design capacity", () => {
    const r = calculateInternal(baseInput);
    expect(r.actualInstalledKwh).toBeGreaterThanOrEqual(r.designCapacityKwh);
    expect(r.totalCells).toBe(r.seriesCells * r.parallelStrings);
  });

  it("reports usable energy after DoD", () => {
    const r = calculateInternal(baseInput);
    expect(r.actualUsableKwh).toBeCloseTo(
      r.actualInstalledKwh * baseInput.maxDepthOfDischarge,
      1,
    );
  });

  it("respects maxParallelStrings", () => {
    const r = calculateInternal({ ...baseInput, maxParallelStrings: 1 });
    expect(r.parallelStrings).toBe(1);
    expect(r.warnings.length).toBeGreaterThan(0);
  });

  it("computes bank charge current", () => {
    const r = calculateInternal(baseInput);
    expect(r.maxChargeCurrentA).toBeCloseTo(50 * r.parallelStrings, 1);
  });

  it("scales with autonomy days", () => {
    const r1 = calculateInternal({ ...baseInput, autonomyDays: 1 });
    const r2 = calculateInternal({ ...baseInput, autonomyDays: 2 });
    expect(r2.requiredCapacityKwh).toBeCloseTo(r1.requiredCapacityKwh * 2, 1);
  });
});
EOF

# ----------------------------------------------------------------------
# __tests__/integration.test.ts
# ----------------------------------------------------------------------
cat > "$ROOT/__tests__/integration.test.ts" <<'EOF'
import { describe, it, expect } from "vitest";
import { calculateBattery } from "../index";

const cell = {
  name: "LFP-100",
  technology: "lifepo4" as const,
  nominalVoltage: 12,
  capacityAh: 100,
  maxDepthOfDischarge: 0.9,
  roundTripEfficiency: 0.95,
};

describe("calculateBattery (public API)", () => {
  it("returns invalid on bad input", () => {
    const r = calculateBattery({
      dailyEnergyKwh: 0,
      autonomyDays: 1,
      systemVoltage: 48,
      designMargin: 0.1,
      temperatureDerating: 0.85,
      maxDepthOfDischarge: 0.8,
      roundTripEfficiency: 0.9,
      cell,
    });
    expect(r.isValid).toBe(false);
    expect(r.errors.length).toBeGreaterThan(0);
  });

  it("sizes a 48 V, 1-day autonomy bank for a 5 kWh/day home", () => {
    const r = calculateBattery({
      dailyEnergyKwh: 5,
      autonomyDays: 1,
      systemVoltage: 48,
      designMargin: 0.1,
      temperatureDerating: 0.85,
      maxDepthOfDischarge: 0.8,
      roundTripEfficiency: 0.9,
      cell,
    });
    expect(r.isValid).toBe(true);
    expect(r.bankVoltage).toBe(48);
    expect(r.actualInstalledKwh).toBeGreaterThanOrEqual(r.designCapacityKwh);
  });

  it("handles a 3-day autonomy with warning", () => {
    const r = calculateBattery({
      dailyEnergyKwh: 5,
      autonomyDays: 4,
      systemVoltage: 48,
      designMargin: 0.1,
      temperatureDerating: 0.85,
      maxDepthOfDischarge: 0.8,
      roundTripEfficiency: 0.9,
      cell,
    });
    expect(r.isValid).toBe(true);
    expect(r.warnings.some((w) => /autonomy/i.test(w))).toBe(true);
  });
});
EOF

echo "✔ Battery engine scaffolded at: $ROOT"
echo
if command -v tree >/dev/null 2>&1; then
  tree "$ROOT"
else
  find "$ROOT" -type f | sort
fi