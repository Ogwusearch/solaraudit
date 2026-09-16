import { describe, it, expect } from "vitest";
import { calculateInternal } from "../calculation";
import type { ProtectionInput } from "../types";

const baseBattery: ProtectionInput = {
  role: "battery",
  voltageType: "dc",
  technology: "dc-breaker",
  continuousCurrentA: 100,
  systemVoltageV: 48,
};

const basePv: ProtectionInput = {
  role: "pv-string",
  voltageType: "dc",
  technology: "fuse",
  continuousCurrentA: 10,
  systemVoltageV: 200,
};

describe("calculateInternal", () => {
  it("applies role-specific safety factor (battery = 1.25×)", () => {
    const r = calculateInternal(baseBattery);
    expect(r.designCurrentA).toBeCloseTo(125, 1);
  });

  it("applies role-specific safety factor (pv-string = 1.56×)", () => {
    const r = calculateInternal(basePv);
    expect(r.designCurrentA).toBeCloseTo(15.6, 1);
  });

  it("respects a caller-provided safety factor", () => {
    const r = calculateInternal({ ...baseBattery, safetyFactor: 1.5 });
    expect(r.designCurrentA).toBeCloseTo(150, 1);
  });

  it("recommends the next standard rating >= design current", () => {
    const r = calculateInternal(baseBattery); // design 125 A
    expect(r.recommendedRatingA).toBe(125);
  });

  it("selects the next standard protection rating when needed", () => {
    const r = calculateInternal(basePv); // design 15.6 A -> 20 A
    expect(r.recommendedRatingA).toBe(16);
  });

  it("applies DC voltage margin (1.2×)", () => {
    const r = calculateInternal(baseBattery); // 48 × 1.2 = 57.6
    expect(r.minimumVoltageRatingV).toBeCloseTo(57.6, 1);
  });

  it("no DC margin for AC circuits", () => {
    const r = calculateInternal({
      ...baseBattery,
      voltageType: "ac",
      systemVoltageV: 230,
    });
    expect(r.minimumVoltageRatingV).toBe(230);
  });

  it("sets minimum interrupt rating from fault current", () => {
    const r = calculateInternal({ ...baseBattery, availableFaultCurrentKa: 6 });
    expect(r.minimumInterruptRatingKa).toBe(6);
  });

  it("flags an under-rated device voltage", () => {
    const r = calculateInternal({
      ...baseBattery,
      deviceVoltageRatingV: 50, // below 57.6 V minimum
    });
    expect(r.voltageCompatible).toBe(false);
    expect(r.isValid).toBe(false);
  });

  it("flags an under-rated interrupt capability", () => {
    const r = calculateInternal({
      ...baseBattery,
      availableFaultCurrentKa: 10,
      deviceInterruptRatingKa: 6,
    });
    expect(r.interruptCompatible).toBe(false);
    expect(r.isValid).toBe(false);
  });

  it("flags an under-rated device current", () => {
    const r = calculateInternal({
      ...baseBattery,
      deviceCurrentRatingA: 100, // design is 125 A
    });
    expect(r.currentRatingSufficient).toBe(false);
    expect(r.isValid).toBe(false);
  });

  it("accepts a properly rated device", () => {
    const r = calculateInternal({
      ...baseBattery,
      deviceVoltageRatingV: 125,
      deviceInterruptRatingKa: 10,
      deviceCurrentRatingA: 150,
      availableFaultCurrentKa: 6,
    });
    expect(r.isValid).toBe(true);
    expect(r.voltageCompatible).toBe(true);
    expect(r.interruptCompatible).toBe(true);
    expect(r.currentRatingSufficient).toBe(true);
    expect(r.selectedRatingA).toBe(150);
  });

  it("warns when fault current is not provided", () => {
    const r = calculateInternal(baseBattery);
    expect(r.warnings.some((w) => /fault current not provided/i.test(w))).toBe(true);
  });

  it("warns on very high fault current", () => {
    const r = calculateInternal({ ...baseBattery, availableFaultCurrentKa: 30 });
    expect(r.warnings.some((w) => /coordination/i.test(w))).toBe(true);
  });

  it("warns on DC circuit protected by MCB", () => {
    const r = calculateInternal({ ...baseBattery, technology: "mcb" });
    expect(r.warnings.some((w) => /DC circuits/i.test(w))).toBe(true);
  });

  it("warns that SPD uses a different sizing convention", () => {
    const r = calculateInternal({ ...baseBattery, technology: "spd" });
    expect(r.warnings.some((w) => /SPD/i.test(w))).toBe(true);
  });

  it("warns that DC isolator is not over-current protection", () => {
    const r = calculateInternal({ ...baseBattery, technology: "dc-isolator" });
    expect(r.warnings.some((w) => /disconnection/i.test(w))).toBe(true);
  });

  it("warns that RCD requires over-current protection too", () => {
    const r = calculateInternal({
      ...baseBattery,
      voltageType: "ac",
      technology: "rcd",
    });
    expect(r.warnings.some((w) => /RCD|earth-leakage/i.test(w))).toBe(true);
  });
});
