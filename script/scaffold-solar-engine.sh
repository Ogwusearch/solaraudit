#!/usr/bin/env bash
# scaffold-solar-engine.sh
# Generates the SolarAudit Solar Engine module.

set -euo pipefail

ROOT="/home/ogwu/workspace/solaraudit/src/engineering/solar"

mkdir -p "$ROOT/__tests__"

# ----------------------------------------------------------------------
# types.ts
# ----------------------------------------------------------------------
cat > "$ROOT/types.ts" <<'EOF'
/**
 * SolarAudit — Solar Engine: Types
 *
 * Pure data definitions. No logic, no imports from siblings.
 */

export interface PanelSpec {
  readonly name: string;
  readonly ratedPowerWatts: number;   // STC rating (W)
  readonly vmp: number;               // voltage at max power (V)
  readonly imp: number;               // current at max power (A)
  readonly voc: number;               // open-circuit voltage (V)
  readonly isc: number;               // short-circuit current (A)
}

export interface SolarInput {
  readonly dailyEnergyKwh: number;        // from Energy Engine
  readonly peakSunHours: number;          // site PSH, 0..24
  readonly systemEfficiency: number;      // 0..1 (wiring, inverter, soiling, temp)
  readonly designMargin: number;          // fraction, e.g. 0.25 = 25%
  readonly panel: PanelSpec;

  // Optional array configuration constraints
  readonly maxSeriesPanels?: number;      // limit on series string length
  readonly maxParallelStrings?: number;   // limit on parallel strings

  // Optional electrical compatibility limits
  readonly maxArrayVoc?: number;          // controller/inverter max input voltage
  readonly minArrayVmp?: number;          // MPPT minimum voltage
}

export interface SolarResult {
  readonly requiredArrayKwp: number;      // calculated (no margin)
  readonly designArrayKwp: number;        // with design margin
  readonly totalPanels: number;
  readonly seriesPanels: number;
  readonly parallelStrings: number;
  readonly actualArrayKwp: number;        // installed (rounded up to whole panels)
  readonly arrayVmp: number;              // string Vmp × (parallel: unchanged)
  readonly arrayImp: number;              // string Imp × parallel strings
  readonly arrayVoc: number;              // string Voc × (cold-adjusted in future)
  readonly arrayIsc: number;              // string Isc × parallel strings
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
 * SolarAudit — Solar Engine: Constants
 */

export const DEFAULT_SYSTEM_EFFICIENCY = 0.75;
export const DEFAULT_DESIGN_MARGIN = 0.25;

export const MIN_SYSTEM_EFFICIENCY = 0.1;
export const MAX_SYSTEM_EFFICIENCY = 1.0;

export const MIN_DESIGN_MARGIN = 0.0;
export const MAX_DESIGN_MARGIN = 2.0;

export const MIN_PSH = 0.0;
export const MAX_PSH = 24.0;

export const LOW_PSH_THRESHOLD = 3.0;          // < 3 PSH is marginal
export const HIGH_SERIES_STRING_THRESHOLD = 24; // sanity limit

export const ROUND_DECIMALS = 3;
EOF

# ----------------------------------------------------------------------
# errors.ts
# ----------------------------------------------------------------------
cat > "$ROOT/errors.ts" <<'EOF'
/**
 * SolarAudit — Solar Engine: Error & Warning Messages
 */

export const ERROR_INVALID_DAILY_ENERGY =
  "dailyEnergyKwh must be > 0.";

export const ERROR_INVALID_PSH =
  "peakSunHours must be between 0 and 24.";

export const ERROR_INVALID_EFFICIENCY =
  "systemEfficiency must be between 0 and 1.";

export const ERROR_INVALID_MARGIN =
  "designMargin must be >= 0.";

export const ERROR_PANEL_RATED_POWER =
  "panel.ratedPowerWatts must be > 0.";

export const ERROR_PANEL_VMP =
  "panel.vmp must be > 0.";

export const ERROR_PANEL_IMP =
  "panel.imp must be > 0.";

export const ERROR_PANEL_VOC =
  "panel.voc must be > 0.";

export const ERROR_PANEL_ISC =
  "panel.isc must be > 0.";

export const ERROR_INVALID_MAX_SERIES =
  "maxSeriesPanels must be an integer >= 1 when provided.";

export const ERROR_INVALID_MAX_PARALLEL =
  "maxParallelStrings must be an integer >= 1 when provided.";

export const ERROR_INVALID_MAX_VOC =
  "maxArrayVoc must be > 0 when provided.";

export const ERROR_INVALID_MIN_VMP =
  "minArrayVmp must be > 0 when provided.";

export const ERROR_PSH_ZERO =
  "peakSunHours is zero; array size cannot be computed.";

export const WARN_LOW_PSH = (value: number): string =>
  `Peak sun hours are low (${value} h). Consider a larger array.`;

export const WARN_LONG_SERIES_STRING = (value: number): string =>
  `Series string length is high (${value} panels). Check cold-temperature Voc.`;

export const WARN_VOC_EXCEEDS_LIMIT = (value: number): string =>
  `Array Voc (${value} V) exceeds the configured maxArrayVoc limit.`;

export const WARN_VMP_BELOW_MINIMUM = (value: number): string =>
  `Array Vmp (${value} V) is below the configured minArrayVmp limit.`;

export const WARN_OVERSIZED_BY_MARGIN =
  "Installed array exceeds design target by more than one panel; consider re-balancing strings.";
EOF

# ----------------------------------------------------------------------
# validation.ts
# ----------------------------------------------------------------------
cat > "$ROOT/validation.ts" <<'EOF'
/**
 * SolarAudit — Solar Engine: Validation
 *
 * Collects ALL errors. Never throws. Returns string[] (empty == valid).
 */

import type { SolarInput } from "./types";
import {
  ERROR_INVALID_DAILY_ENERGY,
  ERROR_INVALID_PSH,
  ERROR_INVALID_EFFICIENCY,
  ERROR_INVALID_MARGIN,
  ERROR_PANEL_RATED_POWER,
  ERROR_PANEL_VMP,
  ERROR_PANEL_IMP,
  ERROR_PANEL_VOC,
  ERROR_PANEL_ISC,
  ERROR_INVALID_MAX_SERIES,
  ERROR_INVALID_MAX_PARALLEL,
  ERROR_INVALID_MAX_VOC,
  ERROR_INVALID_MIN_VMP,
} from "./errors";

export function validateInput(input: SolarInput): string[] {
  const errors: string[] = [];

  if (input.dailyEnergyKwh <= 0) {
    errors.push(ERROR_INVALID_DAILY_ENERGY);
  }
  if (input.peakSunHours < 0 || input.peakSunHours > 24) {
    errors.push(ERROR_INVALID_PSH);
  }
  if (input.systemEfficiency <= 0 || input.systemEfficiency > 1) {
    errors.push(ERROR_INVALID_EFFICIENCY);
  }
  if (input.designMargin < 0) {
    errors.push(ERROR_INVALID_MARGIN);
  }

  const p = input.panel;
  if (p.ratedPowerWatts <= 0) errors.push(ERROR_PANEL_RATED_POWER);
  if (p.vmp <= 0) errors.push(ERROR_PANEL_VMP);
  if (p.imp <= 0) errors.push(ERROR_PANEL_IMP);
  if (p.voc <= 0) errors.push(ERROR_PANEL_VOC);
  if (p.isc <= 0) errors.push(ERROR_PANEL_ISC);

  if (
    input.maxSeriesPanels !== undefined &&
    (!Number.isInteger(input.maxSeriesPanels) || input.maxSeriesPanels < 1)
  ) {
    errors.push(ERROR_INVALID_MAX_SERIES);
  }
  if (
    input.maxParallelStrings !== undefined &&
    (!Number.isInteger(input.maxParallelStrings) || input.maxParallelStrings < 1)
  ) {
    errors.push(ERROR_INVALID_MAX_PARALLEL);
  }
  if (input.maxArrayVoc !== undefined && input.maxArrayVoc <= 0) {
    errors.push(ERROR_INVALID_MAX_VOC);
  }
  if (input.minArrayVmp !== undefined && input.minArrayVmp <= 0) {
    errors.push(ERROR_INVALID_MIN_VMP);
  }

  return errors;
}
EOF

# ----------------------------------------------------------------------
# calculation.ts
# ----------------------------------------------------------------------
cat > "$ROOT/calculation.ts" <<'EOF'
/**
 * SolarAudit — Solar Engine: Calculation
 *
 * Pure math. Assumes input is valid.
 *
 *   1. PV energy requirement  = dailyEnergyKwh / systemEfficiency
 *   2. Required array power   = PV energy requirement / peakSunHours
 *   3. Design array power     = required × (1 + designMargin)
 *   4. Panels required        = ceil(designArrayKw / panelRatedKw)
 *   5. Choose series length L in [1, maxSeries] such that
 *        ceil(panels / L) parallel strings is minimized
 *      subject to optional Voc/Vmp compatibility windows.
 *   6. Selected array = L × parallel strings panels.
 */

import type { SolarInput, SolarResult } from "./types";
import {
  LOW_PSH_THRESHOLD,
  HIGH_SERIES_STRING_THRESHOLD,
  ROUND_DECIMALS,
} from "./constants";
import {
  ERROR_PSH_ZERO,
  WARN_LOW_PSH,
  WARN_LONG_SERIES_STRING,
  WARN_VOC_EXCEEDS_LIMIT,
  WARN_VMP_BELOW_MINIMUM,
} from "./errors";

function round(value: number, decimals = ROUND_DECIMALS): number {
  const factor = 10 ** decimals;
  return Math.round(value * factor) / factor;
}

function emptyResult(errors: string[]): SolarResult {
  return {
    requiredArrayKwp: 0,
    designArrayKwp: 0,
    totalPanels: 0,
    seriesPanels: 0,
    parallelStrings: 0,
    actualArrayKwp: 0,
    arrayVmp: 0,
    arrayImp: 0,
    arrayVoc: 0,
    arrayIsc: 0,
    warnings: [],
    errors,
    isValid: false,
  };
}

export function calculateInternal(input: SolarInput): SolarResult {
  const warnings: string[] = [];

  // ---- 1. Sizing math -------------------------------------------------
  if (input.peakSunHours === 0) {
    return emptyResult([ERROR_PSH_ZERO]);
  }

  const pvEnergyReqKwh = input.dailyEnergyKwh / input.systemEfficiency;
  const requiredArrayKw = pvEnergyReqKwh / input.peakSunHours;
  const designArrayKw = requiredArrayKw * (1 + input.designMargin);

  const panelKw = input.panel.ratedPowerWatts / 1000;
  const panelsNeeded = Math.max(1, Math.ceil(designArrayKw / panelKw));

  // ---- 2. Choose series/parallel configuration ------------------------
  const maxSeries = input.maxSeriesPanels ?? Math.max(panelsNeeded, 1);
  const maxParallel = input.maxParallelStrings ?? panelsNeeded;

  let bestSeries = 1;
  let bestParallel = panelsNeeded;
  let bestTotal = bestSeries * bestParallel;
  let bestScore = Number.POSITIVE_INFINITY;

  for (let series = 1; series <= Math.min(maxSeries, panelsNeeded); series++) {
    const parallel = Math.ceil(panelsNeeded / series);
    if (parallel > maxParallel) continue;

    const stringVoc = series * input.panel.voc;
    const stringVmp = series * input.panel.vmp;

    if (input.maxArrayVoc !== undefined && stringVoc > input.maxArrayVoc) {
      continue;
    }
    if (input.minArrayVmp !== undefined && stringVmp < input.minArrayVmp) {
      continue;
    }

    const total = series * parallel;
    // Prefer minimum overshoot, then longer strings (fewer conductors)
    const score = (total - panelsNeeded) * 1000 - series;
    if (score < bestScore) {
      bestScore = score;
      bestSeries = series;
      bestParallel = parallel;
      bestTotal = total;
    }
  }

  // Fallback: if no configuration satisfies electrical limits, pick the
  // best fit ignoring them and warn below.
  if (!Number.isFinite(bestScore)) {
    for (let series = 1; series <= Math.min(maxSeries, panelsNeeded); series++) {
      const parallel = Math.ceil(panelsNeeded / series);
      if (parallel > maxParallel) continue;
      const total = series * parallel;
      const score = total - panelsNeeded;
      if (score < bestScore) {
        bestScore = score;
        bestSeries = series;
        bestParallel = parallel;
        bestTotal = total;
      }
    }
  }

  const actualArrayKw = bestTotal * panelKw;

  // ---- 3. Electrical outputs ------------------------------------------
  const arrayVmp = bestSeries * input.panel.vmp;
  const arrayImp = bestParallel * input.panel.imp;
  const arrayVoc = bestSeries * input.panel.voc;
  const arrayIsc = bestParallel * input.panel.isc;

  // ---- 4. Warnings ----------------------------------------------------
  if (input.peakSunHours < LOW_PSH_THRESHOLD) {
    warnings.push(WARN_LOW_PSH(input.peakSunHours));
  }
  if (bestSeries > HIGH_SERIES_STRING_THRESHOLD) {
    warnings.push(WARN_LONG_SERIES_STRING(bestSeries));
  }
  if (input.maxArrayVoc !== undefined && arrayVoc > input.maxArrayVoc) {
    warnings.push(WARN_VOC_EXCEEDS_LIMIT(round(arrayVoc)));
  }
  if (input.minArrayVmp !== undefined && arrayVmp < input.minArrayVmp) {
    warnings.push(WARN_VMP_BELOW_MINIMUM(round(arrayVmp)));
  }

  return {
    requiredArrayKwp: round(requiredArrayKw),
    designArrayKwp: round(designArrayKw),
    totalPanels: bestTotal,
    seriesPanels: bestSeries,
    parallelStrings: bestParallel,
    actualArrayKwp: round(actualArrayKw),
    arrayVmp: round(arrayVmp),
    arrayImp: round(arrayImp),
    arrayVoc: round(arrayVoc),
    arrayIsc: round(arrayIsc),
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
 * SolarAudit — Solar Engine: Public API
 *
 * Boundary:
 *   Input -> Validation -> Calculation -> Engineering Result
 */

import type { SolarInput, SolarResult } from "./types";
import { validateInput } from "./validation";
import { calculateInternal } from "./calculation";

export * from "./types";

export function calculateSolar(input: SolarInput): SolarResult {
  const errors = validateInput(input);

  if (errors.length > 0) {
    return {
      requiredArrayKwp: 0,
      designArrayKwp: 0,
      totalPanels: 0,
      seriesPanels: 0,
      parallelStrings: 0,
      actualArrayKwp: 0,
      arrayVmp: 0,
      arrayImp: 0,
      arrayVoc: 0,
      arrayIsc: 0,
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
  ERROR_INVALID_PSH,
  ERROR_INVALID_EFFICIENCY,
  ERROR_PANEL_RATED_POWER,
} from "../errors";

const panel = {
  name: "P",
  ratedPowerWatts: 400,
  vmp: 34,
  imp: 11.8,
  voc: 41,
  isc: 12.5,
};

const base = {
  dailyEnergyKwh: 10,
  peakSunHours: 4.5,
  systemEfficiency: 0.75,
  designMargin: 0.25,
  panel,
};

describe("validateInput", () => {
  it("accepts a valid input", () => {
    expect(validateInput(base)).toEqual([]);
  });

  it("rejects non-positive daily energy", () => {
    expect(validateInput({ ...base, dailyEnergyKwh: 0 }))
      .toContain(ERROR_INVALID_DAILY_ENERGY);
  });

  it("rejects out-of-range PSH", () => {
    expect(validateInput({ ...base, peakSunHours: 30 }))
      .toContain(ERROR_INVALID_PSH);
  });

  it("rejects bad efficiency", () => {
    expect(validateInput({ ...base, systemEfficiency: 0 }))
      .toContain(ERROR_INVALID_EFFICIENCY);
  });

  it("rejects bad panel rating", () => {
    const bad = { ...panel, ratedPowerWatts: 0 };
    expect(validateInput({ ...base, panel: bad }))
      .toContain(ERROR_PANEL_RATED_POWER);
  });

  it("collects multiple errors", () => {
    const errs = validateInput({
      ...base,
      dailyEnergyKwh: -1,
      peakSunHours: 30,
      systemEfficiency: 2,
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
import type { SolarInput } from "../types";

const panel = {
  name: "P",
  ratedPowerWatts: 400,
  vmp: 34,
  imp: 11.8,
  voc: 41,
  isc: 12.5,
};

const baseInput: SolarInput = {
  dailyEnergyKwh: 10,
  peakSunHours: 4.5,
  systemEfficiency: 0.75,
  designMargin: 0.25,
  panel,
};

describe("calculateInternal", () => {
  it("computes required array size", () => {
    // 10 / 0.75 = 13.333 kWh required
    // 13.333 / 4.5 = 2.963 kW required
    const r = calculateInternal(baseInput);
    expect(r.requiredArrayKwp).toBeCloseTo(2.963, 2);
  });

  it("applies design margin", () => {
    const r = calculateInternal(baseInput);
    expect(r.designArrayKwp).toBeCloseTo(r.requiredArrayKwp * 1.25, 2);
  });

  it("selects whole panels that meet or exceed the design target", () => {
    const r = calculateInternal(baseInput);
    // 3.704 kW design / 0.4 kW panel = 9.26 -> 10 panels minimum
    expect(r.totalPanels).toBeGreaterThanOrEqual(10);
    expect(r.actualArrayKwp).toBeGreaterThanOrEqual(r.designArrayKwp);
  });

  it("respects maxSeriesPanels", () => {
    const r = calculateInternal({ ...baseInput, maxSeriesPanels: 4 });
    expect(r.seriesPanels).toBeLessThanOrEqual(4);
  });

  it("respects maxArrayVoc", () => {
    const r = calculateInternal({ ...baseInput, maxArrayVoc: 200 });
    expect(r.arrayVoc).toBeLessThanOrEqual(200);
  });

  it("computes string electrical values correctly", () => {
    const r = calculateInternal({ ...baseInput, maxSeriesPanels: 10 });
    expect(r.arrayVmp).toBeCloseTo(r.seriesPanels * panel.vmp, 2);
    expect(r.arrayVoc).toBeCloseTo(r.seriesPanels * panel.voc, 2);
    expect(r.arrayImp).toBeCloseTo(r.parallelStrings * panel.imp, 2);
    expect(r.arrayIsc).toBeCloseTo(r.parallelStrings * panel.isc, 2);
  });

  it("errors when PSH = 0", () => {
    const r = calculateInternal({ ...baseInput, peakSunHours: 0 });
    expect(r.isValid).toBe(false);
    expect(r.errors.length).toBeGreaterThan(0);
  });
});
EOF

# ----------------------------------------------------------------------
# __tests__/integration.test.ts
# ----------------------------------------------------------------------
cat > "$ROOT/__tests__/integration.test.ts" <<'EOF'
import { describe, it, expect } from "vitest";
import { calculateSolar } from "../index";

const panel = {
  name: "P",
  ratedPowerWatts: 400,
  vmp: 34,
  imp: 11.8,
  voc: 41,
  isc: 12.5,
};

describe("calculateSolar (public API)", () => {
  it("returns invalid on bad input", () => {
    const r = calculateSolar({
      dailyEnergyKwh: 0,
      peakSunHours: 4.5,
      systemEfficiency: 0.75,
      designMargin: 0.25,
      panel,
    });
    expect(r.isValid).toBe(false);
    expect(r.errors.length).toBeGreaterThan(0);
  });

  it("returns a valid size for a typical off-grid home", () => {
    const r = calculateSolar({
      dailyEnergyKwh: 15,
      peakSunHours: 4.5,
      systemEfficiency: 0.75,
      designMargin: 0.25,
      panel,
    });
    expect(r.isValid).toBe(true);
    expect(r.errors).toEqual([]);
    expect(r.actualArrayKwp).toBeGreaterThanOrEqual(r.designArrayKwp);
    expect(r.totalPanels).toBe(r.seriesPanels * r.parallelStrings);
  });

  it("honours electrical compatibility limits", () => {
    const r = calculateSolar({
      dailyEnergyKwh: 15,
      peakSunHours: 4.5,
      systemEfficiency: 0.75,
      designMargin: 0.25,
      panel,
      maxArrayVoc: 250,
      minArrayVmp: 100,
    });
    expect(r.isValid).toBe(true);
    if (r.arrayVoc > 0) {
      expect(r.arrayVoc).toBeLessThanOrEqual(250);
    }
  });
});
EOF

echo "✔ Solar engine scaffolded at: $ROOT"
echo
if command -v tree >/dev/null 2>&1; then
  tree "$ROOT"
else
  find "$ROOT" -type f | sort
fi