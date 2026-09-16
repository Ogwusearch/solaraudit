/**
 * SolarAudit — Units Engine: Constants
 *
 * Two tables drive the engine:
 *   DIMENSION_OF  — which dimension each unit belongs to
 *   LINEAR_FACTOR — multiplicative factor from each linear unit to
 *                   its dimension's base unit
 *
 * Base units per dimension:
 *   temperature      : degC  (handled affinely, not via LINEAR_FACTOR)
 *   length           : m
 *   area             : m2
 *   volume           : L     (US liquid gallon = 3.785411784 L)
 *   mass             : kg
 *   power            : W
 *   apparent-power   : VA
 *   energy           : Wh    (1 J = 1/3600 Wh)
 *   charge           : Ah    (1 C  = 1/3600 Ah)
 *   voltage          : V
 *   current          : A
 *   resistance       : Ohm
 *   frequency        : Hz
 */

import type { Dimension, Unit } from "./types";

export const DIMENSION_OF: Record<Unit, Dimension> = {
  // temperature
  degC: "temperature",
  degF: "temperature",
  K: "temperature",

  // length
  mm: "length",
  cm: "length",
  m: "length",
  km: "length",
  in: "length",
  ft: "length",

  // area
  mm2: "area",
  cm2: "area",
  m2: "area",
  in2: "area",
  ft2: "area",

  // volume
  L: "volume",
  m3: "volume",
  gal: "volume",

  // mass
  g: "mass",
  kg: "mass",
  lb: "mass",

  // power (real)
  W: "power",
  kW: "power",
  MW: "power",
  hp: "power",

  // apparent power
  VA: "apparent-power",
  kVA: "apparent-power",
  MVA: "apparent-power",

  // energy
  Wh: "energy",
  kWh: "energy",
  MWh: "energy",
  J: "energy",
  BTU: "energy",

  // charge
  mAh: "charge",
  Ah: "charge",
  C: "charge",

  // voltage
  mV: "voltage",
  V: "voltage",
  kV: "voltage",

  // current
  mA: "current",
  A: "current",
  kA: "current",

  // resistance
  mOhm: "resistance",
  Ohm: "resistance",
  kOhm: "resistance",

  // frequency
  Hz: "frequency",
  kHz: "frequency",
  MHz: "frequency",
};

// Multiply by this factor to convert *from* the unit *to* its base.
// Temperature units are handled affinely and are deliberately absent.
export const LINEAR_FACTOR: Record<string, number> = {
  // length (base m)
  mm: 0.001,
  cm: 0.01,
  m: 1,
  km: 1000,
  in: 0.0254,
  ft: 0.3048,

  // area (base m²)
  mm2: 1e-6,
  cm2: 1e-4,
  m2: 1,
  in2: 0.00064516,       // 0.0254²
  ft2: 0.09290304,       // 0.3048²

  // volume (base L)
  L: 1,
  m3: 1000,
  gal: 3.785411784,      // US liquid gallon

  // mass (base kg)
  g: 0.001,
  kg: 1,
  lb: 0.45359237,

  // power (base W)
  W: 1,
  kW: 1000,
  MW: 1e6,
  hp: 745.699872,        // mechanical horsepower

  // apparent power (base VA)
  VA: 1,
  kVA: 1000,
  MVA: 1e6,

  // energy (base Wh)
  Wh: 1,
  kWh: 1000,
  MWh: 1e6,
  J: 1 / 3600,
  BTU: 0.29307107,       // IT BTU

  // charge (base Ah)
  mAh: 0.001,
  Ah: 1,
  C: 1 / 3600,

  // voltage (base V)
  mV: 0.001,
  V: 1,
  kV: 1000,

  // current (base A)
  mA: 0.001,
  A: 1,
  kA: 1000,

  // resistance (base Ohm)
  mOhm: 0.001,
  Ohm: 1,
  kOhm: 1000,

  // frequency (base Hz)
  Hz: 1,
  kHz: 1000,
  MHz: 1e6,
};

export const TEMPERATURE_UNITS: ReadonlySet<Unit> = new Set<Unit>([
  "degC",
  "degF",
  "K",
]);

export const POWER_UNITS: ReadonlySet<Unit> = new Set<Unit>([
  "W",
  "kW",
  "MW",
  "hp",
]);

export const APPARENT_POWER_UNITS: ReadonlySet<Unit> = new Set<Unit>([
  "VA",
  "kVA",
  "MVA",
]);

export const ENERGY_UNITS: ReadonlySet<Unit> = new Set<Unit>([
  "Wh",
  "kWh",
  "MWh",
  "J",
  "BTU",
]);

export const CHARGE_UNITS: ReadonlySet<Unit> = new Set<Unit>([
  "mAh",
  "Ah",
  "C",
]);

export const LOW_POWER_FACTOR_THRESHOLD = 0.5;

export const ROUND_DECIMALS = 10;
