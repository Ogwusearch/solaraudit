import { describe, it, expect } from "vitest";
import { calculateEnergy } from "../index";

describe("calculateEnergy (public API)", () => {
  it("returns an invalid result on empty pvArrays", () => {
    const r = calculateEnergy({
      pvArrays: [],
      dailyConsumptionKwh: 10,
      days: 1,
    });
    expect(r.isValid).toBe(false);
    expect(r.errors.length).toBeGreaterThan(0);
    expect(r.pvGenerationKwh).toBe(0);
  });

  it("returns a valid result for a typical PV system", () => {
    const r = calculateEnergy({
      pvArrays: [
        { name: "Roof", capacityKwp: 6, peakSunHours: 4.5, performanceRatio: 0.8 },
      ],
      dailyConsumptionKwh: 15,
      days: 30,
    });
    expect(r.isValid).toBe(true);
    expect(r.errors).toEqual([]);
    expect(r.pvGenerationKwh).toBeGreaterThan(0);
    expect(r.selfConsumedKwh).toBeLessThanOrEqual(r.pvGenerationKwh);
  });

  it("handles optional battery correctly", () => {
    const r = calculateEnergy({
      pvArrays: [
        { name: "Roof", capacityKwp: 5, peakSunHours: 4.5, performanceRatio: 0.8 },
      ],
      dailyConsumptionKwh: 10,
      days: 1,
      battery: {
        name: "Home",
        capacityKwh: 10,
        depthOfDischarge: 0.9,
        roundTripEfficiency: 0.9,
        initialSoc: 0.5,
      },
    });
    expect(r.isValid).toBe(true);
    expect(r.batteryFinalSoc).toBeGreaterThanOrEqual(0);
    expect(r.batteryFinalSoc).toBeLessThanOrEqual(1);
  });
});
