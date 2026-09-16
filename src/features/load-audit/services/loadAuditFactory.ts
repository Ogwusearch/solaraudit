/**
 * SolarAudit — Load Audit feature: Draft factories
 *
 * Small helpers that produce empty or sample drafts. Kept separate from
 * the calculation service so components can import them without pulling
 * in the engine.
 */

import type { ApplianceRowDraft, LoadAuditFormDraft } from "../types";

let counter = 0;
function nextId(): string {
  counter += 1;
  return `row-${Date.now()}-${counter}`;
}

export function createEmptyRow(): ApplianceRowDraft {
  return {
    id: nextId(),
    name: "",
    powerWatts: "",
    hoursPerDay: "",
    quantity: "1",
    essential: false,
  };
}

export function createEmptyDraft(): LoadAuditFormDraft {
  return {
    appliances: [createEmptyRow()],
    diversityFactor: "0.8",
    safetyMargin: "0.1",
  };
}

export function createSampleDraft(): LoadAuditFormDraft {
  return {
    appliances: [
      { id: nextId(), name: "LED Light", powerWatts: "10", hoursPerDay: "5", quantity: "10", essential: false },
      { id: nextId(), name: "Refrigerator", powerWatts: "150", hoursPerDay: "24", quantity: "1", essential: true },
      { id: nextId(), name: "Television", powerWatts: "100", hoursPerDay: "4", quantity: "2", essential: false },
    ],
    diversityFactor: "0.8",
    safetyMargin: "0.1",
  };
}
