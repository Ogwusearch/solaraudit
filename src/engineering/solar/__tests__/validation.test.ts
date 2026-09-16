import { describe, it, expect } from "vitest";
import { validateInput } from "../validation";
import {
  ERROR_INVALID_DAILY_ENERGY,
  ERROR_INVALID_PSH,
  ERROR_INVALID_EFFICIENCY,
  ERROR_PANEL_RATED_POWER,
} from "../errors";

const panel = {
  name: "P",
  ratedPowerWatts: 400,
  vmp: 34,
  imp: 11.8,
  voc: 41,
  isc: 12.5,
};

const base = {
  dailyEnergyKwh: 10,
  peakSunHours: 4.5,
  systemEfficiency: 0.75,
  designMargin: 0.25,
  panel,
};

describe("validateInput", () => {
  it("accepts a valid input", () => {
    expect(validateInput(base)).toEqual([]);
  });

  it("rejects non-positive daily energy", () => {
    expect(validateInput({ ...base, dailyEnergyKwh: 0 }))
      .toContain(ERROR_INVALID_DAILY_ENERGY);
  });

  it("rejects out-of-range PSH", () => {
    expect(validateInput({ ...base, peakSunHours: 30 }))
      .toContain(ERROR_INVALID_PSH);
  });

  it("rejects bad efficiency", () => {
    expect(validateInput({ ...base, systemEfficiency: 0 }))
      .toContain(ERROR_INVALID_EFFICIENCY);
  });

  it("rejects bad panel rating", () => {
    const bad = { ...panel, ratedPowerWatts: 0 };
    expect(validateInput({ ...base, panel: bad }))
      .toContain(ERROR_PANEL_RATED_POWER);
  });

  it("collects multiple errors", () => {
    const errs = validateInput({
      ...base,
      dailyEnergyKwh: -1,
      peakSunHours: 30,
      systemEfficiency: 2,
    });
    expect(errs.length).toBeGreaterThanOrEqual(3);
  });
});
