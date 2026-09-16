import { describe, it, expect } from "vitest";
import { calculateBattery } from "../index";

const cell = {
  name: "LFP-100",
  technology: "lifepo4" as const,
  nominalVoltage: 12,
  capacityAh: 100,
  maxDepthOfDischarge: 0.9,
  roundTripEfficiency: 0.95,
};

describe("calculateBattery (public API)", () => {
  it("returns invalid on bad input", () => {
    const r = calculateBattery({
      dailyEnergyKwh: 0,
      autonomyDays: 1,
      systemVoltage: 48,
      designMargin: 0.1,
      temperatureDerating: 0.85,
      maxDepthOfDischarge: 0.8,
      roundTripEfficiency: 0.9,
      cell,
    });
    expect(r.isValid).toBe(false);
    expect(r.errors.length).toBeGreaterThan(0);
  });

  it("sizes a 48 V, 1-day autonomy bank for a 5 kWh/day home", () => {
    const r = calculateBattery({
      dailyEnergyKwh: 5,
      autonomyDays: 1,
      systemVoltage: 48,
      designMargin: 0.1,
      temperatureDerating: 0.85,
      maxDepthOfDischarge: 0.8,
      roundTripEfficiency: 0.9,
      cell,
    });
    expect(r.isValid).toBe(true);
    expect(r.bankVoltage).toBe(48);
    expect(r.actualInstalledKwh).toBeGreaterThanOrEqual(r.designCapacityKwh);
  });

  it("handles a 3-day autonomy with warning", () => {
    const r = calculateBattery({
      dailyEnergyKwh: 5,
      autonomyDays: 4,
      systemVoltage: 48,
      designMargin: 0.1,
      temperatureDerating: 0.85,
      maxDepthOfDischarge: 0.8,
      roundTripEfficiency: 0.9,
      cell,
    });
    expect(r.isValid).toBe(true);
    expect(r.warnings.some((w) => /autonomy/i.test(w))).toBe(true);
  });
});
