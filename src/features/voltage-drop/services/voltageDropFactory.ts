/**
 * SolarAudit — Voltage Drop feature: Draft factories
 */

import type { VoltageDropFormDraft } from "../types";

export function createEmptyDraft(): VoltageDropFormDraft {
  return {
    currentA: "",
    lengthM: "",
    systemVoltageV: "48",
    material: "copper",
    circuitType: "dc",
    conductorAreaMm2: "",
    targetDropPercent: "3",
    conductorTempC: "",
    powerFactor: "",
    reactanceOhmPerKm: "",
  };
}

export function createSampleDraft(): VoltageDropFormDraft {
  return {
    currentA: "40",
    lengthM: "20",
    systemVoltageV: "48",
    material: "copper",
    circuitType: "dc",
    conductorAreaMm2: "25",
    targetDropPercent: "3",
    conductorTempC: "70",
    powerFactor: "",
    reactanceOhmPerKm: "",
  };
}
