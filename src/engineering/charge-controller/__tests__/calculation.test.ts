import { describe, it, expect } from "vitest";
import { calculateInternal } from "../calculation";
import type { ChargeControllerInput } from "../types";

const baseInput: ChargeControllerInput = {
  pvArrayKwp: 5,
  pvVmp: 136,
  pvVoc: 164,
  pvImp: 36.8,
  pvIsc: 39,
  batteryVoltage: 48,
  batteryCapacityAh: 200,
  technology: "mppt",
  designMargin: 0.25,
  controllerEfficiency: 0.95,
};

describe("calculateInternal", () => {
  it("computes required charge current from array power / battery voltage", () => {
    // 5000 / 48 = 104.17 A
    const r = calculateInternal(baseInput);
    expect(r.requiredChargeCurrentA).toBeCloseTo(104.17, 1);
  });

  it("applies design margin", () => {
    const r = calculateInternal(baseInput);
    expect(r.designChargeCurrentA).toBeCloseTo(
      r.requiredChargeCurrentA * 1.25, 1,
    );
  });

  it("recommends the next standard controller size", () => {
    const r = calculateInternal(baseInput);
    expect(r.recommendedControllerCurrentA).toBeGreaterThanOrEqual(
      r.designChargeCurrentA,
    );
    expect(r.recommendedStandardA).toBe(150); // 130.2 -> 150
  });

  it("checks Voc against controller limit", () => {
    const r = calculateInternal({
      ...baseInput,
      maxPvInputVoltage: 150, // array Voc is 164 V
    });
    expect(r.pvVoltageCompatible).toBe(false);
    expect(r.isValid).toBe(false);
  });

  it("checks Isc against controller limit", () => {
    const r = calculateInternal({
      ...baseInput,
      maxPvInputCurrentA: 30, // array Isc is 39 A
    });
    expect(r.pvCurrentCompatible).toBe(false);
    expect(r.isValid).toBe(false);
  });

  it("checks output current against controller limit", () => {
    const r = calculateInternal({
      ...baseInput,
      maxOutputCurrentA: 100, // design current is ~130 A
    });
    expect(r.outputCurrentCompatible).toBe(false);
    expect(r.isValid).toBe(false);
  });

  it("PWM rejects mismatched Vmp", () => {
    const r = calculateInternal({
      ...baseInput,
      technology: "pwm",
      pvVmp: 136, // far from 48 V battery
    });
    expect(r.isValid).toBe(false);
    expect(r.errors.some((e) => /PWM/i.test(e))).toBe(true);
  });

  it("PWM accepts matched Vmp", () => {
    const r = calculateInternal({
      ...baseInput,
      technology: "pwm",
      pvVmp: 50, // ~ 48 V
    });
    expect(r.errors.some((e) => /PWM/i.test(e))).toBe(false);
  });

  it("warns on small array", () => {
    const r = calculateInternal({ ...baseInput, pvArrayKwp: 0.05 });
    expect(r.warnings.some((w) => /small/i.test(w))).toBe(true);
  });
});
