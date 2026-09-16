import { describe, it, expect } from "vitest";
import { calculateLoad } from "../index";

describe("calculateLoad (public API)", () => {
  it("returns an invalid result on empty input", () => {
    const r = calculateLoad({ appliances: [] });
    expect(r.isValid).toBe(false);
    expect(r.errors.length).toBeGreaterThan(0);
    expect(r.totalDailyEnergyKwh).toBe(0);
  });

  it("returns a valid result for a typical load", () => {
    const r = calculateLoad({
      appliances: [
        { name: "Fridge", powerWatts: 150, hoursPerDay: 24, quantity: 1 },
        { name: "TV",     powerWatts: 100, hoursPerDay: 4,  quantity: 2 },
      ],
      diversityFactor: 0.8,
      safetyMargin: 0.1,
    });
    expect(r.isValid).toBe(true);
    expect(r.errors).toEqual([]);
    expect(r.totalDailyEnergyKwh).toBeGreaterThan(0);
    expect(r.peakLoadKw).toBeGreaterThan(0);
  });

  it("uses defaults when optional fields are omitted", () => {
    const r = calculateLoad({
      appliances: [{ name: "L", powerWatts: 10, hoursPerDay: 10, quantity: 1 }],
    });
    expect(r.isValid).toBe(true);
    expect(r.totalDailyEnergyKwh).toBeCloseTo(0.1, 3);
  });
});
