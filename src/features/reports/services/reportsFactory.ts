/**
 * SolarAudit — Reports feature: Draft factories
 *
 * The sample snapshot contains plausible numbers for every engine so
 * the sample report renders all sections. These are illustrative only —
 * they are NOT produced by running the engines.
 */

import type {
  AssumptionDraft,
  ProjectSnapshot,
  ReportsFormDraft,
} from "../types";

let counter = 0;
function nextId(): string {
  counter += 1;
  return `a-${Date.now()}-${counter}`;
}

export function createEmptyAssumption(): AssumptionDraft {
  return { id: nextId(), key: "", value: "", source: "" };
}

export function createEmptyDraft(): ReportsFormDraft {
  return {
    projectName: "",
    clientName: "",
    siteAddress: "",
    auditorName: "",
    reportVersion: "1.0",
    calculationVersion: "0.1.0",
    generatedAtIso: new Date().toISOString(),
    currency: "USD",
    assumptions: [createEmptyAssumption()],
  };
}

export function createSampleDraft(): ReportsFormDraft {
  return {
    projectName: "Off-grid home — Lagos",
    clientName: "Mr. A. Adeyemi",
    siteAddress: "12 Bourdillon Rd, Ikoyi, Lagos",
    auditorName: "SolarAudit Team",
    reportVersion: "1.0",
    calculationVersion: "0.1.0",
    generatedAtIso: new Date().toISOString(),
    currency: "USD",
    assumptions: [
      { id: nextId(), key: "Peak sun hours", value: "4.5 h", source: "site survey" },
      { id: nextId(), key: "Design margin (PV)", value: "25%", source: "default" },
      { id: nextId(), key: "Design DoD (battery)", value: "80%", source: "default" },
      { id: nextId(), key: "Ambient temperature", value: "35 °C", source: "site survey" },
    ],
  };
}

/**
 * A plausible snapshot that populates every section of the report.
 * When project state is wired, this factory is replaced by a fetch.
 */
export function createSampleSnapshot(): ProjectSnapshot {
  const now = new Date().toISOString();
  return {
    load: {
      totalConnectedKw: 6,
      peakDemandKw: 5,
      dailyEnergyKwh: 15,
      essentialEnergyKwh: 10,
    },
    energy: {
      pvGenerationKwh: 18,
      selfConsumedKwh: 15,
      gridImportKwh: 0,
      gridExportKwh: 3,
      selfConsumptionRate: 0.83,
      selfSufficiencyRate: 1.0,
    },
    solar: {
      designArrayKwp: 4.4,
      totalPanels: 11,
      seriesPanels: 11,
      parallelStrings: 1,
      arrayVoc: 451,
    },
    battery: {
      bankVoltage: 48,
      bankCapacityAh: 200,
      installedKwh: 9.6,
      totalCells: 8,
      seriesCells: 4,
      parallelStrings: 2,
    },
    inverter: {
      recommendedVa: 5000,
      dcInputCurrentA: 116,
      outputVoltage: 230,
      outputFrequency: 50,
    },
    chargeController: {
      technology: "mppt",
      recommendedCurrentA: 100,
      maxPvInputVoltage: 500,
    },
    cables: [
      { role: "battery-main", selectedAreaMm2: 35, actualDropPercent: 1.4, lengthM: 3 },
      { role: "pv-string-1", selectedAreaMm2: 6, actualDropPercent: 0.8, lengthM: 15 },
    ],
    protections: [
      {
        role: "battery-main",
        technology: "dc-breaker",
        selectedRatingA: 150,
        minimumVoltageRatingV: 58,
      },
    ],
    bom: {
      itemCount: 24,
      totalQuantity: 320,
      categories: ["batteries", "pv-modules", "cables"],
    },
    costing: {
      materialSubtotal: 6000,
      overheadsSubtotal: 1200,
      grandTotal: 8100,
      currency: "USD",
    },
    validation: {
      overallStatus: "valid",
      errorCount: 0,
      warningCount: 0,
      infoCount: 5,
    },
    trace: [
      { engine: "load", version: "0.1.0", producedAtIso: now },
      { engine: "energy", version: "0.1.0", producedAtIso: now },
      { engine: "solar", version: "0.1.0", producedAtIso: now },
      { engine: "battery", version: "0.1.0", producedAtIso: now },
      { engine: "inverter", version: "0.1.0", producedAtIso: now },
    ],
  };
}

export function createEmptySnapshot(): ProjectSnapshot {
  return {};
}

export function appendAssumption(
  current: readonly AssumptionDraft[],
): AssumptionDraft[] {
  return [...current, createEmptyAssumption()];
}
