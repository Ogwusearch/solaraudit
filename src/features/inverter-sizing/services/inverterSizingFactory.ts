/**
 * SolarAudit — Inverter Sizing feature: Draft factories
 */

import type { InverterSizingFormDraft } from "../types";

export function createEmptyDraft(): InverterSizingFormDraft {
  return {
    continuousLoadW: "",
    peakLoadW: "",
    surgeLoadW: "",
    systemVoltage: "48",
    outputVoltage: "230",
    outputFrequency: "50",
    powerFactor: "0.8",
    designMargin: "0.25",
    inverterEfficiency: "0.9",
    surgeDurationSec: "",
    type: "pure-sine",
    topology: "off-grid",
    maxDcInputCurrentA: "",
  };
}

export function createSampleDraft(): InverterSizingFormDraft {
  return {
    continuousLoadW: "3000",
    peakLoadW: "5000",
    surgeLoadW: "8000",
    systemVoltage: "48",
    outputVoltage: "230",
    outputFrequency: "50",
    powerFactor: "0.8",
    designMargin: "0.25",
    inverterEfficiency: "0.9",
    surgeDurationSec: "5",
    type: "pure-sine",
    topology: "hybrid",
    maxDcInputCurrentA: "200",
  };
}
