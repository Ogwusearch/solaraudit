import { describe, it, expect } from "vitest";
import { calculateInverter } from "../index";

describe("calculateInverter (public API)", () => {
  it("returns invalid on bad input", () => {
    const r = calculateInverter({
      continuousLoadW: 0,
      peakLoadW: 5000,
      surgeLoadW: 8000,
      systemVoltage: 48,
      outputVoltage: 230,
      outputFrequency: 50,
      powerFactor: 0.8,
      designMargin: 0.25,
      inverterEfficiency: 0.9,
    });
    expect(r.isValid).toBe(false);
    expect(r.errors.length).toBeGreaterThan(0);
  });

  it("sizes an inverter for a typical home", () => {
    const r = calculateInverter({
      continuousLoadW: 3000,
      peakLoadW: 5000,
      surgeLoadW: 8000,
      systemVoltage: 48,
      outputVoltage: 230,
      outputFrequency: 50,
      powerFactor: 0.8,
      designMargin: 0.25,
      inverterEfficiency: 0.9,
    });
    expect(r.isValid).toBe(true);
    expect(r.recommendedInverterVa).toBeGreaterThanOrEqual(r.minInverterVa);
    expect(r.dcInputCurrentA).toBeGreaterThan(0);
  });

  it("respects DC input current limit as a warning", () => {
    const r = calculateInverter({
      continuousLoadW: 3000,
      peakLoadW: 5000,
      surgeLoadW: 8000,
      systemVoltage: 48,
      outputVoltage: 230,
      outputFrequency: 50,
      powerFactor: 0.8,
      designMargin: 0.25,
      inverterEfficiency: 0.9,
      maxDcInputCurrentA: 100,
    });
    expect(r.isValid).toBe(true);
    expect(r.warnings.some((w) => /DC input/i.test(w))).toBe(true);
  });
});
