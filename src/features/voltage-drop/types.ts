/**
 * SolarAudit — Voltage Drop feature: Types
 *
 * Feature-local view models. UI binds to these; the service layer
 * parses them into the engine's typed input.
 *
 * IMPORTANT: no engineering formula lives here.
 *
 * The engine has two modes:
 *   forward  — conductorAreaMm2 provided  -> compute drop
 *   inverse  — targetDropPercent provided -> solve minimum area
 *
 * At least one is required. Both may be provided together.
 */

import type {
  CircuitType,
  ConductorMaterial,
  VoltageDropResult,
} from "../../engineering/voltage-drop";

export interface VoltageDropFormDraft {
  // Circuit electrical parameters
  readonly currentA: string;
  readonly lengthM: string;
  readonly systemVoltageV: string;

  // Physical selections
  readonly material: ConductorMaterial;
  readonly circuitType: CircuitType;

  // Forward mode — known area
  readonly conductorAreaMm2: string;   // empty = forward not requested

  // Inverse mode — target drop
  readonly targetDropPercent: string;  // empty = inverse not requested

  // Optional conditions
  readonly conductorTempC: string;     // empty = engine default (70)
  readonly powerFactor: string;        // empty = engine default (1.0)
  readonly reactanceOhmPerKm: string;  // empty = ignored
}

export interface VoltageDropParsedInput {
  readonly currentA: number;
  readonly lengthM: number;
  readonly systemVoltageV: number;
  readonly material: ConductorMaterial;
  readonly circuitType: CircuitType;
  readonly conductorAreaMm2?: number;
  readonly targetDropPercent?: number;
  readonly conductorTempC?: number;
  readonly powerFactor?: number;
  readonly reactanceOhmPerKm?: number;
}

export interface VoltageDropView {
  readonly result: VoltageDropResult;
  readonly calculatedAt: string;
}

export interface FormValidationErrors {
  readonly [fieldKey: string]: string | undefined;
}

export type VoltageDropStatus =
  | "idle"
  | "editing"
  | "calculating"
  | "calculated"
  | "error";
