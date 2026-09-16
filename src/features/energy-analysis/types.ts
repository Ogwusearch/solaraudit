/**
 * SolarAudit — Energy Analysis feature: Types
 *
 * Feature-local view models. UI binds to these; the service layer
 * parses them into the engine's typed input.
 *
 * IMPORTANT: no engineering formula lives here.
 *
 * NOTE: the engine treats the battery as optional. In the draft we
 * represent that with an explicit boolean flag plus a nested battery
 * sub-draft; the service omits the battery from the engine input when
 * the flag is false.
 */

import type { EnergyResult } from "../../engineering/energy";

export interface PvArrayDraft {
  readonly name: string;
  readonly capacityKwp: string;
  readonly peakSunHours: string;
  readonly performanceRatio: string;
}

export interface BatteryDraft {
  readonly name: string;
  readonly capacityKwh: string;
  readonly depthOfDischarge: string;
  readonly roundTripEfficiency: string;
  readonly initialSoc: string;
}

export interface EnergyAnalysisFormDraft {
  readonly pvArrays: readonly PvArrayDraft[];
  readonly dailyConsumptionKwh: string;
  readonly days: string;

  readonly includeBattery: boolean;
  readonly battery: BatteryDraft;
}

export interface EnergyAnalysisParsedInput {
  readonly pvArrays: ReadonlyArray<{
    readonly name: string;
    readonly capacityKwp: number;
    readonly peakSunHours: number;
    readonly performanceRatio: number;
  }>;
  readonly dailyConsumptionKwh: number;
  readonly days: number;
  readonly battery?: {
    readonly name: string;
    readonly capacityKwh: number;
    readonly depthOfDischarge: number;
    readonly roundTripEfficiency: number;
    readonly initialSoc: number;
  };
}

export interface EnergyAnalysisView {
  readonly result: EnergyResult;
  readonly calculatedAt: string;
}

export interface FormValidationErrors {
  readonly [fieldKey: string]: string | undefined;
}

export type EnergyAnalysisStatus =
  | "idle"
  | "editing"
  | "calculating"
  | "calculated"
  | "error";
