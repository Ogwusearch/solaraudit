import { describe, it, expect } from "vitest";
import {
  calculateEnergyAnalysis,
  parseDraft,
  validateDraft,
} from "../services/energyAnalysisService";
import type { EnergyAnalysisFormDraft } from "../types";

const noBatteryDraft: EnergyAnalysisFormDraft = {
  pvArrays: [
    {
      name: "Roof",
      capacityKwp: "5",
      peakSunHours: "4.5",
      performanceRatio: "0.8",
    },
  ],
  dailyConsumptionKwh: "10",
  days: "1",
  includeBattery: false,
  battery: {
    name: "Home",
    capacityKwh: "10",
    depthOfDischarge: "0.9",
    roundTripEfficiency: "0.9",
    initialSoc: "0.5",
  },
};

const withBatteryDraft: EnergyAnalysisFormDraft = {
  ...noBatteryDraft,
  includeBattery: true,
};

describe("parseDraft", () => {
  it("parses numeric fields", () => {
    const p = parseDraft(noBatteryDraft);
    expect(p.pvArrays[0]!.capacityKwp).toBe(5);
    expect(p.pvArrays[0]!.peakSunHours).toBe(4.5);
    expect(p.dailyConsumptionKwh).toBe(10);
    expect(p.days).toBe(1);
  });

  it("omits battery when includeBattery is false", () => {
    const p = parseDraft(noBatteryDraft);
    expect(p.battery).toBeUndefined();
  });

  it("includes parsed battery when includeBattery is true", () => {
    const p = parseDraft(withBatteryDraft);
    expect(p.battery).toBeDefined();
    expect(p.battery!.capacityKwh).toBe(10);
    expect(p.battery!.depthOfDischarge).toBe(0.9);
  });

  it("trims array names", () => {
    const draft: EnergyAnalysisFormDraft = {
      ...noBatteryDraft,
      pvArrays: [{ ...noBatteryDraft.pvArrays[0]!, name: "  Roof  " }],
    };
    const p = parseDraft(draft);
    expect(p.pvArrays[0]!.name).toBe("Roof");
  });
});

describe("validateDraft (form-level)", () => {
  it("accepts a well-formed draft", () => {
    expect(validateDraft(noBatteryDraft)).toEqual({});
  });

  it("flags empty pvArrays", () => {
    const errs = validateDraft({ ...noBatteryDraft, pvArrays: [] });
    expect(errs["pvArrays"]).toBeDefined();
  });

  it("flags missing array name", () => {
    const errs = validateDraft({
      ...noBatteryDraft,
      pvArrays: [{ ...noBatteryDraft.pvArrays[0]!, name: "" }],
    });
    expect(errs["pvArrays.0.name"]).toBeDefined();
  });

  it("flags non-positive capacity", () => {
    const errs = validateDraft({
      ...noBatteryDraft,
      pvArrays: [{ ...noBatteryDraft.pvArrays[0]!, capacityKwp: "0" }],
    });
    expect(errs["pvArrays.0.capacityKwp"]).toBeDefined();
  });

  it("flags performance ratio out of range", () => {
    const errs = validateDraft({
      ...noBatteryDraft,
      pvArrays: [{ ...noBatteryDraft.pvArrays[0]!, performanceRatio: "1.5" }],
    });
    expect(errs["pvArrays.0.performanceRatio"]).toBeDefined();
  });

  it("flags non-integer days", () => {
    expect(validateDraft({ ...noBatteryDraft, days: "1.5" })["days"])
      .toBeDefined();
  });

  it("ignores battery errors when includeBattery is false", () => {
    const errs = validateDraft({
      ...noBatteryDraft,
      battery: { ...noBatteryDraft.battery, capacityKwh: "0" },
    });
    expect(errs["battery.capacityKwh"]).toBeUndefined();
  });

  it("flags battery errors when includeBattery is true", () => {
    const errs = validateDraft({
      ...withBatteryDraft,
      battery: { ...withBatteryDraft.battery, capacityKwh: "0" },
    });
    expect(errs["battery.capacityKwh"]).toBeDefined();
  });

  it("flags invalid initial SoC", () => {
    const errs = validateDraft({
      ...withBatteryDraft,
      battery: { ...withBatteryDraft.battery, initialSoc: "1.5" },
    });
    expect(errs["battery.initialSoc"]).toBeDefined();
  });
});

describe("calculateEnergyAnalysis (service → engine)", () => {
  it("returns a valid engine result with a single PV array, no battery", () => {
    const r = calculateEnergyAnalysis(noBatteryDraft);
    expect(r.isValid).toBe(true);
    // 5 × 4.5 × 0.8 = 18 kWh
    expect(r.pvGenerationKwh).toBeCloseTo(18, 2);
    expect(r.consumptionKwh).toBe(10);
    expect(r.selfConsumedKwh).toBe(10);
  });

  it("includes battery contribution when enabled", () => {
    const r = calculateEnergyAnalysis(withBatteryDraft);
    expect(r.isValid).toBe(true);
    expect(r.batteryChargeKwh).toBeGreaterThanOrEqual(0);
    expect(r.batteryFinalSoc).toBeGreaterThanOrEqual(0);
  });

  it("scales to multi-day horizons", () => {
    const r7 = calculateEnergyAnalysis({ ...noBatteryDraft, days: "7" });
    expect(r7.pvGenerationKwh).toBeCloseTo(18 * 7, 1);
  });

  it("passes engine errors through unchanged", () => {
    const bad: EnergyAnalysisFormDraft = {
      ...noBatteryDraft,
      pvArrays: [{ ...noBatteryDraft.pvArrays[0]!, capacityKwp: "0" }],
    };
    const r = calculateEnergyAnalysis(bad);
    expect(r.isValid).toBe(false);
    expect(r.errors.length).toBeGreaterThan(0);
  });
});
