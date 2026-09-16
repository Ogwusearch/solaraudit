import { describe, it, expect } from "vitest";
import { calculateInternal } from "../calculation";
import type { ValidationInput } from "../types";

const goodSystem: ValidationInput = {
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
    cables: [
      {
        role: "battery",
        currentA: 116,
        deratedAmpacityA: 130,
        actualDropPercent: 1.5,
        targetDropPercent: 2,
      },
    ],
    protections: [
      {
        role: "battery",
        selectedRatingA: 150,
        designCurrentA: 145,
        selectedVoltageRatingV: 125,
        minimumVoltageRatingV: 57.6,
        selectedInterruptRatingKa: 10,
        availableFaultCurrentKa: 6,
      },
    ],
  },
};

describe("calculateInternal — happy path", () => {
  it("returns overallStatus 'valid' for a coherent system", () => {
    const r = calculateInternal(goodSystem);
    expect(r.overallStatus).toBe("valid");
    expect(r.errorCount).toBe(0);
  });

  it("all rules have a code and message", () => {
    const r = calculateInternal(goodSystem);
    for (const rule of r.allRules) {
      expect(rule.code).toBeTruthy();
      expect(rule.message).toBeTruthy();
      expect(typeof rule.passed).toBe("boolean");
    }
  });

  it("includes VOLTAGE_BATTERY_INVERTER_MATCH rule", () => {
    const r = calculateInternal(goodSystem);
    const rule = r.allRules.find((x) => x.code === "VOLTAGE_BATTERY_INVERTER_MATCH");
    expect(rule?.passed).toBe(true);
  });
});

describe("calculateInternal — mismatch detection", () => {
  it("flags battery/inverter voltage mismatch", () => {
    const r = calculateInternal({
      config: {
        ...goodSystem.config,
        inverter: { ...goodSystem.config.inverter!, systemVoltage: 24 },
      },
    });
    const rule = r.allRules.find((x) => x.code === "VOLTAGE_BATTERY_INVERTER_MATCH");
    expect(rule?.passed).toBe(false);
    expect(r.overallStatus).toBe("invalid");
  });

  it("flags PV Voc above controller max", () => {
    const r = calculateInternal({
      config: {
        ...goodSystem.config,
        pv: { ...goodSystem.config.pv!, arrayVoc: 500 },
      },
    });
    const rule = r.allRules.find((x) => x.code === "PV_VOC_WITHIN_CONTROLLER");
    expect(rule?.passed).toBe(false);
  });

  it("flags controller output above battery charge limit", () => {
    const r = calculateInternal({
      config: {
        ...goodSystem.config,
        battery: { ...goodSystem.config.battery!, maxChargeCurrentA: 50 },
      },
    });
    const rule = r.allRules.find(
      (x) => x.code === "CONTROLLER_OUTPUT_WITHIN_BATTERY_CHARGE_LIMIT",
    );
    expect(rule?.passed).toBe(false);
  });

  it("flags PV energy deficit as error", () => {
    const r = calculateInternal({
      config: {
        ...goodSystem.config,
        pv: { ...goodSystem.config.pv!, dailyGenerationKwh: 5 },
      },
    });
    const rule = r.allRules.find(
      (x) => x.code === "PV_ENERGY_MEETS_DAILY_REQUIREMENT",
    );
    expect(rule?.passed).toBe(false);
  });

  it("flags inverter surge exceeding battery discharge", () => {
    const r = calculateInternal({
      config: {
        ...goodSystem.config,
        battery: { ...goodSystem.config.battery!, maxDischargeCurrentA: 50 },
      },
    });
    const rule = r.allRules.find(
      (x) => x.code === "INVERTER_PEAK_WITHIN_BATTERY_DISCHARGE",
    );
    expect(rule?.passed).toBe(false);
  });

  it("flags cable ampacity failure", () => {
    const r = calculateInternal({
      config: {
        ...goodSystem.config,
        cables: [
          {
            role: "battery",
            currentA: 150,
            deratedAmpacityA: 100,
            actualDropPercent: 1,
            targetDropPercent: 2,
          },
        ],
      },
    });
    const rule = r.allRules.find((x) => x.code === "CABLE_AMPACITY_SUFFICIENT");
    expect(rule?.passed).toBe(false);
  });

  it("flags protection current shortfall", () => {
    const r = calculateInternal({
      config: {
        ...goodSystem.config,
        protections: [
          {
            role: "battery",
            selectedRatingA: 100,
            designCurrentA: 145,
            minimumVoltageRatingV: 57.6,
          },
        ],
      },
    });
    const rule = r.allRules.find(
      (x) => x.code === "PROTECTION_CURRENT_SUFFICIENT",
    );
    expect(rule?.passed).toBe(false);
  });
});

describe("calculateInternal — warnings and info", () => {
  it("issues warnings when components are missing", () => {
    const r = calculateInternal({
      config: { dailyEnergyRequirementKwh: 10 },
    });
    expect(r.warnings.length).toBeGreaterThan(0);
    expect(r.infoRules.length).toBeGreaterThan(0);
    expect(r.overallStatus).toBe("valid"); // no errors, only info
  });

  it("warns when PV is oversized relative to need", () => {
    const r = calculateInternal({
      config: {
        ...goodSystem.config,
        pv: { ...goodSystem.config.pv!, dailyGenerationKwh: 30 },
      },
    });
    const rule = r.allRules.find(
      (x) => x.code === "PV_ENERGY_MEETS_DAILY_REQUIREMENT",
    );
    expect(rule?.severity).toBe("warning");
    expect(r.overallStatus).toBe("warning");
  });

  it("respects skipRules", () => {
    const r = calculateInternal({
      ...goodSystem,
      skipRules: ["VOLTAGE_BATTERY_INVERTER_MATCH"],
    });
    const rule = r.allRules.find((x) => x.code === "VOLTAGE_BATTERY_INVERTER_MATCH");
    expect(rule).toBeUndefined();
  });
});
