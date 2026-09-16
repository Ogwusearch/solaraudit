/**
 * SolarAudit — Protection Sizing feature: Types
 *
 * Feature-local view models. UI binds to these; the service layer
 * parses them into the engine's typed input.
 *
 * IMPORTANT: no engineering formula lives here.
 */

import type {
  CircuitRole,
  ProtectionResult,
  ProtectionTechnology,
  VoltageType,
} from "../../engineering/protection";

export interface ProtectionSizingFormDraft {
  // Circuit identity
  readonly role: CircuitRole;
  readonly voltageType: VoltageType;
  readonly technology: ProtectionTechnology;

  // Circuit electrical parameters
  readonly continuousCurrentA: string;
  readonly systemVoltageV: string;

  // Optional design inputs
  readonly safetyFactor: string;          // empty = role default
  readonly availableFaultCurrentKa: string;// empty = not provided

  // Optional candidate device (for compatibility checks)
  readonly deviceVoltageRatingV: string;
  readonly deviceInterruptRatingKa: string;
  readonly deviceCurrentRatingA: string;
}

export interface ProtectionSizingParsedInput {
  readonly role: CircuitRole;
  readonly voltageType: VoltageType;
  readonly technology: ProtectionTechnology;
  readonly continuousCurrentA: number;
  readonly systemVoltageV: number;
  readonly safetyFactor?: number;
  readonly availableFaultCurrentKa?: number;
  readonly deviceVoltageRatingV?: number;
  readonly deviceInterruptRatingKa?: number;
  readonly deviceCurrentRatingA?: number;
}

export interface ProtectionSizingView {
  readonly result: ProtectionResult;
  readonly calculatedAt: string;
}

export interface FormValidationErrors {
  readonly [fieldKey: string]: string | undefined;
}

export type ProtectionSizingStatus =
  | "idle"
  | "editing"
  | "calculating"
  | "calculated"
  | "error";
