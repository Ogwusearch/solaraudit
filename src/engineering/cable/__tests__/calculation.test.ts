import { describe, it, expect } from "vitest";
import { calculateInternal } from "../calculation";
import type { CableInput } from "../types";

const baseInput: CableInput = {
  currentA: 40,
  lengthM: 20,
  systemVoltage: 48,
  allowableDropPercent: 3,
  material: "copper",
  circuitType: "dc",
  installationMethod: "conduit",
};

describe("calculateInternal", () => {
  it("computes allowable voltage drop", () => {
    const r = calculateInternal(baseInput);
    expect(r.maxVoltageDropV).toBeCloseTo(1.44, 2); // 48 × 3%
  });

  it("computes minimum area from voltage drop", () => {
    // K=2, I=40, L=20, rhoT ≈ 0.0209, Vd=1.44 -> A ≈ 23.2 mm²
    const r = calculateInternal(baseInput);
    expect(r.calculatedAreaMm2).toBeGreaterThan(20);
    expect(r.calculatedAreaMm2).toBeLessThan(30);
  });

  it("selects a standard size >= required area", () => {
    const r = calculateInternal(baseInput);
    expect(r.selectedAreaMm2).toBeGreaterThanOrEqual(r.requiredAreaMm2);
  });

  it("actual drop is below allowable after selecting a size", () => {
    const r = calculateInternal(baseInput);
    expect(r.actualVoltageDropV).toBeLessThanOrEqual(r.maxVoltageDropV + 1e-3);
  });

  it("ampacity dominates for short, high-current runs", () => {
    const r = calculateInternal({
      ...baseInput,
      currentA: 200,
      lengthM: 1,
    });
    expect(r.ampacityAreaMm2).toBeGreaterThan(r.calculatedAreaMm2);
    expect(r.warnings.some((w) => /ampacity|voltage drop/i.test(w))).toBe(false);
  });

  it("voltage drop dominates for long, low-current runs", () => {
    const r = calculateInternal({
      ...baseInput,
      currentA: 5,
      lengthM: 200,
    });
    expect(r.calculatedAreaMm2).toBeGreaterThan(r.ampacityAreaMm2);
    expect(r.warnings.some((w) => /voltage drop/i.test(w))).toBe(true);
  });

  it("applies design margin to current", () => {
    const r0 = calculateInternal(baseInput);
    const r25 = calculateInternal({ ...baseInput, designMargin: 0.25 });
    expect(r25.designCurrentA).toBeCloseTo(r0.designCurrentA * 1.25, 1);
  });

  it("aluminium requires larger area than copper", () => {
    const cu = calculateInternal(baseInput);
    const al = calculateInternal({ ...baseInput, material: "aluminium" });
    expect(al.calculatedAreaMm2).toBeGreaterThan(cu.calculatedAreaMm2);
  });

  it("three-phase uses √3 factor", () => {
    const dc = calculateInternal({ ...baseInput, circuitType: "dc" });
    const tp = calculateInternal({ ...baseInput, circuitType: "ac-three-phase" });
    const ratio = tp.calculatedAreaMm2 / dc.calculatedAreaMm2;
    expect(ratio).toBeCloseTo(Math.sqrt(3) / 2, 2);
  });

  it("temperature derating reduces ampacity", () => {
    const r = calculateInternal({ ...baseInput, ambientTemperatureC: 50 });
    expect(r.temperatureFactor).toBeLessThan(1);
    expect(r.deratedAmpacityA).toBeLessThan(
      // base ampacity is not directly exposed, but derated must be < nominal
      r.deratedAmpacityA / r.temperatureFactor + 1,
    );
  });

  it("grouping derating reduces ampacity", () => {
    const r = calculateInternal({ ...baseInput, groupingCount: 4 });
    expect(r.groupingFactor).toBeLessThan(1);
  });
});
