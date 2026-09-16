/**
 * SolarAudit — Battery Sizing feature: Draft factories
 */

import type { BatterySizingFormDraft, CellSpecDraft } from "../types";

function emptyCell(): CellSpecDraft {
  return {
    name: "",
    technology: "lifepo4",
    nominalVoltage: "12",
    capacityAh: "100",
    maxDepthOfDischarge: "0.9",
    roundTripEfficiency: "0.95",
    maxChargeCurrentA: "",
  };
}

export function createEmptyDraft(): BatterySizingFormDraft {
  return {
    dailyEnergyKwh: "",
    autonomyDays: "1",
    systemVoltage: "48",
    designMargin: "0.1",
    temperatureDerating: "0.85",
    maxDepthOfDischarge: "0.8",
    roundTripEfficiency: "0.9",
    cell: emptyCell(),
    maxParallelStrings: "",
  };
}

export function createSampleDraft(): BatterySizingFormDraft {
  return {
    dailyEnergyKwh: "10",
    autonomyDays: "1",
    systemVoltage: "48",
    designMargin: "0.1",
    temperatureDerating: "0.85",
    maxDepthOfDischarge: "0.8",
    roundTripEfficiency: "0.9",
    cell: {
      name: "LFP 12 V 100 Ah",
      technology: "lifepo4",
      nominalVoltage: "12",
      capacityAh: "100",
      maxDepthOfDischarge: "0.9",
      roundTripEfficiency: "0.95",
      maxChargeCurrentA: "50",
    },
    maxParallelStrings: "",
  };
}
