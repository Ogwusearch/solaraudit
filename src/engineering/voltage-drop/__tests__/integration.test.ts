import { describe, it, expect } from "vitest";
import { calculateVoltageDrop } from "../index";

describe("calculateVoltageDrop (public API)", () => {
  it("returns invalid when no mode is provided", () => {
    const r = calculateVoltageDrop({
      currentA: 40,
      lengthM: 20,
      systemVoltageV: 48,
      material: "copper",
      circuitType: "dc",
    });
    expect(r.isValid).toBe(false);
    expect(r.errors.length).toBeGreaterThan(0);
  });

  it("forward mode: 48 V DC, 40 A, 20 m, 25 mm² copper", () => {
    const r = calculateVoltageDrop({
      currentA: 40,
      lengthM: 20,
      systemVoltageV: 48,
      material: "copper",
      circuitType: "dc",
      conductorAreaMm2: 25,
      targetDropPercent: 3,
    });
    expect(r.isValid).toBe(true);
    expect(r.voltageDropV).toBeGreaterThan(0);
    expect(typeof r.withinTarget).toBe("boolean");
  });

  it("inverse mode: solves minimum area for 2% target", () => {
    const r = calculateVoltageDrop({
      currentA: 40,
      lengthM: 20,
      systemVoltageV: 48,
      material: "copper",
      circuitType: "dc",
      targetDropPercent: 2,
    });
    expect(r.isValid).toBe(true);
    expect(r.calculatedMinAreaMm2).toBeGreaterThan(0);
  });

  it("AC single-phase with non-unity power factor", () => {
    const r = calculateVoltageDrop({
      currentA: 16,
      lengthM: 30,
      systemVoltageV: 230,
      material: "copper",
      circuitType: "ac-single-phase",
      conductorAreaMm2: 4,
      powerFactor: 0.85,
      targetDropPercent: 3,
    });
    expect(r.isValid).toBe(true);
    expect(r.effectivePowerFactor).toBe(0.85);
    expect(r.warnings.some((w) => /power factor/i.test(w))).toBe(true);
  });

  it("three-phase AC run", () => {
    const r = calculateVoltageDrop({
      currentA: 25,
      lengthM: 40,
      systemVoltageV: 400,
      material: "copper",
      circuitType: "ac-three-phase",
      conductorAreaMm2: 6,
      targetDropPercent: 3,
    });
    expect(r.isValid).toBe(true);
    expect(r.circuitFactor).toBeCloseTo(Math.sqrt(3), 4);
  });

  it("reactance is applied when provided", () => {
    const withoutX = calculateVoltageDrop({
      currentA: 100,
      lengthM: 100,
      systemVoltageV: 400,
      material: "copper",
      circuitType: "ac-three-phase",
      conductorAreaMm2: 25,
      powerFactor: 0.85,
    });
    const withX = calculateVoltageDrop({
      currentA: 100,
      lengthM: 100,
      systemVoltageV: 400,
      material: "copper",
      circuitType: "ac-three-phase",
      conductorAreaMm2: 25,
      powerFactor: 0.85,
      reactanceOhmPerKm: 0.08,
    });
    expect(withX.voltageDropV).toBeGreaterThan(withoutX.voltageDropV);
  });
});
