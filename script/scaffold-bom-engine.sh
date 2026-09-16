#!/usr/bin/env bash
# scaffold-bom-engine.sh
# Generates the SolarAudit BOM Engine module.

set -euo pipefail

ROOT="/home/ogwu/workspace/solaraudit/src/engineering/bom"

mkdir -p "$ROOT/__tests__"

# ----------------------------------------------------------------------
# types.ts
# ----------------------------------------------------------------------
cat > "$ROOT/types.ts" <<'EOF'
/**
 * SolarAudit — BOM Engine: Types
 *
 * Pure data definitions. No logic, no imports from siblings.
 *
 * The BOM Engine converts engineering selections into a structured,
 * categorical material list. Quantities are derived from the sizing
 * outputs; costs and prices are NOT part of this engine (see Costing).
 */

export type BomCategory =
  | "pv-modules"
  | "pv-mounting"
  | "pv-connectors"
  | "pv-cables"
  | "batteries"
  | "battery-cables"
  | "battery-rack"
  | "inverter"
  | "charge-controller"
  | "dc-breakers"
  | "dc-isolators"
  | "dc-fuses"
  | "ac-breakers"
  | "spd"
  | "earthing"
  | "enclosures"
  | "monitoring"
  | "labour"
  | "consumables";

export interface BomLineItem {
  readonly category: BomCategory;
  readonly description: string;
  readonly specification: string;      // free-form engineering spec
  readonly quantity: number;           // >= 0
  readonly unit: string;               // "pcs", "m", "set", "kg", ...
  readonly notes?: string;             // engineering notes
}

// ------------------------- Sizing snapshots --------------------------

export interface PvSnapshot {
  readonly arrayKwp: number;
  readonly panelRatedWatts: number;
  readonly seriesPanels: number;
  readonly parallelStrings: number;
  readonly totalPanels: number;
  readonly arrayVoc: number;
  readonly arrayIsc: number;
  readonly arrayImp: number;
}

export interface BatterySnapshot {
  readonly technology: string;          // e.g. "lifepo4"
  readonly cellVoltage: number;
  readonly cellCapacityAh: number;
  readonly seriesCells: number;
  readonly parallelStrings: number;
  readonly totalCells: number;
  readonly bankVoltage: number;
  readonly bankCapacityAh: number;
}

export interface InverterSnapshot {
  readonly recommendedVa: number;
  readonly systemVoltage: number;
  readonly outputVoltage: number;
  readonly outputFrequency: number;
}

export interface ChargeControllerSnapshot {
  readonly technology: "mppt" | "pwm";
  readonly recommendedCurrentA: number;
  readonly maxPvInputVoltage?: number;
}

export interface CableSnapshot {
  readonly role: string;              // "battery", "pv-string", "inverter-dc", ...
  readonly selectedAreaMm2: number;
  readonly lengthM: number;
  readonly conductorMaterial: "copper" | "aluminium";
}

export interface ProtectionSnapshot {
  readonly role: string;
  readonly technology: string;        // "fuse", "mcb", "dc-breaker", ...
  readonly selectedRatingA: number;
  readonly minimumVoltageRatingV: number;
  readonly quantity?: number;         // default 1
}

export interface BomInput {
  readonly projectName: string;
  readonly pv?: PvSnapshot;
  readonly battery?: BatterySnapshot;
  readonly inverter?: InverterSnapshot;
  readonly chargeController?: ChargeControllerSnapshot;
  readonly cables?: readonly CableSnapshot[];
  readonly protections?: readonly ProtectionSnapshot[];

  // Preferences / site assumptions
  readonly mountingType?: "roof-pitched" | "roof-flat" | "ground" | "carport";
  readonly includeMonitoring?: boolean;   // default false
  readonly includeSpd?: boolean;          // default true
  readonly includeEarthing?: boolean;     // default true
  readonly reservePercent?: number;       // 0..1 spare parts margin, default 0.05
}

export interface BomResult {
  readonly projectName: string;
  readonly items: readonly BomLineItem[];
  readonly itemCount: number;             // total distinct line items
  readonly totalQuantity: number;         // sum of all quantities
  readonly categories: readonly BomCategory[];
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
 * SolarAudit — BOM Engine: Constants
 */

export const DEFAULT_RESERVE_PERCENT = 0.05;
export const MIN_RESERVE_PERCENT = 0.0;
export const MAX_RESERVE_PERCENT = 0.5;

// Cabling allowances (metres) — added on top of engineering cable runs
export const PV_STRING_CABLE_ALLOWANCE_M = 5;   // per string: connectors to combiner
export const BATTERY_INTERCONNECT_ALLOWANCE_M = 2; // per inter-cell link
export const AC_CABLE_ALLOWANCE_M = 3;          // per AC circuit
export const EARTHING_CABLE_ALLOWANCE_M = 10;   // fixed site minimum

// Physical constants used to estimate mounting / hardware counts
export const PANEL_AREA_M2_ESTIMATE = 2.0;      // ~400 W panel footprint
export const MID_CLAMPS_PER_PANEL = 2;
export const END_CLAMPS_PER_ROW = 2;
export const RAIL_OVERHANG_M = 0.4;

// Standard combiner / enclosure sizing
export const MAX_STRINGS_PER_COMBINER = 4;
export const MC4_PAIRS_PER_STRING = 1;
export const CABLE_GLAND_PER_BREAKER = 2;

// Warnings thresholds
export const HIGH_PARALLEL_STRINGS_WARN = 4;
export const LARGE_PANEL_COUNT_WARN = 40;

export const ROUND_DECIMALS = 3;
export const ROUND_DECIMALS_QTY = 2;
EOF

# ----------------------------------------------------------------------
# errors.ts
# ----------------------------------------------------------------------
cat > "$ROOT/errors.ts" <<'EOF'
/**
 * SolarAudit — BOM Engine: Error & Warning Messages
 */

export const ERROR_NO_PROJECT_NAME =
  "projectName is required.";

export const ERROR_NEGATIVE_KWP =
  "pv.arrayKwp must be >= 0 when provided.";

export const ERROR_INVALID_PANEL_POWER =
  "pv.panelRatedWatts must be > 0 when pv is provided.";

export const ERROR_INVALID_PANEL_COUNT =
  "pv.totalPanels must be a non-negative integer when pv is provided.";

export const ERROR_INVALID_BATTERY_CELLS =
  "battery.totalCells must be a non-negative integer when battery is provided.";

export const ERROR_INVALID_BATTERY_CELL_VOLTAGE =
  "battery.cellVoltage must be > 0 when battery is provided.";

export const ERROR_INVALID_INVERTER_VA =
  "inverter.recommendedVa must be > 0 when inverter is provided.";

export const ERROR_INVALID_CONTROLLER_CURRENT =
  "chargeController.recommendedCurrentA must be > 0 when controller is provided.";

export const ERROR_INVALID_RESERVE_PERCENT =
  "reservePercent must be between 0 and 0.5.";

export const errorInvalidCableLength = (idx: number, role: string): string =>
  `cables[${idx}] '${role}': lengthM must be >= 0.`;

export const errorInvalidCableArea = (idx: number, role: string): string =>
  `cables[${idx}] '${role}': selectedAreaMm2 must be > 0.`;

export const errorInvalidProtectionRating = (idx: number, role: string): string =>
  `protections[${idx}] '${role}': selectedRatingA must be > 0.`;

export const WARN_NO_PV =
  "No PV snapshot provided; PV-related BOM items skipped.";

export const WARN_NO_BATTERY =
  "No battery snapshot provided; battery-related BOM items skipped.";

export const WARN_NO_INVERTER =
  "No inverter snapshot provided; inverter-related BOM items skipped.";

export const WARN_NO_CONTROLLER =
  "No charge controller snapshot provided; controller-related BOM items skipped.";

export const WARN_NO_CABLES =
  "No cable snapshots provided; cable-related BOM items skipped.";

export const WARN_NO_PROTECTION =
  "No protection snapshots provided; protection-related BOM items skipped.";

export const WARN_HIGH_STRINGS = (value: number): string =>
  `High parallel string count (${value}). Consider a combiner box and DC busbar.`;

export const WARN_LARGE_PANEL_COUNT = (value: number): string =>
  `Large panel count (${value}). Verify mounting structure and roof loading.`;

export const WARN_NO_MOUNTING_TYPE =
  "mountingType not provided; mounting hardware is estimated generically.";

export const WARN_PWM_CONTROLLER =
  "PWM controller selected; confirm array Vmp is compatible with battery voltage.";
EOF

# ----------------------------------------------------------------------
# validation.ts
# ----------------------------------------------------------------------
cat > "$ROOT/validation.ts" <<'EOF'
/**
 * SolarAudit — BOM Engine: Validation
 *
 * Collects ALL errors. Never throws. Returns string[] (empty == valid).
 */

import type { BomInput } from "./types";
import {
  ERROR_NO_PROJECT_NAME,
  ERROR_NEGATIVE_KWP,
  ERROR_INVALID_PANEL_POWER,
  ERROR_INVALID_PANEL_COUNT,
  ERROR_INVALID_BATTERY_CELLS,
  ERROR_INVALID_BATTERY_CELL_VOLTAGE,
  ERROR_INVALID_INVERTER_VA,
  ERROR_INVALID_CONTROLLER_CURRENT,
  ERROR_INVALID_RESERVE_PERCENT,
  errorInvalidCableLength,
  errorInvalidCableArea,
  errorInvalidProtectionRating,
} from "./errors";
import {
  MIN_RESERVE_PERCENT,
  MAX_RESERVE_PERCENT,
} from "./constants";

export function validateInput(input: BomInput): string[] {
  const errors: string[] = [];

  if (!input.projectName || input.projectName.trim() === "") {
    errors.push(ERROR_NO_PROJECT_NAME);
  }

  if (input.reservePercent !== undefined) {
    if (
      input.reservePercent < MIN_RESERVE_PERCENT ||
      input.reservePercent > MAX_RESERVE_PERCENT
    ) {
      errors.push(ERROR_INVALID_RESERVE_PERCENT);
    }
  }

  if (input.pv) {
    if (input.pv.arrayKwp < 0) errors.push(ERROR_NEGATIVE_KWP);
    if (input.pv.panelRatedWatts <= 0) errors.push(ERROR_INVALID_PANEL_POWER);
    if (
      !Number.isInteger(input.pv.totalPanels) ||
      input.pv.totalPanels < 0
    ) {
      errors.push(ERROR_INVALID_PANEL_COUNT);
    }
  }

  if (input.battery) {
    if (input.battery.cellVoltage <= 0) {
      errors.push(ERROR_INVALID_BATTERY_CELL_VOLTAGE);
    }
    if (
      !Number.isInteger(input.battery.totalCells) ||
      input.battery.totalCells < 0
    ) {
      errors.push(ERROR_INVALID_BATTERY_CELLS);
    }
  }

  if (input.inverter && input.inverter.recommendedVa <= 0) {
    errors.push(ERROR_INVALID_INVERTER_VA);
  }

  if (
    input.chargeController &&
    input.chargeController.recommendedCurrentA <= 0
  ) {
    errors.push(ERROR_INVALID_CONTROLLER_CURRENT);
  }

  input.cables?.forEach((c, idx) => {
    if (c.lengthM < 0) errors.push(errorInvalidCableLength(idx, c.role));
    if (c.selectedAreaMm2 <= 0) {
      errors.push(errorInvalidCableArea(idx, c.role));
    }
  });

  input.protections?.forEach((p, idx) => {
    if (p.selectedRatingA <= 0) {
      errors.push(errorInvalidProtectionRating(idx, p.role));
    }
  });

  return errors;
}
EOF

# ----------------------------------------------------------------------
# calculation.ts
# ----------------------------------------------------------------------
cat > "$ROOT/calculation.ts" <<'EOF'
/**
 * SolarAudit — BOM Engine: Calculation
 *
 * Pure math. Assumes input is valid.
 *
 * The engine walks each component snapshot and emits BomLineItem
 * entries with quantities derived from the sizing outputs. It does NOT
 * perform any pricing — that belongs to the Costing Engine.
 */

import type {
  BomInput,
  BomLineItem,
  BomResult,
  BomCategory,
} from "./types";
import {
  DEFAULT_RESERVE_PERCENT,
  PV_STRING_CABLE_ALLOWANCE_M,
  BATTERY_INTERCONNECT_ALLOWANCE_M,
  AC_CABLE_ALLOWANCE_M,
  EARTHING_CABLE_ALLOWANCE_M,
  PANEL_AREA_M2_ESTIMATE,
  MID_CLAMPS_PER_PANEL,
  END_CLAMPS_PER_ROW,
  RAIL_OVERHANG_M,
  MAX_STRINGS_PER_COMBINER,
  MC4_PAIRS_PER_STRING,
  CABLE_GLAND_PER_BREAKER,
  HIGH_PARALLEL_STRINGS_WARN,
  LARGE_PANEL_COUNT_WARN,
  ROUND_DECIMALS_QTY,
} from "./constants";
import {
  WARN_NO_PV,
  WARN_NO_BATTERY,
  WARN_NO_INVERTER,
  WARN_NO_CONTROLLER,
  WARN_NO_CABLES,
  WARN_NO_PROTECTION,
  WARN_HIGH_STRINGS,
  WARN_LARGE_PANEL_COUNT,
  WARN_NO_MOUNTING_TYPE,
  WARN_PWM_CONTROLLER,
} from "./errors";

function roundQty(value: number): number {
  const factor = 10 ** ROUND_DECIMALS_QTY;
  return Math.ceil(value * factor) / factor;
}

function withReserve(quantity: number, reserve: number): number {
  return roundQty(quantity * (1 + reserve));
}

// ---------------------------------------------------------------------
// Per-component builders
// ---------------------------------------------------------------------

function buildPvItems(input: BomInput, reserve: number): BomLineItem[] {
  const pv = input.pv;
  if (!pv) return [];

  const items: BomLineItem[] = [];

  items.push({
    category: "pv-modules",
    description: "PV module",
    specification: `${pv.panelRatedWatts} W, Voc ${pv.arrayVoc} V array`,
    quantity: withReserve(pv.totalPanels, reserve),
    unit: "pcs",
    notes: `${pv.seriesPanels}S × ${pv.parallelStrings}P configuration`,
  });

  // Mounting
  const areaM2 = pv.totalPanels * PANEL_AREA_M2_ESTIMATE;
  const railLengthM = pv.totalPanels * 1.0 + pv.parallelStrings * RAIL_OVERHANG_M * 2;

  items.push({
    category: "pv-mounting",
    description: "Mounting rail",
    specification: input.mountingType ?? "generic",
    quantity: withReserve(railLengthM, reserve),
    unit: "m",
    notes: `~${roundQty(areaM2)} m² roof/module area`,
  });

  items.push({
    category: "pv-mounting",
    description: "Mid clamps",
    specification: "Aluminium, panel-to-rail",
    quantity: withReserve(pv.totalPanels * MID_CLAMPS_PER_PANEL, reserve),
    unit: "pcs",
  });

  items.push({
    category: "pv-mounting",
    description: "End clamps",
    specification: "Aluminium, row ends",
    quantity: withReserve(pv.parallelStrings * END_CLAMPS_PER_ROW, reserve),
    unit: "pcs",
  });

  // Connectors
  items.push({
    category: "pv-connectors",
    description: "MC4 connector pair",
    specification: "IP67, DC-rated",
    quantity: withReserve(pv.parallelStrings * MC4_PAIRS_PER_STRING, reserve),
    unit: "pair",
  });

  // Combiner box if many strings
  if (pv.parallelStrings > MAX_STRINGS_PER_COMBINER) {
    items.push({
      category: "enclosures",
      description: "PV combiner box",
      specification: `${MAX_STRINGS_PER_COMBINER}-string, with fuses`,
      quantity: Math.ceil(pv.parallelStrings / MAX_STRINGS_PER_COMBINER),
      unit: "pcs",
    });
  }

  return items;
}

function buildBatteryItems(input: BomInput, reserve: number): BomLineItem[] {
  const b = input.battery;
  if (!b) return [];

  const items: BomLineItem[] = [];

  items.push({
    category: "batteries",
    description: "Battery cell",
    specification: `${b.technology}, ${b.cellVoltage} V, ${b.cellCapacityAh} Ah`,
    quantity: withReserve(b.totalCells, reserve),
    unit: "pcs",
    notes: `${b.seriesCells}S × ${b.parallelStrings}P, bank = ${b.bankVoltage} V / ${b.bankCapacityAh} Ah`,
  });

  // Interconnects
  const links = Math.max(0, (b.seriesCells - 1) * b.parallelStrings)
    + Math.max(0, b.parallelStrings - 1);
  const interconnectM = links * BATTERY_INTERCONNECT_ALLOWANCE_M;

  items.push({
    category: "battery-cables",
    description: "Battery interconnect cable",
    specification: "Flexible copper, insulated",
    quantity: roundQty(interconnectM),
    unit: "m",
    notes: `${links} link(s) estimated`,
  });

  // Rack
  items.push({
    category: "battery-rack",
    description: "Battery rack / cabinet",
    specification: `${b.bankVoltage} V bank, ${b.totalCells} cells`,
    quantity: 1,
    unit: "set",
  });

  return items;
}

function buildInverterItems(input: BomInput): BomLineItem[] {
  const inv = input.inverter;
  if (!inv) return [];

  return [
    {
      category: "inverter",
      description: "Inverter",
      specification: `${inv.recommendedVa} VA, ${inv.systemVoltage} V DC in, ${inv.outputVoltage} V AC ${inv.outputFrequency} Hz`,
      quantity: 1,
      unit: "pcs",
    },
  ];
}

function buildControllerItems(input: BomInput): BomLineItem[] {
  const c = input.chargeController;
  if (!c) return [];

  return [
    {
      category: "charge-controller",
      description: "Charge controller",
      specification: `${c.technology.toUpperCase()}, ${c.recommendedCurrentA} A${
        c.maxPvInputVoltage ? `, max PV ${c.maxPvInputVoltage} V` : ""
      }`,
      quantity: 1,
      unit: "pcs",
    },
  ];
}

function buildCableItems(input: BomInput, reserve: number): BomLineItem[] {
  const cables = input.cables;
  if (!cables || cables.length === 0) return [];

  const items: BomLineItem[] = [];

  for (const c of cables) {
    const isPv = c.role.toLowerCase().includes("pv");
    const isBattery = c.role.toLowerCase().includes("battery");
    const isAc = c.role.toLowerCase().startsWith("ac");

    const allowance = isPv
      ? PV_STRING_CABLE_ALLOWANCE_M
      : isBattery
        ? BATTERY_INTERCONNECT_ALLOWANCE_M
        : isAc
          ? AC_CABLE_ALLOWANCE_M
          : 0;

    const totalM = (c.lengthM + allowance) * (isPv ? 2 : 2); // go + return

    items.push({
      category: isPv ? "pv-cables" : isBattery ? "battery-cables" : "pv-cables",
      description: `${c.role} cable`,
      specification: `${c.selectedAreaMm2} mm² ${c.conductorMaterial}`,
      quantity: withReserve(totalM, reserve),
      unit: "m",
      notes: `Includes ~${allowance} m allowance, go + return`,
    });
  }

  return items;
}

function buildProtectionItems(input: BomInput): BomLineItem[] {
  const prot = input.protections;
  if (!prot || prot.length === 0) return [];

  const items: BomLineItem[] = [];

  for (const p of prot) {
    const category: BomCategory =
      p.technology === "mcb" || p.technology === "mccb"
        ? "ac-breakers"
        : p.technology === "fuse"
          ? "dc-fuses"
          : p.technology === "dc-isolator"
            ? "dc-isolators"
            : p.technology === "spd"
              ? "spd"
              : "dc-breakers";

    const qty = p.quantity ?? 1;
    items.push({
      category,
      description: `Protection device — ${p.role}`,
      specification: `${p.technology}, ${p.selectedRatingA} A, ≥ ${p.minimumVoltageRatingV} V`,
      quantity: qty,
      unit: "pcs",
    });

    // Cable glands per breaker
    if (p.technology !== "spd") {
      items.push({
        category: "consumables",
        description: `Cable glands for ${p.role}`,
        specification: "IP68, matching cable OD",
        quantity: qty * CABLE_GLAND_PER_BREAKER,
        unit: "pcs",
      });
    }
  }

  return items;
}

function buildEarthingItems(input: BomInput): BomLineItem[] {
  if (input.includeEarthing === false) return [];

  return [
    {
      category: "earthing",
      description: "Earth cable",
      specification: "Green/yellow, insulated copper",
      quantity: EARTHING_CABLE_ALLOWANCE_M,
      unit: "m",
    },
    {
      category: "earthing",
      description: "Earth rod",
      specification: "Copper-bonded, 16 mm × 1.2 m",
      quantity: 1,
      unit: "pcs",
    },
    {
      category: "earthing",
      description: "Earth clamps and lugs",
      specification: "Assorted",
      quantity: 1,
      unit: "set",
    },
  ];
}

function buildMonitoringItems(input: BomInput): BomLineItem[] {
  if (!input.includeMonitoring) return [];

  return [
    {
      category: "monitoring",
      description: "System monitoring gateway",
      specification: "Wi-Fi / Ethernet, inverter- and BMS-compatible",
      quantity: 1,
      unit: "pcs",
    },
    {
      category: "monitoring",
      description: "Current / voltage sensors",
      specification: "Shunt or Hall, appropriate range",
      quantity: 2,
      unit: "pcs",
    },
  ];
}

function buildSpdItems(input: BomInput): BomLineItem[] {
  if (input.includeSpd === false) return [];

  return [
    {
      category: "spd",
      description: "DC surge protection device",
      specification: "PV DC, 2-pole, Type 2",
      quantity: 1,
      unit: "pcs",
    },
    {
      category: "spd",
      description: "AC surge protection device",
      specification: "AC Type 2, single- or three-phase",
      quantity: 1,
      unit: "pcs",
    },
  ];
}

// ---------------------------------------------------------------------
// Orchestration
// ---------------------------------------------------------------------

export function calculateInternal(input: BomInput): BomResult {
  const warnings: string[] = [];
  const reserve = input.reservePercent ?? DEFAULT_RESERVE_PERCENT;

  // Presence warnings
  if (!input.pv) warnings.push(WARN_NO_PV);
  if (!input.battery) warnings.push(WARN_NO_BATTERY);
  if (!input.inverter) warnings.push(WARN_NO_INVERTER);
  if (!input.chargeController) warnings.push(WARN_NO_CONTROLLER);
  if (!input.cables || input.cables.length === 0) warnings.push(WARN_NO_CABLES);
  if (!input.protections || input.protections.length === 0) {
    warnings.push(WARN_NO_PROTECTION);
  }

  // Build per-component
  const items: BomLineItem[] = [
    ...buildPvItems(input, reserve),
    ...buildBatteryItems(input, reserve),
    ...buildInverterItems(input),
    ...buildControllerItems(input),
    ...buildCableItems(input, reserve),
    ...buildProtectionItems(input),
    ...buildSpdItems(input),
    ...buildEarthingItems(input),
    ...buildMonitoringItems(input),
  ];

  // Engineering warnings
  if (input.pv) {
    if (input.pv.parallelStrings > HIGH_PARALLEL_STRINGS_WARN) {
      warnings.push(WARN_HIGH_STRINGS(input.pv.parallelStrings));
    }
    if (input.pv.totalPanels > LARGE_PANEL_COUNT_WARN) {
      warnings.push(WARN_LARGE_PANEL_COUNT(input.pv.totalPanels));
    }
    if (!input.mountingType) {
      warnings.push(WARN_NO_MOUNTING_TYPE);
    }
  }
  if (input.chargeController?.technology === "pwm") {
    warnings.push(WARN_PWM_CONTROLLER);
  }

  // Distinct categories
  const categories = Array.from(new Set(items.map((i) => i.category))).sort();

  const totalQuantity = items.reduce((sum, i) => sum + i.quantity, 0);

  return {
    projectName: input.projectName,
    items,
    itemCount: items.length,
    totalQuantity: roundQty(totalQuantity),
    categories,
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
 * SolarAudit — BOM Engine: Public API
 *
 * Boundary:
 *   Input -> Validation -> Calculation -> Engineering Result
 *
 * The BOM Engine sits between engineering sizing (Solar, Battery,
 * Inverter, Cable, Protection) and financial costing (Costing Engine).
 * It produces a categorical material list with quantities but NO
 * pricing — pricing is the Costing Engine's job.
 */

import type { BomInput, BomResult } from "./types";
import { validateInput } from "./validation";
import { calculateInternal } from "./calculation";

export * from "./types";

export function calculateBom(input: BomInput): BomResult {
  const errors = validateInput(input);

  if (errors.length > 0) {
    return {
      projectName: input.projectName ?? "",
      items: [],
      itemCount: 0,
      totalQuantity: 0,
      categories: [],
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
  ERROR_NO_PROJECT_NAME,
  ERROR_INVALID_PANEL_POWER,
  ERROR_INVALID_PANEL_COUNT,
  ERROR_INVALID_BATTERY_CELL_VOLTAGE,
  ERROR_INVALID_INVERTER_VA,
  ERROR_INVALID_RESERVE_PERCENT,
} from "../errors";

const base = { projectName: "Test site" };

describe("validateInput", () => {
  it("accepts a minimal valid input", () => {
    expect(validateInput(base)).toEqual([]);
  });

  it("rejects missing project name", () => {
    expect(validateInput({ projectName: "" }))
      .toContain(ERROR_NO_PROJECT_NAME);
  });

  it("rejects bad panel power", () => {
    const errs = validateInput({
      ...base,
      pv: {
        arrayKwp: 4,
        panelRatedWatts: 0,
        seriesPanels: 10,
        parallelStrings: 1,
        totalPanels: 10,
        arrayVoc: 400,
        arrayIsc: 11,
        arrayImp: 10,
      },
    });
    expect(errs).toContain(ERROR_INVALID_PANEL_POWER);
  });

  it("rejects non-integer panel count", () => {
    const errs = validateInput({
      ...base,
      pv: {
        arrayKwp: 4,
        panelRatedWatts: 400,
        seriesPanels: 10,
        parallelStrings: 1,
        totalPanels: 10.5,
        arrayVoc: 400,
        arrayIsc: 11,
        arrayImp: 10,
      },
    });
    expect(errs).toContain(ERROR_INVALID_PANEL_COUNT);
  });

  it("rejects bad battery cell voltage", () => {
    const errs = validateInput({
      ...base,
      battery: {
        technology: "lifepo4",
        cellVoltage: 0,
        cellCapacityAh: 100,
        seriesCells: 4,
        parallelStrings: 1,
        totalCells: 4,
        bankVoltage: 48,
        bankCapacityAh: 100,
      },
    });
    expect(errs).toContain(ERROR_INVALID_BATTERY_CELL_VOLTAGE);
  });

  it("rejects bad inverter VA", () => {
    const errs = validateInput({
      ...base,
      inverter: {
        recommendedVa: 0,
        systemVoltage: 48,
        outputVoltage: 230,
        outputFrequency: 50,
      },
    });
    expect(errs).toContain(ERROR_INVALID_INVERTER_VA);
  });

  it("rejects bad reserve percent", () => {
    expect(validateInput({ ...base, reservePercent: 0.8 }))
      .toContain(ERROR_INVALID_RESERVE_PERCENT);
  });

  it("collects multiple errors", () => {
    const errs = validateInput({
      projectName: "",
      reservePercent: 1,
    });
    expect(errs.length).toBeGreaterThanOrEqual(2);
  });
});
EOF

# ----------------------------------------------------------------------
# __tests__/calculation.test.ts
# ----------------------------------------------------------------------
cat > "$ROOT/__tests__/calculation.test.ts" <<'EOF'
import { describe, it, expect } from "vitest";
import { calculateInternal } from "../calculation";
import type { BomInput } from "../types";

const baseInput: BomInput = {
  projectName: "Home 5 kWp",
  pv: {
    arrayKwp: 4.4,
    panelRatedWatts: 400,
    seriesPanels: 11,
    parallelStrings: 1,
    totalPanels: 11,
    arrayVoc: 451,
    arrayIsc: 11,
    arrayImp: 10,
  },
  battery: {
    technology: "lifepo4",
    cellVoltage: 12,
    cellCapacityAh: 100,
    seriesCells: 4,
    parallelStrings: 2,
    totalCells: 8,
    bankVoltage: 48,
    bankCapacityAh: 200,
  },
  inverter: {
    recommendedVa: 5000,
    systemVoltage: 48,
    outputVoltage: 230,
    outputFrequency: 50,
  },
  chargeController: {
    technology: "mppt",
    recommendedCurrentA: 100,
    maxPvInputVoltage: 500,
  },
  cables: [
    {
      role: "battery-main",
      selectedAreaMm2: 35,
      lengthM: 3,
      conductorMaterial: "copper",
    },
    {
      role: "pv-string-1",
      selectedAreaMm2: 6,
      lengthM: 15,
      conductorMaterial: "copper",
    },
  ],
  protections: [
    {
      role: "battery-main",
      technology: "dc-breaker",
      selectedRatingA: 150,
      minimumVoltageRatingV: 58,
    },
    {
      role: "pv-string-1",
      technology: "fuse",
      selectedRatingA: 20,
      minimumVoltageRatingV: 500,
    },
  ],
};

describe("calculateInternal", () => {
  it("produces a non-empty item list", () => {
    const r = calculateInternal(baseInput);
    expect(r.items.length).toBeGreaterThan(0);
    expect(r.itemCount).toBe(r.items.length);
  });

  it("includes PV modules with quantity = total panels + reserve", () => {
    const r = calculateInternal(baseInput);
    const panels = r.items.find((i) => i.category === "pv-modules");
    // 11 panels × 1.05 reserve = 11.55 -> ceil to 2dp = 11.55
    expect(panels?.quantity).toBeGreaterThanOrEqual(11);
    expect(panels?.unit).toBe("pcs");
  });

  it("includes battery cells with totalCells + reserve", () => {
    const r = calculateInternal(baseInput);
    const cells = r.items.find((i) => i.category === "batteries");
    expect(cells?.quantity).toBeGreaterThanOrEqual(8);
  });

  it("includes inverter, controller", () => {
    const r = calculateInternal(baseInput);
    expect(r.items.some((i) => i.category === "inverter")).toBe(true);
    expect(r.items.some((i) => i.category === "charge-controller")).toBe(true);
  });

  it("includes cable runs with allowance applied", () => {
    const r = calculateInternal(baseInput);
    const batteryCable = r.items.find(
      (i) => i.category === "battery-cables" && i.description.includes("battery-main"),
    );
    // 3 m + 2 m allowance = 5 m × 2 (go + return) = 10 m, × 1.05 reserve = 10.5
    expect(batteryCable?.quantity).toBeGreaterThanOrEqual(10);
  });

  it("includes protection devices with correct category mapping", () => {
    const r = calculateInternal(baseInput);
    expect(r.items.some((i) => i.category === "dc-breakers")).toBe(true);
    expect(r.items.some((i) => i.category === "dc-fuses")).toBe(true);
  });

  it("includes earthing by default", () => {
    const r = calculateInternal(baseInput);
    expect(r.items.some((i) => i.category === "earthing")).toBe(true);
  });

  it("includes SPD by default", () => {
    const r = calculateInternal(baseInput);
    expect(r.items.some((i) => i.category === "spd")).toBe(true);
  });

  it("includes monitoring when requested", () => {
    const without = calculateInternal(baseInput);
    const withM = calculateInternal({ ...baseInput, includeMonitoring: true });
    const withoutCount = without.items.filter((i) => i.category === "monitoring").length;
    const withCount = withM.items.filter((i) => i.category === "monitoring").length;
    expect(withoutCount).toBe(0);
    expect(withCount).toBeGreaterThan(0);
  });

  it("earthing can be disabled", () => {
    const r = calculateInternal({ ...baseInput, includeEarthing: false });
    expect(r.items.some((i) => i.category === "earthing")).toBe(false);
  });

  it("SPD can be disabled", () => {
    const r = calculateInternal({ ...baseInput, includeSpd: false });
    expect(r.items.some((i) => i.category === "spd")).toBe(false);
  });

  it("emits a warning when no mounting type is provided", () => {
    const r = calculateInternal(baseInput);
    expect(r.warnings.some((w) => /mountingType/i.test(w))).toBe(true);
  });

  it("emits a warning when PWM controller is used", () => {
    const r = calculateInternal({
      ...baseInput,
      chargeController: { ...baseInput.chargeController!, technology: "pwm" },
    });
    expect(r.warnings.some((w) => /PWM/i.test(w))).toBe(true);
  });

  it("emits presence warnings when components are missing", () => {
    const r = calculateInternal({ projectName: "Minimal" });
    expect(r.warnings.length).toBeGreaterThan(0);
    expect(r.items.length).toBeGreaterThanOrEqual(0);
  });

  it("categories list is sorted and unique", () => {
    const r = calculateInternal(baseInput);
    const sorted = [...r.categories].sort();
    expect(r.categories).toEqual(sorted);
    expect(new Set(r.categories).size).toBe(r.categories.length);
  });
});
EOF

# ----------------------------------------------------------------------
# __tests__/integration.test.ts
# ----------------------------------------------------------------------
cat > "$ROOT/__tests__/integration.test.ts" <<'EOF'
import { describe, it, expect } from "vitest";
import { calculateBom } from "../index";

describe("calculateBom (public API)", () => {
  it("returns invalid on missing project name", () => {
    const r = calculateBom({ projectName: "" });
    expect(r.isValid).toBe(false);
    expect(r.errors.length).toBeGreaterThan(0);
    expect(r.items).toEqual([]);
  });

  it("returns a complete BOM for a full system", () => {
    const r = calculateBom({
      projectName: "Off-grid home",
      pv: {
        arrayKwp: 4.4,
        panelRatedWatts: 400,
        seriesPanels: 11,
        parallelStrings: 1,
        totalPanels: 11,
        arrayVoc: 451,
        arrayIsc: 11,
        arrayImp: 10,
      },
      battery: {
        technology: "lifepo4",
        cellVoltage: 12,
        cellCapacityAh: 100,
        seriesCells: 4,
        parallelStrings: 2,
        totalCells: 8,
        bankVoltage: 48,
        bankCapacityAh: 200,
      },
      inverter: {
        recommendedVa: 5000,
        systemVoltage: 48,
        outputVoltage: 230,
        outputFrequency: 50,
      },
      chargeController: {
        technology: "mppt",
        recommendedCurrentA: 100,
        maxPvInputVoltage: 500,
      },
      cables: [
        {
          role: "battery-main",
          selectedAreaMm2: 35,
          lengthM: 3,
          conductorMaterial: "copper",
        },
      ],
      protections: [
        {
          role: "battery-main",
          technology: "dc-breaker",
          selectedRatingA: 150,
          minimumVoltageRatingV: 58,
        },
      ],
    });

    expect(r.isValid).toBe(true);
    expect(r.errors).toEqual([]);
    expect(r.items.length).toBeGreaterThan(5);
    expect(r.categories.length).toBeGreaterThan(3);
    expect(r.totalQuantity).toBeGreaterThan(0);
  });

  it("works with only PV", () => {
    const r = calculateBom({
      projectName: "PV-only",
      pv: {
        arrayKwp: 2,
        panelRatedWatts: 400,
        seriesPanels: 5,
        parallelStrings: 1,
        totalPanels: 5,
        arrayVoc: 200,
        arrayIsc: 11,
        arrayImp: 10,
      },
    });
    expect(r.isValid).toBe(true);
    expect(r.items.some((i) => i.category === "pv-modules")).toBe(true);
    expect(r.items.some((i) => i.category === "pv-mounting")).toBe(true);
  });

  it("uses default reserve of 5%", () => {
    const r = calculateBom({
      projectName: "Test",
      pv: {
        arrayKwp: 4,
        panelRatedWatts: 400,
        seriesPanels: 10,
        parallelStrings: 1,
        totalPanels: 10,
        arrayVoc: 400,
        arrayIsc: 11,
        arrayImp: 10,
      },
    });
    const panels = r.items.find((i) => i.category === "pv-modules");
    // 10 × 1.05 = 10.5
    expect(panels?.quantity).toBe(10.5);
  });

  it("respects a custom reserve", () => {
    const r = calculateBom({
      projectName: "Test",
      reservePercent: 0.1,
      pv: {
        arrayKwp: 4,
        panelRatedWatts: 400,
        seriesPanels: 10,
        parallelStrings: 1,
        totalPanels: 10,
        arrayVoc: 400,
        arrayIsc: 11,
        arrayImp: 10,
      },
    });
    const panels = r.items.find((i) => i.category === "pv-modules");
    // 10 × 1.1 = 11
    expect(panels?.quantity).toBe(11);
  });
});
EOF

echo "✔ BOM engine scaffolded at: $ROOT"
echo
if command -v tree >/dev/null 2>&1; then
  tree "$ROOT"
else
  find "$ROOT" -type f | sort
fi