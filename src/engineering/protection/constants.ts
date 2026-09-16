
/**
 * SolarAudit — Protection Engine: Constants
 */

import type { CircuitRole } from "./types";

// ---------------------------------------------------------------------------
// Safety factors
// ---------------------------------------------------------------------------
//
// Default protection design factors by circuit role.
//
// These are configurable engineering defaults, not universal code rules.
// The applicable electrical code, equipment documentation, conductor
// ampacity, installation method, and project design basis must be verified
// separately.
//
// PV-string uses 1.56 as the configured default PV design factor.
// Continuous-load and other circuit defaults use 1.25.
//
// ---------------------------------------------------------------------------

export const ROLE_SAFETY_FACTOR: Record<CircuitRole, number> = {
  battery: 1.25,
  "pv-string": 1.56,
  "pv-array": 1.25,
  "charge-controller": 1.25,
  "inverter-dc": 1.25,
  "inverter-ac": 1.25,
  "ac-load": 1.25,
  "ac-grid": 1.25,
};

// ---------------------------------------------------------------------------
// Standard protection-device current ratings
// ---------------------------------------------------------------------------
//
// Design-selection values combining commonly encountered NEC/IEC ratings.
// Actual device availability and code compliance must be verified against
// the selected manufacturer and project jurisdiction.
//
// ---------------------------------------------------------------------------

export const STANDARD_RATINGS_A = [
  1,
  2,
  3,
  4,
  5,
  6,
  8,
  10,
  12,
  15,
  16,
  20,
  25,
  30,
  32,
  35,
  40,
  45,
  50,
  60,
  63,
  70,
  80,
  90,
  100,
  110,
  125,
  150,
  160,
  175,
  200,
  225,
  250,
  300,
  350,
  400,
  450,
  500,
  600,
  630,
  700,
  800,
  1000,
  1200,
] as const;

// ---------------------------------------------------------------------------
// DC voltage margin
// ---------------------------------------------------------------------------
//
// Conservative screening factor for DC protection voltage selection.
// Actual DC device voltage rating must be verified against the system's
// maximum operating voltage, temperature conditions, switching category,
// manufacturer rating, and applicable standards.
//
// ---------------------------------------------------------------------------

export const DC_VOLTAGE_MARGIN_FACTOR = 1.2;

// ---------------------------------------------------------------------------
// Fault-current warning thresholds
// ---------------------------------------------------------------------------

export const HIGH_FAULT_CURRENT_KA = 10;
export const VERY_HIGH_FAULT_CURRENT_KA = 25;

// ---------------------------------------------------------------------------
// Safety-factor warning threshold
// ---------------------------------------------------------------------------

export const HIGH_SAFETY_FACTOR_THRESHOLD = 2.0;

// ---------------------------------------------------------------------------
// High-current device warning
// ---------------------------------------------------------------------------
//
// Above this level, investigate whether an MCCB or another appropriately
// rated protective device is more suitable than an MCB.
//
// This is a design warning, not a universal device-selection rule.
//
// ---------------------------------------------------------------------------

export const HIGH_CURRENT_THRESHOLD_A = 400;

// ---------------------------------------------------------------------------
// Rounding
// ---------------------------------------------------------------------------

export const ROUND_DECIMALS = 3;
export const ROUND_DECIMALS_KA = 3;
