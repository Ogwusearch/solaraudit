/**
 * SolarAudit — Energy Analysis feature: Draft factories
 */

import type {
  BatteryDraft,
  EnergyAnalysisFormDraft,
  PvArrayDraft,
} from "../types";

let counter = 0;
function nextId(): string {
  counter += 1;
  return `pv-${Date.now()}-${counter}`;
}

export function createEmptyPvArray(): PvArrayDraft {
  return {
    name: "",
    capacityKwp: "",
    peakSunHours: "4.5",
    performanceRatio: "0.8",
  };
}

function emptyBattery(): BatteryDraft {
  return {
    name: "Home battery",
    capacityKwh: "",
    depthOfDischarge: "0.9",
    roundTripEfficiency: "0.9",
    initialSoc: "0.5",
  };
}

export function createEmptyDraft(): EnergyAnalysisFormDraft {
  return {
    pvArrays: [createEmptyPvArray()],
    dailyConsumptionKwh: "",
    days: "1",
    includeBattery: false,
    battery: emptyBattery(),
  };
}

export function createSampleDraft(): EnergyAnalysisFormDraft {
  return {
    pvArrays: [
      {
        name: "Roof array",
        capacityKwp: "5",
        peakSunHours: "4.5",
        performanceRatio: "0.8",
      },
    ],
    dailyConsumptionKwh: "10",
    days: "1",
    includeBattery: true,
    battery: {
      name: "LFP bank",
      capacityKwh: "10",
      depthOfDischarge: "0.9",
      roundTripEfficiency: "0.9",
      initialSoc: "0.5",
    },
  };
}

/**
 * Add a row to the PV array list. Kept separate from the factory above
 * so components do not touch ID generation.
 */
export function appendPvArray(
  current: readonly PvArrayDraft[],
): PvArrayDraft[] {
  return [...current, { ...createEmptyPvArray(), name: `PV array ${current.length + 1}` }];
}

export const __internal__ = { nextId };
