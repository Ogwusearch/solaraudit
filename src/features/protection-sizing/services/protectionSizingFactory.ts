/**
 * SolarAudit — Protection Sizing feature: Draft factories
 */

import type { ProtectionSizingFormDraft } from "../types";

export function createEmptyDraft(): ProtectionSizingFormDraft {
  return {
    role: "battery",
    voltageType: "dc",
    technology: "fuse",
    continuousCurrentA: "",
    systemVoltageV: "48",
    safetyFactor: "",
    availableFaultCurrentKa: "",
    deviceVoltageRatingV: "",
    deviceInterruptRatingKa: "",
    deviceCurrentRatingA: "",
  };
}

export function createSampleDraft(): ProtectionSizingFormDraft {
  return {
    role: "battery",
    voltageType: "dc",
    technology: "dc-breaker",
    continuousCurrentA: "100",
    systemVoltageV: "48",
    safetyFactor: "",
    availableFaultCurrentKa: "6",
    deviceVoltageRatingV: "125",
    deviceInterruptRatingKa: "10",
    deviceCurrentRatingA: "150",
  };
}
