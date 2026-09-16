/**
 * SolarAudit — Solar Sizing feature: Types
 *
 * Feature-local view models. The UI binds to these; the service layer
 * parses them into the engine's typed input.
 *
 * IMPORTANT: no engineering formula lives here. These are pure shapes.
 */

import type { PanelSpec, SolarResult } from "../../engineering/solar";

/**
 * A single panel specification, as the user edits it.
 * All numeric fields are strings so they bind naturally to inputs.
 */
export interface PanelSpecDraft {
  readonly name: string;
  readonly ratedPowerWatts: string;
  readonly vmp: string;
  readonly imp: string;
  readonly voc: string;
  readonly isc: string;
}

export interface SolarSizingFormDraft {
  readonly dailyEnergyKwh: string;
  readonly peakSunHours: string;
  readonly systemEfficiency: string;
  readonly designMargin: string;
  readonly panel: PanelSpecDraft;

  readonly maxSeriesPanels: string;       // optional, empty = unset
  readonly maxParallelStrings: string;    // optional, empty = unset
  readonly maxArrayVoc: string;           // optional, empty = unset
  readonly minArrayVmp: string;           // optional, empty = unset
}

export interface SolarSizingParsedInput {
  readonly dailyEnergyKwh: number;
  readonly peakSunHours: number;
  readonly systemEfficiency: number;
  readonly designMargin: number;
  readonly panel: PanelSpec;
  readonly maxSeriesPanels?: number;
  readonly maxParallelStrings?: number;
  readonly maxArrayVoc?: number;
  readonly minArrayVmp?: number;
}

export interface SolarSizingView {
  readonly result: SolarResult;
  readonly calculatedAt: string;
}

export interface FormValidationErrors {
  readonly [fieldKey: string]: string | undefined;
}

export type SolarSizingStatus =
  | "idle"
  | "editing"
  | "calculating"
  | "calculated"
  | "error";
