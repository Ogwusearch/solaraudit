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
