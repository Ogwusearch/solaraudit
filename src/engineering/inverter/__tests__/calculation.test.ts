/**
 * SolarAudit — Inverter Engine: Calculation Tests
 */

import { describe, it, expect } from "vitest";

import { calculateInternal } from "../calculation";

import type { InverterInput } from "../types";

const baseInput: InverterInput = {
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

describe("calculateInternal", () => {
  it("converts W to VA using power factor", () => {
    // 3000 / 0.8 = 3750 VA

    const r = calculateInternal(baseInput);

    expect(r.continuousVa).toBeCloseTo(3750, 1);
  });

  it("converts peak load to VA", () => {
    // 5000 / 0.8 = 6250 VA

    const r = calculateInternal(baseInput);

    expect(r.peakVa).toBeCloseTo(6250, 1);
  });

  it("computes minimum inverter VA from peak with margin", () => {
    // peak = 5000 / 0.8 = 6250 VA
    // min = 6250 × 1.25 = 7812.5 VA

    const r = calculateInternal(baseInput);

    expect(r.minInverterVa).toBeCloseTo(7812.5, 1);
  });

  it("computes surge VA with power factor", () => {
    // 8000 / 0.8 = 10000 VA

    const r = calculateInternal(baseInput);

    expect(r.surgeVa).toBeCloseTo(10000, 1);
  });

  it("computes required surge VA with design margin", () => {
    // surge = 8000 / 0.8 = 10000 VA
    // required = 10000 × 1.25 = 12500 VA

    const r = calculateInternal(baseInput);

    expect(r.requiredSurgeVa).toBeCloseTo(12500, 1);
  });

  it("recommends an inverter large enough for both peak and surge requirements", () => {
    const r = calculateInternal(baseInput);

    /*
     * Peak requirement:
     *   6250 × 1.25 = 7812.5 VA
     *
     * Surge requirement:
     *   10000 × 1.25 = 12500 VA
     *
     * Therefore sizing must use:
     *   max(7812.5, 12500) = 12500 VA
     *
     * Next standard size:
     *   15000 VA
     */

    expect(r.recommendedInverterVa).toBe(15000);

    expect(r.recommendedInverterVa).toBeGreaterThanOrEqual(
      r.minInverterVa,
    );

    expect(r.recommendedInverterVa).toBeGreaterThanOrEqual(
      r.requiredSurgeVa,
    );
  });

  it("computes DC input current at peak load", () => {
    // 5000 / (0.9 × 48) = 115.74 A

    const r = calculateInternal(baseInput);

    expect(r.dcInputCurrentA).toBeCloseTo(115.74, 1);
  });

  it("computes DC surge current", () => {
    // 8000 / (0.9 × 48) = 185.18 A

    const r = calculateInternal(baseInput);

    expect(r.dcSurgeCurrentA).toBeCloseTo(185.18, 1);
  });

  it("warns on high surge ratio", () => {
    const r = calculateInternal({
      ...baseInput,
      surgeLoadW: 20000,
    });

    // 20000 / 3000 = 6.67×

    expect(
      r.warnings.some((w) => /surge/i.test(w)),
    ).toBe(true);
  });

  it("warns on low power factor", () => {
    const r = calculateInternal({
      ...baseInput,
      powerFactor: 0.5,
    });

    expect(
      r.warnings.some((w) =>
        /power factor/i.test(w),
      ),
    ).toBe(true);
  });

  it("returns the matching standard inverter size", () => {
    const r = calculateInternal(baseInput);

    expect(r.recommendedStandardVa).toBe(15000);
  });

  it("returns null when no standard inverter size is large enough", () => {
    const r = calculateInternal({
      ...baseInput,
      surgeLoadW: 20000,
    });

    expect(r.recommendedStandardVa).toBeNull();
  });
});