/**
 * SolarAudit — Inverter Sizing feature: Types
 *
 * Feature-local view models. UI binds to these; the service layer
 * parses them into the engine's typed input.
 *
 * IMPORTANT: no engineering formula lives here.
 */

import type {
  InverterResult,
  InverterTopology,
  InverterType,
} from "../../engineering/inverter";

export interface InverterSizingFormDraft {
  // Loads (typically derived from a Load Audit in a later phase)
  readonly continuousLoadW: string;
  readonly peakLoadW: string;
  readonly surgeLoadW: string;

  // System / output
  readonly systemVoltage: string;
  readonly outputVoltage: string;
  readonly outputFrequency: string;
  readonly powerFactor: string;

  // Design factors
  readonly designMargin: string;
  readonly inverterEfficiency: string;
  readonly surgeDurationSec: string;      // optional, empty = unset

  // Classification
  readonly type: InverterType;
  readonly topology: InverterTopology;

  // Optional site limit
  readonly maxDcInputCurrentA: string;    // optional, empty = unset
}

export interface InverterSizingParsedInput {
  readonly continuousLoadW: number;
  readonly peakLoadW: number;
  readonly surgeLoadW: number;
  readonly systemVoltage: number;
  readonly outputVoltage: number;
  readonly outputFrequency: number;
  readonly powerFactor: number;
  readonly designMargin: number;
  readonly inverterEfficiency: number;
  readonly surgeDurationSec?: number;
  readonly type: InverterType;
  readonly topology: InverterTopology;
  readonly maxDcInputCurrentA?: number;
}

export interface InverterSizingView {
  readonly result: InverterResult;
  readonly calculatedAt: string;
}

export interface FormValidationErrors {
  readonly [fieldKey: string]: string | undefined;
}

export type InverterSizingStatus =
  | "idle"
  | "editing"
  | "calculating"
  | "calculated"
  | "error";
