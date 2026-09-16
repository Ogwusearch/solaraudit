/**
 * SolarAudit — Solar Sizing feature: Draft factories
 */

import type { PanelSpecDraft, SolarSizingFormDraft } from "../types";

function emptyPanel(): PanelSpecDraft {
  return {
    name: "",
    ratedPowerWatts: "",
    vmp: "",
    imp: "",
    voc: "",
    isc: "",
  };
}

export function createEmptyDraft(): SolarSizingFormDraft {
  return {
    dailyEnergyKwh: "",
    peakSunHours: "4.5",
    systemEfficiency: "0.75",
    designMargin: "0.25",
    panel: emptyPanel(),
    maxSeriesPanels: "",
    maxParallelStrings: "",
    maxArrayVoc: "",
    minArrayVmp: "",
  };
}

export function createSampleDraft(): SolarSizingFormDraft {
  return {
    dailyEnergyKwh: "15",
    peakSunHours: "4.5",
    systemEfficiency: "0.75",
    designMargin: "0.25",
    panel: {
      name: "400 W mono",
      ratedPowerWatts: "400",
      vmp: "34",
      imp: "11.8",
      voc: "41",
      isc: "12.5",
    },
    maxSeriesPanels: "20",
    maxParallelStrings: "4",
    maxArrayVoc: "500",
    minArrayVmp: "120",
  };
}
