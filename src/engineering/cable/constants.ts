/**
 * SolarAudit — Cable Engine: Constants
 */

export const DEFAULT_DESIGN_MARGIN = 0.0;

export const DEFAULT_AMBIENT_TEMP_C = 30;
export const DEFAULT_CONDUCTOR_TEMP_C = 70; // PVC 70 °C insulation

export const DEFAULT_GROUPING_COUNT = 1;

// ---------------------------------------------------------------------------
// Conductor electrical properties
// ---------------------------------------------------------------------------

// Resistivity at 20 °C, Ω·mm²/m
export const RESISTIVITY_20C: Record<
  string,
  number
> = {
  copper: 0.017241,
  aluminium: 0.028264,
};

// Temperature coefficient of resistance, per °C
export const ALPHA_20C: Record<
  string,
  number
> = {
  copper: 0.00393,
  aluminium: 0.00403,
};

// ---------------------------------------------------------------------------
// Standard conductor sizes
// ---------------------------------------------------------------------------

export const STANDARD_AREAS_MM2 = [
  1.0,
  1.5,
  2.5,
  4,
  6,
  10,
  16,
  25,
  35,
  50,
  70,
  95,
  120,
  150,
  185,
  240,
  300,
  400,
  500,
  630,
];

// ---------------------------------------------------------------------------
// Approximate ampacity
// ---------------------------------------------------------------------------
//
// First-pass copper ampacity approximation at 30 °C ambient,
// free-air, single circuit.
//
// Real installations should use the applicable installation,
// insulation, grouping, and correction tables.

export const BASE_AMPACITY_COPPER: Record<
  number,
  number
> = {
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

// Approximate aluminium ampacity relative to copper
// for the same conductor cross-sectional area.
export const ALUMINIUM_AMPACITY_FACTOR = 0.78;

// ---------------------------------------------------------------------------
// Temperature derating
// ---------------------------------------------------------------------------
//
// Approximate correction factors for PVC 70 °C conductor.
// These values are intended for first-pass engineering calculations.
//
// For XLPE 90 °C or other insulation systems, use a separate table.

export const TEMP_DERATING_PVC: Array<
  [number, number]
> = [
  [25, 1.06],
  [30, 1.0],
  [35, 0.94],
  [40, 0.87],
  [45, 0.79],
  [50, 0.71],
  [55, 0.61],
  [60, 0.5],
];

// ---------------------------------------------------------------------------
// Grouping derating
// ---------------------------------------------------------------------------
//
// [number of circuits, correction factor]

export const GROUPING_DERATING: Array<
  [number, number]
> = [
  [1, 1.0],
  [2, 0.8],
  [3, 0.7],
  [4, 0.65],
  [5, 0.6],
  [6, 0.57],
];

// ---------------------------------------------------------------------------
// Circuit voltage-drop factors
// ---------------------------------------------------------------------------
//
// DC / single phase:
//   Vd = 2 × I × L × ρ / A
//
// Three phase:
//   Vd = √3 × I × L × ρ / A

export const CIRCUIT_FACTOR: Record<
  string,
  number
> = {
  dc: 2,
  "ac-single-phase": 2,
  "ac-three-phase": Math.sqrt(3),
};

// ---------------------------------------------------------------------------
// Engineering warning thresholds
// ---------------------------------------------------------------------------

export const HIGH_AMBIENT_THRESHOLD_C = 45;

export const HIGH_DROP_THRESHOLD_PERCENT = 5;

export const LONG_RUN_THRESHOLD_M = 100;

export const HIGH_GROUPING_THRESHOLD = 3;

// ---------------------------------------------------------------------------
// Numerical precision
// ---------------------------------------------------------------------------

export const ROUND_DECIMALS = 3;