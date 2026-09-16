import { describe, it, expect } from "vitest";
import { calculateSolar } from "../index";

const panel = {
  name: "P",
  ratedPowerWatts: 400,
  vmp: 34,
  imp: 11.8,
  voc: 41,
  isc: 12.5,
};

describe("calculateSolar (public API)", () => {
  it("returns invalid on bad input", () => {
    const r = calculateSolar({
      dailyEnergyKwh: 0,
      peakSunHours: 4.5,
      systemEfficiency: 0.75,
      designMargin: 0.25,
      panel,
    });
    expect(r.isValid).toBe(false);
    expect(r.errors.length).toBeGreaterThan(0);
  });

  it("returns a valid size for a typical off-grid home", () => {
    const r = calculateSolar({
      dailyEnergyKwh: 15,
      peakSunHours: 4.5,
      systemEfficiency: 0.75,
      designMargin: 0.25,
      panel,
    });
    expect(r.isValid).toBe(true);
    expect(r.errors).toEqual([]);
    expect(r.actualArrayKwp).toBeGreaterThanOrEqual(r.designArrayKwp);
    expect(r.totalPanels).toBe(r.seriesPanels * r.parallelStrings);
  });

  it("honours electrical compatibility limits", () => {
    const r = calculateSolar({
      dailyEnergyKwh: 15,
      peakSunHours: 4.5,
      systemEfficiency: 0.75,
      designMargin: 0.25,
      panel,
      maxArrayVoc: 250,
      minArrayVmp: 100,
    });
    expect(r.isValid).toBe(true);
    if (r.arrayVoc > 0) {
      expect(r.arrayVoc).toBeLessThanOrEqual(250);
    }
  });
});
