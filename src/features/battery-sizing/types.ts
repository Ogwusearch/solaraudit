/**
 * SolarAudit — Battery Sizing feature: Types
 *
 * Feature-local view models. UI binds to these; the service layer
 * parses them into the engine's typed input.
 *
 * IMPORTANT: no engineering formula lives here.
 */

import type {
  BatteryCellSpec,
  BatteryResult,
  BatteryTechnology,
} from "../../engineering/battery";

export interface CellSpecDraft {
  readonly name: string;
  readonly technology: BatteryTechnology;
  readonly nominalVoltage: string;        // V
  readonly capacityAh: string;            // Ah
  readonly maxDepthOfDischarge: string;   // 0..1
  readonly roundTripEfficiency: string;   // 0..1
  readonly maxChargeCurrentA: string;     // optional, empty = unset
}

export interface BatterySizingFormDraft {
  readonly dailyEnergyKwh: string;
  readonly autonomyDays: string;
  readonly systemVoltage: string;
  readonly designMargin: string;
  readonly temperatureDerating: string;
  readonly maxDepthOfDischarge: string;
  readonly roundTripEfficiency: string;
  readonly cell: CellSpecDraft;
  readonly maxParallelStrings: string;    // optional, empty = unset
}

export interface BatterySizingParsedInput {
  readonly dailyEnergyKwh: number;
  readonly autonomyDays: number;
  readonly systemVoltage: number;
  readonly designMargin: number;
  readonly temperatureDerating: number;
  readonly maxDepthOfDischarge: number;
  readonly roundTripEfficiency: number;
  readonly cell: BatteryCellSpec;
  readonly maxParallelStrings?: number;
}

export interface BatterySizingView {
  readonly result: BatteryResult;
  readonly calculatedAt: string;
}

export interface FormValidationErrors {
  readonly [fieldKey: string]: string | undefined;
}

export type BatterySizingStatus =
  | "idle"
  | "editing"
  | "calculating"
  | "calculated"
  | "error";
