/**
 * SolarAudit — Cable Sizing feature: Draft factories
 */

import type { CableSizingFormDraft } from "../types";

export function createEmptyDraft(): CableSizingFormDraft {
  return {
    currentA: "",
    lengthM: "",
    systemVoltage: "48",
    allowableDropPercent: "3",
    material: "copper",
    circuitType: "dc",
    installationMethod: "conduit",
    ambientTemperatureC: "",
    conductorTempC: "",
    groupingCount: "",
    designMargin: "",
  };
}

export function createSampleDraft(): CableSizingFormDraft {
  return {
    currentA: "40",
    lengthM: "20",
    systemVoltage: "48",
    allowableDropPercent: "3",
    material: "copper",
    circuitType: "dc",
    installationMethod: "conduit",
    ambientTemperatureC: "30",
    conductorTempC: "70",
    groupingCount: "1",
    designMargin: "",
  };
}
