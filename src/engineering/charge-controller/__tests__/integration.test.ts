import { describe, it, expect } from "vitest";
import { calculateChargeController } from "../index";

const baseInput = {
  pvArrayKwp: 5,
  pvVmp: 136,
  pvVoc: 164,
  pvImp: 36.8,
  pvIsc: 39,
  batteryVoltage: 48,
  batteryCapacityAh: 200,
  technology: "mppt" as const,
  designMargin: 0.25,
  controllerEfficiency: 0.95,
};

describe("calculateChargeController (public API)", () => {
  it("returns invalid on structural errors", () => {
    const r = calculateChargeController({ ...baseInput, pvArrayKwp: 0 });
    expect(r.isValid).toBe(false);
    expect(r.errors.length).toBeGreaterThan(0);
  });

  it("sizes a controller for a 5 kWp array on 48 V", () => {
    const r = calculateChargeController({
      ...baseInput,
      maxPvInputVoltage: 200,
      maxPvInputCurrentA: 50,
      maxOutputCurrentA: 150,
    });
    expect(r.isValid).toBe(true);
    expect(r.errors).toEqual([]);
    expect(r.recommendedStandardA).toBeGreaterThanOrEqual(
      r.designChargeCurrentA,
    );
  });

  it("returns invalid when electrical limits are violated", () => {
    const r = calculateChargeController({
      ...baseInput,
      maxPvInputVoltage: 100, // Voc is 164
      maxPvInputCurrentA: 20, // Isc is 39
      maxOutputCurrentA: 50,  // design current ~130
    });
    expect(r.isValid).toBe(false);
    expect(r.errors.length).toBeGreaterThanOrEqual(3);
    expect(r.pvVoltageCompatible).toBe(false);
    expect(r.pvCurrentCompatible).toBe(false);
    expect(r.outputCurrentCompatible).toBe(false);
  });
});
