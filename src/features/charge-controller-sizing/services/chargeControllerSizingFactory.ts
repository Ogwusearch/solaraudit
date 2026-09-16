/**
 * SolarAudit — Charge Controller Sizing feature: Draft factories
 */

import type { ChargeControllerSizingFormDraft } from "../types";

export function createEmptyDraft(): ChargeControllerSizingFormDraft {
  return {
    pvArrayKwp: "",
    pvVmp: "",
    pvVoc: "",
    pvImp: "",
    pvIsc: "",
    batteryVoltage: "48",
    batteryCapacityAh: "200",
    technology: "mppt",
    designMargin: "0.25",
    controllerEfficiency: "0.95",
    maxPvInputVoltage: "",
    maxPvInputCurrentA: "",
    maxOutputCurrentA: "",
  };
}

export function createSampleDraft(): ChargeControllerSizingFormDraft {
  return {
    pvArrayKwp: "5",
    pvVmp: "136",
    pvVoc: "164",
    pvImp: "36.8",
    pvIsc: "39",
    batteryVoltage: "48",
    batteryCapacityAh: "200",
    technology: "mppt",
    designMargin: "0.25",
    controllerEfficiency: "0.95",
    maxPvInputVoltage: "200",
    maxPvInputCurrentA: "50",
    maxOutputCurrentA: "150",
  };
}
