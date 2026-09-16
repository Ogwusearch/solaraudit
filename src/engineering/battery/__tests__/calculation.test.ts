import { describe, it, expect } from "vitest";
import { calculateInternal } from "../calculation";
import type { BatteryInput } from "../types";

const cell = {
  name: "LFP-100",
  technology: "lifepo4" as const,
  nominalVoltage: 12,
  capacityAh: 100,
  maxDepthOfDischarge: 0.9,
  roundTripEfficiency: 0.95,
  maxChargeCurrentA: 50,
};

const baseInput: BatteryInput = {
  dailyEnergyKwh: 5,
  autonomyDays: 1,
  systemVoltage: 48,
  designMargin: 0.1,
  temperatureDerating: 0.85,
  maxDepthOfDischarge: 0.8,
  roundTripEfficiency: 0.9,
  cell,
};

describe("calculateInternal", () => {
  it("computes required capacity with derating", () => {
    // usable = 5 kWh
    // factor = 0.8 × 0.9 × 0.85 = 0.612
    // required = 5 / 0.612 = 8.170 kWh
    const r = calculateInternal(baseInput);
    expect(r.requiredCapacityKwh).toBeCloseTo(8.17, 1);
  });

  it("applies design margin", () => {
    const r = calculateInternal(baseInput);
    expect(r.designCapacityKwh).toBeCloseTo(r.requiredCapacityKwh * 1.1, 1);
  });

  it("computes correct series cells for system voltage", () => {
    const r = calculateInternal(baseInput);
    expect(r.seriesCells).toBe(4);      // 48 / 12
    expect(r.bankVoltage).toBe(48);
  });

  it("picks enough parallel strings to meet design capacity", () => {
    const r = calculateInternal(baseInput);
    expect(r.actualInstalledKwh).toBeGreaterThanOrEqual(r.designCapacityKwh);
    expect(r.totalCells).toBe(r.seriesCells * r.parallelStrings);
  });

  it("reports usable energy after DoD", () => {
    const r = calculateInternal(baseInput);
    expect(r.actualUsableKwh).toBeCloseTo(
      r.actualInstalledKwh * baseInput.maxDepthOfDischarge,
      1,
    );
  });

  it("respects maxParallelStrings", () => {
    const r = calculateInternal({ ...baseInput, maxParallelStrings: 1 });
    expect(r.parallelStrings).toBe(1);
    expect(r.warnings.length).toBeGreaterThan(0);
  });

  it("computes bank charge current", () => {
    const r = calculateInternal(baseInput);
    expect(r.maxChargeCurrentA).toBeCloseTo(50 * r.parallelStrings, 1);
  });

  it("scales with autonomy days", () => {
    const r1 = calculateInternal({ ...baseInput, autonomyDays: 1 });
    const r2 = calculateInternal({ ...baseInput, autonomyDays: 2 });
    expect(r2.requiredCapacityKwh).toBeCloseTo(r1.requiredCapacityKwh * 2, 1);
  });
});
