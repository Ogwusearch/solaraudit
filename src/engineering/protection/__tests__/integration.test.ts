import { describe, it, expect } from "vitest";
import { calculateProtection } from "../index";

describe("calculateProtection (public API)", () => {
  it("returns invalid on structural errors", () => {
    const r = calculateProtection({
      role: "battery",
      voltageType: "dc",
      technology: "fuse",
      continuousCurrentA: 0,
      systemVoltageV: 48,
    });
    expect(r.isValid).toBe(false);
    expect(r.errors.length).toBeGreaterThan(0);
  });

  it("sizes a 48 V battery fuse for a 100 A circuit", () => {
    const r = calculateProtection({
      role: "battery",
      voltageType: "dc",
      technology: "fuse",
      continuousCurrentA: 100,
      systemVoltageV: 48,
      availableFaultCurrentKa: 6,
    });
    expect(r.isValid).toBe(true);
    expect(r.designCurrentA).toBeCloseTo(125, 1);
    expect(r.recommendedRatingA).toBe(125);
    expect(r.minimumVoltageRatingV).toBeCloseTo(57.6, 1);
    expect(r.minimumInterruptRatingKa).toBe(6);
  });

  it("sizes a PV string fuse with NEC 1.56× factor", () => {
    const r = calculateProtection({
      role: "pv-string",
      voltageType: "dc",
      technology: "fuse",
      continuousCurrentA: 10,
      systemVoltageV: 200,
      availableFaultCurrentKa: 3,
    });
    expect(r.isValid).toBe(true);
    expect(r.designCurrentA).toBeCloseTo(15.6, 1);
    expect(r.recommendedRatingA).toBe(16);
    expect(r.minimumVoltageRatingV).toBeCloseTo(240, 1);
  });

  it("returns invalid when a candidate device is under-rated", () => {
    const r = calculateProtection({
      role: "battery",
      voltageType: "dc",
      technology: "dc-breaker",
      continuousCurrentA: 100,
      systemVoltageV: 48,
      availableFaultCurrentKa: 10,
      deviceVoltageRatingV: 48,  // < 57.6 required
      deviceInterruptRatingKa: 5, // < 10 required
      deviceCurrentRatingA: 100,  // < 125 required
    });
    expect(r.isValid).toBe(false);
    expect(r.voltageCompatible).toBe(false);
    expect(r.interruptCompatible).toBe(false);
    expect(r.currentRatingSufficient).toBe(false);
    expect(r.errors.length).toBeGreaterThanOrEqual(3);
  });

  it("accepts a correctly rated device", () => {
    const r = calculateProtection({
      role: "inverter-dc",
      voltageType: "dc",
      technology: "dc-breaker",
      continuousCurrentA: 120,
      systemVoltageV: 48,
      availableFaultCurrentKa: 6,
      deviceVoltageRatingV: 125,
      deviceInterruptRatingKa: 10,
      deviceCurrentRatingA: 150,
    });
    expect(r.isValid).toBe(true);
    expect(r.errors).toEqual([]);
    expect(r.selectedRatingA).toBe(150);
  });
});
