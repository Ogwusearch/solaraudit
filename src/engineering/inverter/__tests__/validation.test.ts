import { describe, it, expect } from "vitest";
import { validateInput } from "../validation";
import {
  ERROR_INVALID_CONTINUOUS_LOAD,
  ERROR_INVALID_PEAK_LOAD,
  ERROR_INVALID_SURGE_LOAD,
  ERROR_INVALID_POWER_FACTOR,
} from "../errors";

const base = {
  continuousLoadW: 3000,
  peakLoadW: 5000,
  surgeLoadW: 8000,
  systemVoltage: 48,
  outputVoltage: 230,
  outputFrequency: 50,
  powerFactor: 0.8,
  designMargin: 0.25,
  inverterEfficiency: 0.9,
};

describe("validateInput", () => {
  it("accepts a valid input", () => {
    expect(validateInput(base)).toEqual([]);
  });

  it("rejects zero continuous load", () => {
    expect(validateInput({ ...base, continuousLoadW: 0 }))
      .toContain(ERROR_INVALID_CONTINUOUS_LOAD);
  });

  it("rejects peak < continuous", () => {
    expect(validateInput({ ...base, peakLoadW: 1000 }))
      .toContain(ERROR_INVALID_PEAK_LOAD);
  });

  it("rejects surge < peak", () => {
    expect(validateInput({ ...base, surgeLoadW: 1000 }))
      .toContain(ERROR_INVALID_SURGE_LOAD);
  });

  it("rejects bad power factor", () => {
    expect(validateInput({ ...base, powerFactor: 0 }))
      .toContain(ERROR_INVALID_POWER_FACTOR);
  });

  it("collects multiple errors", () => {
    const errs = validateInput({
      ...base,
      continuousLoadW: 0,
      powerFactor: 0,
      inverterEfficiency: 0,
    });
    expect(errs.length).toBeGreaterThanOrEqual(3);
  });
});
