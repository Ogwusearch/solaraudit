import { describe, it, expect } from "vitest";
import { calculateInternal } from "../calculation";

const baseInput = {
  appliances: [
    { name: "LED", powerWatts: 10, hoursPerDay: 5, quantity: 10 },   // 0.5 kWh
    { name: "TV",  powerWatts: 100, hoursPerDay: 4, quantity: 2 },   // 0.8 kWh
  ],
};

describe("calculateInternal", () => {
  it("computes daily energy", () => {
    const r = calculateInternal(baseInput, 1, 0);
    expect(r.totalDailyEnergyKwh).toBeCloseTo(1.3, 3);
  });

  it("applies diversity factor to peak", () => {
    const full = calculateInternal(baseInput, 1, 0);
    const half = calculateInternal(baseInput, 0.5, 0);
    expect(half.peakLoadKw).toBeCloseTo(full.peakLoadKw / 2, 3);
  });

  it("applies safety margin to both energy and peak", () => {
    const r0 = calculateInternal(baseInput, 1, 0);
    const r1 = calculateInternal(baseInput, 1, 0.1);
    expect(r1.totalDailyEnergyKwh).toBeCloseTo(r0.totalDailyEnergyKwh * 1.1, 3);
    expect(r1.peakLoadKw).toBeCloseTo(r0.peakLoadKw * 1.1, 3);
  });

  it("load factor is within [0,1]", () => {
    const r = calculateInternal(baseInput, 1, 0);
    expect(r.loadFactor).toBeGreaterThanOrEqual(0);
    expect(r.loadFactor).toBeLessThanOrEqual(1);
  });

  it("warns when peak load is zero", () => {
    const r = calculateInternal(
      { appliances: [{ name: "X", powerWatts: 0, hoursPerDay: 0, quantity: 1 }] },
      1,
      0,
    );
    expect(r.warnings.length).toBeGreaterThan(0);
  });
});
