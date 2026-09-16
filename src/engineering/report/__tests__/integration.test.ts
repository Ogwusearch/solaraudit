import { describe, it, expect } from "vitest";
import { generateReport } from "../index";

describe("generateReport (public API)", () => {
  it("returns invalid on structural error", () => {
    const r = generateReport({
      metadata: {
        projectName: "",
        reportVersion: "1.0",
        calculationVersion: "0.1.0",
        generatedAtIso: "bad",
      },
    });
    expect(r.isValid).toBe(false);
    expect(r.overallStatus).toBe("invalid");
    expect(r.errors.length).toBeGreaterThan(0);
    expect(r.sections).toEqual([]);
  });

  it("generates a minimal report with just metadata", () => {
    const r = generateReport({
      metadata: {
        projectName: "Minimal",
        reportVersion: "1.0",
        calculationVersion: "0.1.0",
        generatedAtIso: "2026-09-12T00:00:00Z",
      },
    });
    expect(r.isValid).toBe(true);
    expect(r.sectionCount).toBeGreaterThan(0);
    expect(r.overallStatus).toBe("partial");
    expect(r.sections.find((s) => s.key === "cover")?.status).toBe("complete");
    expect(r.sections.find((s) => s.key === "load")?.status).toBe("missing");
  });

  it("generates a complete report when all upstream data is present", () => {
    const r = generateReport({
      metadata: {
        projectName: "Full site",
        reportVersion: "1.0",
        calculationVersion: "0.1.0",
        generatedAtIso: "2026-09-12",
        currency: "NGN",
      },
      assumptions: [{ key: "PSH", value: "4.5 h", source: "site survey" }],
      trace: [{ engine: "load", version: "0.1.0", producedAtIso: "2026-09-12" }],
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
      ],
      protections: [
        { role: "battery-main", technology: "dc-breaker", selectedRatingA: 150, minimumVoltageRatingV: 58 },
      ],
      bom: { itemCount: 24, totalQuantity: 320, categories: ["batteries", "pv-modules"] },
      costing: {
        materialSubtotal: 6000,
        overheadsSubtotal: 1200,
        grandTotal: 8100,
        currency: "NGN",
      },
      validation: {
        overallStatus: "valid",
        errorCount: 0,
        warningCount: 0,
        infoCount: 5,
      },
    });
    expect(r.isValid).toBe(true);
    expect(r.overallStatus).toBe("complete");
    expect(r.errors).toEqual([]);
    expect(r.summary.grandTotal).toBe(8100);
  });

  it("carries invalid validation status through to the report", () => {
    const r = generateReport({
      metadata: {
        projectName: "Bad design",
        reportVersion: "1.0",
        calculationVersion: "0.1.0",
        generatedAtIso: "2026-09-12",
      },
      load: { totalConnectedKw: 1, peakDemandKw: 1, dailyEnergyKwh: 1, essentialEnergyKwh: 1 },
      energy: { pvGenerationKwh: 1, selfConsumedKwh: 1, gridImportKwh: 0, gridExportKwh: 0, selfConsumptionRate: 1, selfSufficiencyRate: 1 },
      solar: { designArrayKwp: 1, totalPanels: 1, seriesPanels: 1, parallelStrings: 1, arrayVoc: 30 },
      battery: { bankVoltage: 12, bankCapacityAh: 100, installedKwh: 1.2, totalCells: 1, seriesCells: 1, parallelStrings: 1 },
      inverter: { recommendedVa: 500, dcInputCurrentA: 10, outputVoltage: 230, outputFrequency: 50 },
      validation: { overallStatus: "invalid", errorCount: 2, warningCount: 0, infoCount: 0 },
    });
    expect(r.overallStatus).toBe("invalid");
    expect(r.warnings.some((w) => /INVALID/i.test(w))).toBe(true);
  });
});
