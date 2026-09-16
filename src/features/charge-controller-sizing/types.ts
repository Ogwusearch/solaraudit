/**
 * SolarAudit — Charge Controller Sizing feature: Types
 *
 * Feature-local view models. UI binds to these; the service layer
 * parses them into the engine's typed input.
 *
 * IMPORTANT: no engineering formula lives here.
 */

import type {
  ChargeControllerResult,
  ControllerTechnology,
} from "../../engineering/charge-controller";

export interface ChargeControllerSizingFormDraft {
  // PV array (typically from a Solar Sizing result)
  readonly pvArrayKwp: string;
  readonly pvVmp: string;
  readonly pvVoc: string;
  readonly pvImp: string;
  readonly pvIsc: string;

  // Battery (typically from a Battery Sizing result)
  readonly batteryVoltage: string;
  readonly batteryCapacityAh: string;

  // Selection
  readonly technology: ControllerTechnology;

  // Design factors
  readonly designMargin: string;
  readonly controllerEfficiency: string;

  // Optional controller limits
  readonly maxPvInputVoltage: string;
  readonly maxPvInputCurrentA: string;
  readonly maxOutputCurrentA: string;
}

export interface ChargeControllerSizingParsedInput {
  readonly pvArrayKwp: number;
  readonly pvVmp: number;
  readonly pvVoc: number;
  readonly pvImp: number;
  readonly pvIsc: number;
  readonly batteryVoltage: number;
  readonly batteryCapacityAh: number;
  readonly technology: ControllerTechnology;
  readonly designMargin: number;
  readonly controllerEfficiency: number;
  readonly maxPvInputVoltage?: number;
  readonly maxPvInputCurrentA?: number;
  readonly maxOutputCurrentA?: number;
}

export interface ChargeControllerSizingView {
  readonly result: ChargeControllerResult;
  readonly calculatedAt: string;
}

export interface FormValidationErrors {
  readonly [fieldKey: string]: string | undefined;
}

export type ChargeControllerSizingStatus =
  | "idle"
  | "editing"
  | "calculating"
  | "calculated"
  | "error";
