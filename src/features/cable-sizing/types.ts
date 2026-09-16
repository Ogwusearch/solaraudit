/**
 * SolarAudit — Cable Sizing feature: Types
 *
 * Feature-local view models. UI binds to these; the service layer
 * parses them into the engine's typed input.
 *
 * IMPORTANT: no engineering formula lives here.
 *
 * The engine is called ONCE PER CIRCUIT — the same way a cable is
 * sized per run. The draft is a single circuit's parameters.
 */

import type {
  CableResult,
  CircuitType,
  ConductorMaterial,
  InstallationMethod,
} from "../../engineering/cable";

export interface CableSizingFormDraft {
  // Circuit electrical parameters
  readonly currentA: string;
  readonly lengthM: string;
  readonly systemVoltage: string;
  readonly allowableDropPercent: string;

  // Physical / installation selections
  readonly material: ConductorMaterial;
  readonly circuitType: CircuitType;
  readonly installationMethod: InstallationMethod;

  // Optional derating inputs — empty means "use engine default"
  readonly ambientTemperatureC: string;
  readonly conductorTempC: string;
  readonly groupingCount: string;

  // Optional design margin
  readonly designMargin: string;
}

export interface CableSizingParsedInput {
  readonly currentA: number;
  readonly lengthM: number;
  readonly systemVoltage: number;
  readonly allowableDropPercent: number;
  readonly material: ConductorMaterial;
  readonly circuitType: CircuitType;
  readonly installationMethod: InstallationMethod;
  readonly ambientTemperatureC?: number;
  readonly conductorTempC?: number;
  readonly groupingCount?: number;
  readonly designMargin?: number;
}

export interface CableSizingView {
  readonly result: CableResult;
  readonly calculatedAt: string;
}

export interface FormValidationErrors {
  readonly [fieldKey: string]: string | undefined;
}

export type CableSizingStatus =
  | "idle"
  | "editing"
  | "calculating"
  | "calculated"
  | "error";
