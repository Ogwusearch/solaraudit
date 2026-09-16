/**
 * SolarAudit — Voltage Drop Engine: Types
 *
 * Pure data definitions. No logic, no imports from siblings.
 *
 * Two modes, both supported in one call:
 *   forward : given conductorAreaMm2, compute the voltage drop
 *   inverse : given targetDropPercent, solve the minimum area
 */

export type ConductorMaterial = "copper" | "aluminium";
export type CircuitType = "dc" | "ac-single-phase" | "ac-three-phase";

export interface VoltageDropInput {
  readonly currentA: number;              // design current (A)
  readonly lengthM: number;               // one-way run length (m)
  readonly systemVoltageV: number;        // nominal system voltage (V)

  readonly material: ConductorMaterial;
  readonly circuitType: CircuitType;

  // Forward mode
  readonly conductorAreaMm2?: number;     // known area; if present, drop is computed

  // Inverse mode
  readonly targetDropPercent?: number;    // e.g. 3 for 3%

  // Conductor conditions
  readonly conductorTempC?: number;       // default 70 °C (PVC)
  readonly powerFactor?: number;          // default 1.0 (DC and unity PF)

  // Optional reactance term (large cables / long runs). If omitted,
  // the engine assumes negligible reactance.
  readonly reactanceOhmPerKm?: number;
}

export interface VoltageDropResult {
  // Forward outputs (0 when forward not requested)
  readonly voltageDropV: number;
  readonly voltageDropPercent: number;
  readonly resistanceOhmPerKm: number;
  readonly resistanceOhm: number;         // total for the run
  readonly powerLossW: number;

  // Inverse outputs (0 when inverse not requested)
  readonly calculatedMinAreaMm2: number;

  // Verdict
  readonly withinTarget: boolean;         // true if drop <= target (or target not given)

  // Context
  readonly conductorTempC: number;
  readonly effectivePowerFactor: number;
  readonly circuitFactor: number;         // 2 (dc / 1φ) or √3 (3φ)
  readonly resistivityOhmMm2PerM: number; // temperature-corrected

  readonly warnings: readonly string[];
  readonly errors: readonly string[];
  readonly isValid: boolean;
}
