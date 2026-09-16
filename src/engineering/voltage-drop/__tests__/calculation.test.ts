import { describe, it, expect } from "vitest";
import { calculateInternal } from "../calculation";
import type { VoltageDropInput } from "../types";

const forwardInput: VoltageDropInput = {
  currentA: 40,
  lengthM: 20,
  systemVoltageV: 48,
  material: "copper",
  circuitType: "dc",
  conductorAreaMm2: 25,
};

const inverseInput: VoltageDropInput = {
  currentA: 40,
  lengthM: 20,
  systemVoltageV: 48,
  material: "copper",
  circuitType: "dc",
  targetDropPercent: 3,
};

describe("calculateInternal — forward mode", () => {
  it("computes a finite voltage drop", () => {
    const r = calculateInternal(forwardInput);
    expect(r.voltageDropV).toBeGreaterThan(0);
    expect(r.voltageDropPercent).toBeGreaterThan(0);
  });

  it("computes resistance per km and total", () => {
    const r = calculateInternal(forwardInput);
    expect(r.resistanceOhmPerKm).toBeGreaterThan(0);
    expect(r.resistanceOhm).toBeCloseTo(
      r.resistanceOhmPerKm * (20 / 1000),
      3,
    );
  });

  it("uses circuit factor 2 for DC", () => {
    const r = calculateInternal(forwardInput);
    expect(r.circuitFactor).toBe(2);
  });

  it("uses √3 for three-phase", () => {
    const r = calculateInternal({
      ...forwardInput,
      circuitType: "ac-three-phase",
    });
    expect(r.circuitFactor).toBeCloseTo(Math.sqrt(3), 4);
  });

  it("drop scales with current", () => {
    const a = calculateInternal({ ...forwardInput, currentA: 20 });
    const b = calculateInternal({ ...forwardInput, currentA: 40 });
    expect(b.voltageDropV).toBeCloseTo(a.voltageDropV * 2, 3);
  });

  it("drop scales with length", () => {
    const a = calculateInternal({ ...forwardInput, lengthM: 10 });
    const b = calculateInternal({ ...forwardInput, lengthM: 20 });
    expect(b.voltageDropV).toBeCloseTo(a.voltageDropV * 2, 3);
  });

  it("drop halves when area doubles", () => {
    const a = calculateInternal({ ...forwardInput, conductorAreaMm2: 25 });
    const b = calculateInternal({ ...forwardInput, conductorAreaMm2: 50 });
    expect(b.voltageDropV).toBeCloseTo(a.voltageDropV / 2, 3);
  });

  it("aluminium drops more than copper", () => {
    const cu = calculateInternal(forwardInput);
    const al = calculateInternal({ ...forwardInput, material: "aluminium" });
    expect(al.voltageDropV).toBeGreaterThan(cu.voltageDropV);
  });

  it("computes power loss", () => {
    const r = calculateInternal(forwardInput);
    expect(r.powerLossW).toBeGreaterThan(0);
  });

  it("warns when no target is provided", () => {
    const r = calculateInternal(forwardInput);
    expect(r.warnings.some((w) => /target/i.test(w))).toBe(true);
  });

  it("warns when reactance is not provided", () => {
    const r = calculateInternal(forwardInput);
    expect(r.warnings.some((w) => /Reactance/i.test(w))).toBe(true);
  });
});

describe("calculateInternal — inverse mode", () => {
  it("computes a minimum area for the target drop", () => {
    const r = calculateInternal(inverseInput);
    expect(r.calculatedMinAreaMm2).toBeGreaterThan(0);
  });

  it("inverse area produces drop <= target when applied", () => {
    const inv = calculateInternal(inverseInput);
    const fwd = calculateInternal({
      ...inverseInput,
      conductorAreaMm2: inv.calculatedMinAreaMm2,
    });
    expect(fwd.voltageDropPercent).toBeLessThanOrEqual(
      inverseInput.targetDropPercent! + 1e-3,
    );
  });

  it("target and area together yield a verdict", () => {
    const r = calculateInternal({
      ...forwardInput,
      targetDropPercent: 3,
    });
    expect(typeof r.withinTarget).toBe("boolean");
  });
});
