import { describe, it, expect } from "vitest";
import { validateInput } from "../validation";
import {
  ERROR_INVALID_DAILY_ENERGY,
  ERROR_INVALID_AUTONOMY,
  ERROR_VOLTAGE_MISMATCH,
  ERROR_DOD_EXCEEDS_CELL,
  ERROR_INVALID_MAX_PARALLEL,
} from "../errors";

const cell = {
  name: "LFP-100",
  technology: "lifepo4" as const,
  nominalVoltage: 12,
  capacityAh: 100,
  maxDepthOfDischarge: 0.9,
  roundTripEfficiency: 0.95,
};

const base = {
  dailyEnergyKwh: 5,
  autonomyDays: 1,
  systemVoltage: 48,
  designMargin: 0.1,
  temperatureDerating: 0.85,
  maxDepthOfDischarge: 0.8,
  roundTripEfficiency: 0.9,
  cell,
};

describe("validateInput", () => {
  it("accepts a valid input", () => {
    expect(validateInput(base)).toEqual([]);
  });

  it("rejects non-positive daily energy", () => {
    expect(validateInput({ ...base, dailyEnergyKwh: 0 }))
      .toContain(ERROR_INVALID_DAILY_ENERGY);
  });

  it("rejects negative autonomy", () => {
    expect(validateInput({ ...base, autonomyDays: -1 }))
      .toContain(ERROR_INVALID_AUTONOMY);
  });

  it("rejects non-multiple system voltage", () => {
    const errs = validateInput({ ...base, systemVoltage: 50 });
    expect(errs).toContain(ERROR_VOLTAGE_MISMATCH);
  });

  it("rejects DoD above cell max", () => {
    const errs = validateInput({ ...base, maxDepthOfDischarge: 0.95 });
    expect(errs).toContain(ERROR_DOD_EXCEEDS_CELL);
  });

  it("rejects bad maxParallelStrings", () => {
    const errs = validateInput({ ...base, maxParallelStrings: 0 });
    expect(errs).toContain(ERROR_INVALID_MAX_PARALLEL);
  });
});
