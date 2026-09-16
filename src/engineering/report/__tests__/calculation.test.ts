import { describe, it, expect } from "vitest";
import { calculateInternal } from "../calculation";
import type { ReportInput } from "../types";

const fullInput: ReportInput = {
  metadata: {
    projectName: "Home 5 kWp",
    clientName: "Mr. A",
    reportVersion: "1.0",
    calculationVersion: "0.1.0",
    generatedAtIso: "2026-09-12",
    currency: "USD",
  },
  assumptions: [
    { key: "Peak Sun Hours", value: "4.5 h", source: "site survey" },
    { key: "Design Margin", value: "25%", source: "default" },
  ],
  trace: [
    { engine: "load", version: "0.1.0", producedAtIso: "2026-09-12" },
    { engine: "solar", version: "0.1.0", producedAtIso: "2026-09-12" },
  ],
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
    { role: "battery-main", technology: "dc-breaker", selectedRatingA: 150, minimumVoltageRatingV: 58 },
  ],
  bom: { itemCount: 24, totalQuantity: 320, categories: ["batteries", "pv-modules"] },
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
};

describe("calculateInternal", () => {
  it("produces a complete report for a full input", () => {
    const r = calculateInternal(fullInput);
    expect(r.overallStatus).toBe("complete");
    expect(r.isValid).toBe(true);
    expect(r.sectionCount).toBeGreaterThan(10);
  });

  it("sections appear in canonical order", () => {
    const r = calculateInternal(fullInput);
    const orders = r.sections.map((s) => s.order);
    const sorted = [...orders].sort((a, b) => a - b);
    expect(orders).toEqual(sorted);
  });

  it("cover section carries metadata", () => {
    const r = calculateInternal(fullInput);
    const cover = r.sections.find((s) => s.key === "cover");
    expect(cover?.status).toBe("complete");
    expect(cover?.body.some((e) => e.label === "Project")).toBe(true);
  });

  it("summary exposes key metrics", () => {
    const r = calculateInternal(fullInput);
    expect(r.summary.dailyEnergyKwh).toBe(15);
    expect(r.summary.arrayKwp).toBe(4.4);
    expect(r.summary.batteryInstalledKwh).toBe(9.6);
    expect(r.summary.inverterVa).toBe(5000);
    expect(r.summary.grandTotal).toBe(8100);
    expect(r.summary.currency).toBe("USD");
  });

  it("marks missing sections", () => {
    const r = calculateInternal({
      metadata: fullInput.metadata,
      load: fullInput.load,
    });
    const solar = r.sections.find((s) => s.key === "solar");
    expect(solar?.status).toBe("missing");
    expect(solar?.body).toEqual([]);
  });

  it("marks report partial when core sections are missing", () => {
    const r = calculateInternal({
      metadata: fullInput.metadata,
      load: fullInput.load,
    });
    expect(r.overallStatus).toBe("partial");
    expect(r.warnings.some((w) => /core section/i.test(w))).toBe(true);
  });

  it("marks report invalid when validation says invalid", () => {
    const r = calculateInternal({
      ...fullInput,
      validation: { ...fullInput.validation!, overallStatus: "invalid" },
    });
    expect(r.overallStatus).toBe("invalid");
    expect(r.warnings.some((w) => /INVALID/i.test(w))).toBe(true);
  });

  it("warns when validation is warning", () => {
    const r = calculateInternal({
      ...fullInput,
      validation: { ...fullInput.validation!, overallStatus: "warning" },
    });
    expect(r.warnings.some((w) => /WARNING/i.test(w))).toBe(true);
  });

  it("warns about missing trace and assumptions", () => {
    const r = calculateInternal({
      metadata: fullInput.metadata,
      load: fullInput.load,
    });
    expect(r.warnings.some((w) => /traceability/i.test(w))).toBe(true);
    expect(r.warnings.some((w) => /assumptions/i.test(w))).toBe(true);
  });

  it("cable section includes per-role entries", () => {
    const r = calculateInternal(fullInput);
    const cable = r.sections.find((s) => s.key === "cable");
    expect(cable?.body.some((e) => String(e.label).includes("battery-main"))).toBe(true);
    expect(cable?.body.some((e) => String(e.label).includes("pv-string-1"))).toBe(true);
  });

  it("traceability section lists each engine", () => {
    const r = calculateInternal(fullInput);
    const trace = r.sections.find((s) => s.key === "traceability");
    expect(trace?.body.length).toBe(2);
    expect(trace?.body.some((e) => e.label === "load")).toBe(true);
  });

  it("title reflects project name", () => {
    const r = calculateInternal(fullInput);
    expect(r.title).toContain("Home 5 kWp");
  });
});
