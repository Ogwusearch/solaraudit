import { describe, it, expect } from "vitest";
import { calculateInternal } from "../calculation";
import type { SolarInput } from "../types";

const panel = {
  name: "P",
  ratedPowerWatts: 400,
  vmp: 34,
  imp: 11.8,
  voc: 41,
  isc: 12.5,
};

const baseInput: SolarInput = {
  dailyEnergyKwh: 10,
  peakSunHours: 4.5,
  systemEfficiency: 0.75,
  designMargin: 0.25,
  panel,
};

describe("calculateInternal", () => {
  it("computes required array size", () => {
    // 10 / 0.75 = 13.333 kWh required
    // 13.333 / 4.5 = 2.963 kW required
    const r = calculateInternal(baseInput);
    expect(r.requiredArrayKwp).toBeCloseTo(2.963, 2);
  });

  it("applies design margin", () => {
    const r = calculateInternal(baseInput);
    expect(r.designArrayKwp).toBeCloseTo(r.requiredArrayKwp * 1.25, 2);
  });

  it("selects whole panels that meet or exceed the design target", () => {
    const r = calculateInternal(baseInput);
    // 3.704 kW design / 0.4 kW panel = 9.26 -> 10 panels minimum
    expect(r.totalPanels).toBeGreaterThanOrEqual(10);
    expect(r.actualArrayKwp).toBeGreaterThanOrEqual(r.designArrayKwp);
  });

  it("respects maxSeriesPanels", () => {
    const r = calculateInternal({ ...baseInput, maxSeriesPanels: 4 });
    expect(r.seriesPanels).toBeLessThanOrEqual(4);
  });

  it("respects maxArrayVoc", () => {
    const r = calculateInternal({ ...baseInput, maxArrayVoc: 200 });
    expect(r.arrayVoc).toBeLessThanOrEqual(200);
  });

  it("computes string electrical values correctly", () => {
    const r = calculateInternal({ ...baseInput, maxSeriesPanels: 10 });
    expect(r.arrayVmp).toBeCloseTo(r.seriesPanels * panel.vmp, 2);
    expect(r.arrayVoc).toBeCloseTo(r.seriesPanels * panel.voc, 2);
    expect(r.arrayImp).toBeCloseTo(r.parallelStrings * panel.imp, 2);
    expect(r.arrayIsc).toBeCloseTo(r.parallelStrings * panel.isc, 2);
  });

  it("errors when PSH = 0", () => {
    const r = calculateInternal({ ...baseInput, peakSunHours: 0 });
    expect(r.isValid).toBe(false);
    expect(r.errors.length).toBeGreaterThan(0);
  });
});
