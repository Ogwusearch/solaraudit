#!/usr/bin/env bash
# scaffold-inverter-engine.sh
# Generates the SolarAudit Inverter Engine module.

set -euo pipefail

ROOT="/home/ogwu/workspace/solaraudit/src/engineering/inverter"

mkdir -p "$ROOT/__tests__"

# ----------------------------------------------------------------------
# types.ts
# ----------------------------------------------------------------------
cat > "$ROOT/types.ts" <<'EOF'
/**
 * SolarAudit — Inverter Engine: Types
 *
 * Pure data definitions. No logic, no imports from siblings.
 */

export type InverterType = "pure-sine" | "modified-sine";
export type InverterTopology = "off-grid" | "grid-tied" | "hybrid";

export interface InverterInput {
  readonly continuousLoadW: number;      // sustained running load (W)
  readonly peakLoadW: number;            // short-duration peak (W), >= continuous
  readonly surgeLoadW: number;           // motor-start / inrush (W), >= peak

  readonly systemVoltage: number;        // DC input voltage (V), e.g. 12/24/48
  readonly outputVoltage: number;        // AC output voltage (V)
  readonly outputFrequency: number;      // Hz (50 or 60)
  readonly powerFactor: number;          // 0..1, load PF

  readonly designMargin: number;         // fraction, e.g. 0.25 = 25%
  readonly inverterEfficiency: number;   // 0..1
  readonly surgeDurationSec?: number;    // informational, seconds

  readonly type?: InverterType;
  readonly topology?: InverterTopology;

  readonly maxDcInputCurrentA?: number;  // optional site/battery limit
}

export interface InverterResult {
  readonly continuousVa: number;
  readonly peakVa: number;
  readonly surgeVa: number;
  readonly minInverterVa: number;        // = peakVa / PF, with margin
  readonly recommendedInverterVa: number;// rounded up to standard size
  readonly requiredSurgeVa: number;      // = surgeVa / PF
  readonly dcInputCurrentA: number;      // at peak continuous load
  readonly dcSurgeCurrentA: number;      // during surge
  readonly recommendedStandardVa: number;
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
 * SolarAudit — Inverter Engine: Constants
 */

export const DEFAULT_DESIGN_MARGIN = 0.25;
export const DEFAULT_INVERTER_EFFICIENCY = 0.9;
export const DEFAULT_POWER_FACTOR = 0.8;

export const MIN_DESIGN_MARGIN = 0.0;
export const MAX_DESIGN_MARGIN = 1.0;

export const MIN_INVERTER_EFFICIENCY = 0.5;
export const MAX_INVERTER_EFFICIENCY = 1.0;

export const MIN_POWER_FACTOR = 0.1;
export const MAX_POWER_FACTOR = 1.0;

export const SUPPORTED_OUTPUT_VOLTAGES = [120, 220, 230, 240];
export const SUPPORTED_FREQUENCIES = [50, 60];

export const STANDARD_INVERTER_SIZES_VA = [
  300, 500, 800, 1000, 1200, 1500, 2000, 2500, 3000, 4000, 5000, 6000,
  8000, 10000, 12000, 15000, 20000,
];

export const SURGE_RATIO_MIN = 2.0;    // recommended surge headroom
export const SURGE_RATIO_MAX = 3.0;

export const LOW_EFFICIENCY_THRESHOLD = 0.85;
export const LOW_POWER_FACTOR_THRESHOLD = 0.7;
export const HIGH_SURGE_RATIO_THRESHOLD = 3.0;

export const ROUND_DECIMALS = 3;
EOF

# ----------------------------------------------------------------------
# errors.ts
# ----------------------------------------------------------------------
cat > "$ROOT/errors.ts" <<'EOF'
/**
 * SolarAudit — Inverter Engine: Error & Warning Messages
 */

export const ERROR_INVALID_CONTINUOUS_LOAD =
  "continuousLoadW must be > 0.";

export const ERROR_INVALID_PEAK_LOAD =
  "peakLoadW must be >= continuousLoadW.";

export const ERROR_INVALID_SURGE_LOAD =
  "surgeLoadW must be >= peakLoadW.";

export const ERROR_INVALID_SYSTEM_VOLTAGE =
  "systemVoltage must be > 0.";

export const ERROR_INVALID_OUTPUT_VOLTAGE =
  "outputVoltage must be > 0.";

export const ERROR_INVALID_OUTPUT_FREQUENCY =
  "outputFrequency must be > 0.";

export const ERROR_INVALID_POWER_FACTOR =
  "powerFactor must be between 0 and 1.";

export const ERROR_INVALID_DESIGN_MARGIN =
  "designMargin must be >= 0.";

export const ERROR_INVALID_EFFICIENCY =
  "inverterEfficiency must be between 0 and 1.";

export const ERROR_INVALID_SURGE_DURATION =
  "surgeDurationSec must be >= 0 when provided.";

export const ERROR_INVALID_MAX_DC_CURRENT =
  "maxDcInputCurrentA must be > 0 when provided.";

export const WARN_UNSUPPORTED_OUTPUT_VOLTAGE = (value: number): string =>
  `Output voltage ${value} V is unusual; typical values are 120 / 220 / 230 / 240 V.`;

export const WARN_UNSUPPORTED_FREQUENCY = (value: number): string =>
  `Output frequency ${value} Hz is unusual; typical values are 50 or 60 Hz.`;

export const WARN_LOW_EFFICIENCY = (value: number): string =>
  `Inverter efficiency is low (${value}). Higher losses at full load.`;

export const WARN_LOW_POWER_FACTOR = (value: number): string =>
  `Power factor is low (${value}). VA rating requirement increases.`;

export const WARN_HIGH_SURGE_RATIO = (value: number): string =>
  `Surge-to-continuous ratio is high (${value}×). Verify motor-start capability.`;

export const WARN_DC_CURRENT_EXCEEDS_LIMIT = (value: number): string =>
  `Calculated DC input current (${value} A) exceeds the configured limit.`;

export const WARN_NO_STANDARD_MATCH =
  "Recommended inverter size exceeds the standard size table; verify against vendor catalogue.";
EOF

# ----------------------------------------------------------------------
# validation.ts
# ----------------------------------------------------------------------
cat > "$ROOT/validation.ts" <<'EOF'
/**
 * SolarAudit — Inverter Engine: Validation
 *
 * Collects ALL errors. Never throws. Returns string[] (empty == valid).
 */

import type { InverterInput } from "./types";
import {
  ERROR_INVALID_CONTINUOUS_LOAD,
  ERROR_INVALID_PEAK_LOAD,
  ERROR_INVALID_SURGE_LOAD,
  ERROR_INVALID_SYSTEM_VOLTAGE,
  ERROR_INVALID_OUTPUT_VOLTAGE,
  ERROR_INVALID_OUTPUT_FREQUENCY,
  ERROR_INVALID_POWER_FACTOR,
  ERROR_INVALID_DESIGN_MARGIN,
  ERROR_INVALID_EFFICIENCY,
  ERROR_INVALID_SURGE_DURATION,
  ERROR_INVALID_MAX_DC_CURRENT,
} from "./errors";

export function validateInput(input: InverterInput): string[] {
  const errors: string[] = [];

  if (input.continuousLoadW <= 0) errors.push(ERROR_INVALID_CONTINUOUS_LOAD);
  if (input.peakLoadW < input.continuousLoadW) errors.push(ERROR_INVALID_PEAK_LOAD);
  if (input.surgeLoadW < input.peakLoadW) errors.push(ERROR_INVALID_SURGE_LOAD);

  if (input.systemVoltage <= 0) errors.push(ERROR_INVALID_SYSTEM_VOLTAGE);
  if (input.outputVoltage <= 0) errors.push(ERROR_INVALID_OUTPUT_VOLTAGE);
  if (input.outputFrequency <= 0) errors.push(ERROR_INVALID_OUTPUT_FREQUENCY);

  if (input.powerFactor <= 0 || input.powerFactor > 1) {
    errors.push(ERROR_INVALID_POWER_FACTOR);
  }
  if (input.designMargin < 0) errors.push(ERROR_INVALID_DESIGN_MARGIN);
  if (input.inverterEfficiency <= 0 || input.inverterEfficiency > 1) {
    errors.push(ERROR_INVALID_EFFICIENCY);
  }
  if (input.surgeDurationSec !== undefined && input.surgeDurationSec < 0) {
    errors.push(ERROR_INVALID_SURGE_DURATION);
  }
  if (input.maxDcInputCurrentA !== undefined && input.maxDcInputCurrentA <= 0) {
    errors.push(ERROR_INVALID_MAX_DC_CURRENT);
  }

  return errors;
}
EOF

# ----------------------------------------------------------------------
# calculation.ts
# ----------------------------------------------------------------------
cat > "$ROOT/calculation.ts" <<'EOF'
/**
 * SolarAudit — Inverter Engine: Calculation
 *
 * Pure math. Assumes input is valid.
 *
 * Model:
 *   continuousVa = continuousLoadW / powerFactor
 *   peakVa       = peakLoadW       / powerFactor
 *   surgeVa      = surgeLoadW      / powerFactor
 *   minInverterVa        = peakVa × (1 + designMargin)
 *   recommendedInverterVa = ceil(minInverterVa to next standard size)
 *   requiredSurgeVa       = surgeVa × (1 + designMargin)
 *
 *   dcInputCurrentA = peakLoadW / (inverterEfficiency × systemVoltage)
 *   dcSurgeCurrentA = surgeLoadW / (inverterEfficiency × systemVoltage)
 */

import type { InverterInput, InverterResult } from "./types";
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

function round(value: number, decimals = ROUND_DECIMALS): number {
  const factor = 10 ** decimals;
  return Math.round(value * factor) / factor;
}

function nextStandardSize(va: number): number | null {
  for (const s of STANDARD_INVERTER_SIZES_VA) {
    if (s >= va) return s;
  }
  return null;
}

export function calculateInternal(input: InverterInput): InverterResult {
  const warnings: string[] = [];

  const pf = input.powerFactor;

  // ---- 1. Apparent-power conversions ---------------------------------
  const continuousVa = input.continuousLoadW / pf;
  const peakVa = input.peakLoadW / pf;
  const surgeVa = input.surgeLoadW / pf;

  // ---- 2. Minimum and recommended inverter size ----------------------
  const minInverterVa = peakVa * (1 + input.designMargin);
  const requiredSurgeVa = surgeVa * (1 + input.designMargin);

  const standardMatch = nextStandardSize(minInverterVa);
  const recommendedInverterVa = standardMatch ?? minInverterVa;

  if (standardMatch === null) {
    warnings.push(WARN_NO_STANDARD_MATCH);
  }

  // ---- 3. DC-side current --------------------------------------------
  const dcInputCurrentA =
    input.peakLoadW / (input.inverterEfficiency * input.systemVoltage);
  const dcSurgeCurrentA =
    input.surgeLoadW / (input.inverterEfficiency * input.systemVoltage);

  // ---- 4. Warnings ----------------------------------------------------
  if (!SUPPORTED_OUTPUT_VOLTAGES.includes(input.outputVoltage)) {
    warnings.push(WARN_UNSUPPORTED_OUTPUT_VOLTAGE(input.outputVoltage));
  }
  if (!SUPPORTED_FREQUENCIES.includes(input.outputFrequency)) {
    warnings.push(WARN_UNSUPPORTED_FREQUENCY(input.outputFrequency));
  }
  if (input.inverterEfficiency < LOW_EFFICIENCY_THRESHOLD) {
    warnings.push(WARN_LOW_EFFICIENCY(input.inverterEfficiency));
  }
  if (input.powerFactor < LOW_POWER_FACTOR_THRESHOLD) {
    warnings.push(WARN_LOW_POWER_FACTOR(input.powerFactor));
  }

  const surgeRatio = input.surgeLoadW / input.continuousLoadW;
  if (surgeRatio > HIGH_SURGE_RATIO_THRESHOLD) {
    warnings.push(WARN_HIGH_SURGE_RATIO(round(surgeRatio, 2)));
  }

  if (
    input.maxDcInputCurrentA !== undefined &&
    dcSurgeCurrentA > input.maxDcInputCurrentA
  ) {
    warnings.push(WARN_DC_CURRENT_EXCEEDS_LIMIT(round(dcSurgeCurrentA)));
  }

  return {
    continuousVa: round(continuousVa),
    peakVa: round(peakVa),
    surgeVa: round(surgeVa),
    minInverterVa: round(minInverterVa),
    recommendedInverterVa: round(recommendedInverterVa),
    requiredSurgeVa: round(requiredSurgeVa),
    dcInputCurrentA: round(dcInputCurrentA),
    dcSurgeCurrentA: round(dcSurgeCurrentA),
    recommendedStandardVa: recommendedInverterVa,
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
 * SolarAudit — Inverter Engine: Public API
 *
 * Boundary:
 *   Input -> Validation -> Calculation -> Engineering Result
 */

import type { InverterInput, InverterResult } from "./types";
import { validateInput } from "./validation";
import { calculateInternal } from "./calculation";

export * from "./types";

export function calculateInverter(input: InverterInput): InverterResult {
  const errors = validateInput(input);

  if (errors.length > 0) {
    return {
      continuousVa: 0,
      peakVa: 0,
      surgeVa: 0,
      minInverterVa: 0,
      recommendedInverterVa: 0,
      requiredSurgeVa: 0,
      dcInputCurrentA: 0,
      dcSurgeCurrentA: 0,
      recommendedStandardVa: 0,
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
  ERROR_INVALID_CONTINUOUS_LOAD,
  ERROR_INVALID_PEAK_LOAD,
  ERROR_INVALID_SURGE_LOAD,
  ERROR_INVALID_POWER_FACTOR,
} from "../errors";

const base = {
  continuousLoadW: 3000,
  peakLoadW: 5000,
  surgeLoadW: 8000,
  systemVoltage: 48,
  outputVoltage: 230,
  outputFrequency: 50,
  powerFactor: 0.8,
  designMargin: 0.25,
  inverterEfficiency: 0.9,
};

describe("validateInput", () => {
  it("accepts a valid input", () => {
    expect(validateInput(base)).toEqual([]);
  });

  it("rejects zero continuous load", () => {
    expect(validateInput({ ...base, continuousLoadW: 0 }))
      .toContain(ERROR_INVALID_CONTINUOUS_LOAD);
  });

  it("rejects peak < continuous", () => {
    expect(validateInput({ ...base, peakLoadW: 1000 }))
      .toContain(ERROR_INVALID_PEAK_LOAD);
  });

  it("rejects surge < peak", () => {
    expect(validateInput({ ...base, surgeLoadW: 1000 }))
      .toContain(ERROR_INVALID_SURGE_LOAD);
  });

  it("rejects bad power factor", () => {
    expect(validateInput({ ...base, powerFactor: 0 }))
      .toContain(ERROR_INVALID_POWER_FACTOR);
  });

  it("collects multiple errors", () => {
    const errs = validateInput({
      ...base,
      continuousLoadW: 0,
      powerFactor: 0,
      inverterEfficiency: 0,
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
import type { InverterInput } from "../types";

const baseInput: InverterInput = {
  continuousLoadW: 3000,
  peakLoadW: 5000,
  surgeLoadW: 8000,
  systemVoltage: 48,
  outputVoltage: 230,
  outputFrequency: 50,
  powerFactor: 0.8,
  designMargin: 0.25,
  inverterEfficiency: 0.9,
};

describe("calculateInternal", () => {
  it("converts W to VA using power factor", () => {
    // 3000 / 0.8 = 3750 VA
    const r = calculateInternal(baseInput);
    expect(r.continuousVa).toBeCloseTo(3750, 1);
  });

  it("computes minimum inverter VA from peak with margin", () => {
    // peak = 5000 / 0.8 = 6250 VA
    // min = 6250 × 1.25 = 7812.5 VA
    const r = calculateInternal(baseInput);
    expect(r.minInverterVa).toBeCloseTo(7812.5, 1);
  });

  it("recommends the next standard inverter size", () => {
    const r = calculateInternal(baseInput);
    expect(r.recommendedInverterVa).toBeGreaterThanOrEqual(r.minInverterVa);
    expect(r.recommendedInverterVa).toBe(8000);
  });

  it("computes required surge VA", () => {
    // surge = 8000 / 0.8 = 10000 VA × 1.25 = 12500 VA
    const r = calculateInternal(baseInput);
    expect(r.requiredSurgeVa).toBeCloseTo(12500, 1);
  });

  it("computes DC input current at peak load", () => {
    // 5000 / (0.9 × 48) = 115.74 A
    const r = calculateInternal(baseInput);
    expect(r.dcInputCurrentA).toBeCloseTo(115.74, 1);
  });

  it("computes DC surge current", () => {
    // 8000 / (0.9 × 48) = 185.18 A
    const r = calculateInternal(baseInput);
    expect(r.dcSurgeCurrentA).toBeCloseTo(185.18, 1);
  });

  it("warns on high surge ratio", () => {
    const r = calculateInternal({
      ...baseInput,
      surgeLoadW: 20000,   // ratio = 20000 / 3000 = 6.67×
    });
    expect(r.warnings.some((w) => /surge/i.test(w))).toBe(true);
  });

  it("warns on low power factor", () => {
    const r = calculateInternal({ ...baseInput, powerFactor: 0.5 });
    expect(r.warnings.some((w) => /power factor/i.test(w))).toBe(true);
  });
});
EOF

# ----------------------------------------------------------------------
# __tests__/integration.test.ts
# ----------------------------------------------------------------------
cat > "$ROOT/__tests__/integration.test.ts" <<'EOF'
import { describe, it, expect } from "vitest";
import { calculateInverter } from "../index";

describe("calculateInverter (public API)", () => {
  it("returns invalid on bad input", () => {
    const r = calculateInverter({
      continuousLoadW: 0,
      peakLoadW: 5000,
      surgeLoadW: 8000,
      systemVoltage: 48,
      outputVoltage: 230,
      outputFrequency: 50,
      powerFactor: 0.8,
      designMargin: 0.25,
      inverterEfficiency: 0.9,
    });
    expect(r.isValid).toBe(false);
    expect(r.errors.length).toBeGreaterThan(0);
  });

  it("sizes an inverter for a typical home", () => {
    const r = calculateInverter({
      continuousLoadW: 3000,
      peakLoadW: 5000,
      surgeLoadW: 8000,
      systemVoltage: 48,
      outputVoltage: 230,
      outputFrequency: 50,
      powerFactor: 0.8,
      designMargin: 0.25,
      inverterEfficiency: 0.9,
    });
    expect(r.isValid).toBe(true);
    expect(r.recommendedInverterVa).toBeGreaterThanOrEqual(r.minInverterVa);
    expect(r.dcInputCurrentA).toBeGreaterThan(0);
  });

  it("respects DC input current limit as a warning", () => {
    const r = calculateInverter({
      continuousLoadW: 3000,
      peakLoadW: 5000,
      surgeLoadW: 8000,
      systemVoltage: 48,
      outputVoltage: 230,
      outputFrequency: 50,
      powerFactor: 0.8,
      designMargin: 0.25,
      inverterEfficiency: 0.9,
      maxDcInputCurrentA: 100,
    });
    expect(r.isValid).toBe(true);
    expect(r.warnings.some((w) => /DC input/i.test(w))).toBe(true);
  });
});
EOF

echo "✔ Inverter engine scaffolded at: $ROOT"
echo
if command -v tree >/dev/null 2>&1; then
  tree "$ROOT"
else
  find "$ROOT" -type f | sort
fi