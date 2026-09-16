import { describe, it, expect } from "vitest";
import { validateSystem } from "../index";

describe("validateSystem (public API)", () => {
  it("returns isValid:false on structural error", () => {
    const r = validateSystem({
      config: { dailyEnergyRequirementKwh: -1 },
    });
    expect(r.isValid).toBe(false);
    expect(r.errors.length).toBeGreaterThan(0);
    expect(r.overallStatus).toBe("invalid");
  });

  it("returns valid system for a coherent configuration", () => {
    const r = validateSystem({
      config: {
        dailyEnergyRequirementKwh: 10,
        pv: {
          arrayKwp: 4,
          arrayVoc: 400,
          arrayIsc: 11,
          arrayImp: 10,
          dailyGenerationKwh: 14,
        },
        battery: {
          bankVoltage: 48,
          bankCapacityAh: 100,
          installedKwh: 4.8,
          maxChargeCurrentA: 100,
          maxDischargeCurrentA: 120,
        },
        inverter: {
          systemVoltage: 48,
          recommendedVa: 5000,
          continuousLoadW: 3000,
          peakLoadW: 5000,
          surgeLoadW: 8000,
          dcInputCurrentA: 116,
          dcSurgeCurrentA: 120,
        },
        chargeController: {
          technology: "mppt",
          batteryVoltage: 48,
          recommendedCurrentA: 100,
          maxPvInputVoltage: 450,
          maxPvInputCurrentA: 30,
          maxOutputCurrentA: 150,
        },
      },
    });
    expect(r.isValid).toBe(true);
    expect(r.errors).toEqual([]);
    expect(r.overallStatus).toBe("valid");
  });

  it("returns invalid system for mismatched voltages", () => {
    const r = validateSystem({
      config: {
        dailyEnergyRequirementKwh: 10,
        battery: {
          bankVoltage: 48,
          bankCapacityAh: 100,
          installedKwh: 4.8,
          maxChargeCurrentA: 100,
          maxDischargeCurrentA: 120,
        },
        inverter: {
          systemVoltage: 24,   // mismatch
          recommendedVa: 5000,
          continuousLoadW: 3000,
          peakLoadW: 5000,
          surgeLoadW: 8000,
          dcInputCurrentA: 116,
          dcSurgeCurrentA: 120,
        },
      },
    });
    expect(r.isValid).toBe(true);
    expect(r.overallStatus).toBe("invalid");
    expect(r.errorCount).toBeGreaterThan(0);
  });

  it("produces a category-diversified rule report", () => {
    const r = validateSystem({
      config: { dailyEnergyRequirementKwh: 10 },
    });
    expect(r.infoRules.length).toBeGreaterThan(0);
    expect(r.errorCount + r.warningCount + r.infoCount + r.passedRules.length)
      .toBeGreaterThanOrEqual(r.allRules.length - r.infoRules.length);
  });
});
