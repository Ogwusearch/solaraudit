import { describe, it, expect } from "vitest";
import { calculateInternal } from "../calculation";
import type { EnergyInput } from "../types";

const baseInput: EnergyInput = {
  pvArrays: [
    { name: "Roof", capacityKwp: 5, peakSunHours: 4.5, performanceRatio: 0.8 },
  ],
  dailyConsumptionKwh: 10,
  days: 1,
};

describe("calculateInternal", () => {
  it("computes daily PV generation", () => {
    // 5 * 4.5 * 0.8 = 18 kWh
    const r = calculateInternal(baseInput);
    expect(r.pvGenerationKwh).toBeCloseTo(18, 3);
  });

  it("computes self-consumption and grid flows", () => {
    const r = calculateInternal(baseInput);
    expect(r.consumptionKwh).toBe(10);
    expect(r.selfConsumedKwh).toBe(10);  // generation > consumption
    expect(r.gridExportKwh).toBeCloseTo(8, 3);
    expect(r.gridImportKwh).toBe(0);
  });

  it("imports from grid when generation < consumption", () => {
    const r = calculateInternal({
      ...baseInput,
      pvArrays: [
        { name: "Small", capacityKwp: 1, peakSunHours: 3, performanceRatio: 0.8 },
      ],
    });
    expect(r.pvGenerationKwh).toBeCloseTo(2.4, 3);
    expect(r.gridImportKwh).toBeCloseTo(7.6, 3);
    expect(r.gridExportKwh).toBe(0);
  });

  it("charges the battery from surplus", () => {
    const r = calculateInternal({
      ...baseInput,
      battery: {
        name: "B",
        capacityKwh: 10,
        depthOfDischarge: 0.9,
        roundTripEfficiency: 1.0, // ignore losses for clean assertion
        initialSoc: 0.5,
      },
    });
    expect(r.batteryChargeKwh).toBeGreaterThan(0);
    expect(r.batteryFinalSoc).toBeGreaterThan(0.5);
    expect(r.gridExportKwh).toBeLessThan(8);
  });

  it("scales to multi-day horizons", () => {
    const r1 = calculateInternal({ ...baseInput, days: 1 });
    const r7 = calculateInternal({ ...baseInput, days: 7 });
    expect(r7.pvGenerationKwh).toBeCloseTo(r1.pvGenerationKwh * 7, 2);
    expect(r7.consumptionKwh).toBeCloseTo(r1.consumptionKwh * 7, 2);
  });

  it("self-consumption rate is within [0,1]", () => {
    const r = calculateInternal(baseInput);
    expect(r.selfConsumptionRate).toBeGreaterThanOrEqual(0);
    expect(r.selfConsumptionRate).toBeLessThanOrEqual(1);
  });
});
