import { describe, it, expect } from "vitest";
import {
  calculateProtectionSizing,
  parseDraft,
  validateDraft,
} from "../services/protectionSizingService";
import type { ProtectionSizingFormDraft } from "../types";

const baseDraft: ProtectionSizingFormDraft = {
  role: "battery",
  voltageType: "dc",
  technology: "dc-breaker",
  continuousCurrentA: "100",
  systemVoltageV: "48",
  safetyFactor: "",
  availableFaultCurrentKa: "6",
  deviceVoltageRatingV: "125",
  deviceInterruptRatingKa: "10",
  deviceCurrentRatingA: "150",
};

describe("parseDraft", () => {
  it("parses required numeric fields", () => {
    const p = parseDraft(baseDraft);
    expect(p.continuousCurrentA).toBe(100);
    expect(p.systemVoltageV).toBe(48);
    expect(p.availableFaultCurrentKa).toBe(6);
    expect(p.deviceVoltageRatingV).toBe(125);
    expect(p.deviceInterruptRatingKa).toBe(10);
    expect(p.deviceCurrentRatingA).toBe(150);
  });

  it("omits optional fields when empty", () => {
    const p = parseDraft({
      ...baseDraft,
      safetyFactor: "",
      availableFaultCurrentKa: "",
      deviceVoltageRatingV: "",
      deviceInterruptRatingKa: "",
      deviceCurrentRatingA: "",
    });
    expect(p.safetyFactor).toBeUndefined();
    expect(p.availableFaultCurrentKa).toBeUndefined();
    expect(p.deviceVoltageRatingV).toBeUndefined();
    expect(p.deviceInterruptRatingKa).toBeUndefined();
    expect(p.deviceCurrentRatingA).toBeUndefined();
  });

  it("preserves role, voltage type, technology", () => {
    const p = parseDraft({
      ...baseDraft,
      role: "pv-string",
      voltageType: "dc",
      technology: "fuse",
    });
    expect(p.role).toBe("pv-string");
    expect(p.voltageType).toBe("dc");
    expect(p.technology).toBe("fuse");
  });
});

describe("validateDraft (form-level)", () => {
  it("accepts a well-formed draft", () => {
    expect(validateDraft(baseDraft)).toEqual({});
  });

  it("flags non-positive continuous current", () => {
    expect(validateDraft({ ...baseDraft, continuousCurrentA: "0" })
      ["continuousCurrentA"]).toBeDefined();
  });

  it("flags non-positive system voltage", () => {
    expect(validateDraft({ ...baseDraft, systemVoltageV: "0" })
      ["systemVoltageV"]).toBeDefined();
  });

  it("flags safety factor below 1", () => {
    expect(validateDraft({ ...baseDraft, safetyFactor: "0.5" })
      ["safetyFactor"]).toBeDefined();
  });

  it("does not flag empty safety factor", () => {
    expect(validateDraft({ ...baseDraft, safetyFactor: "" }))
      .toEqual({});
  });

  it("flags negative fault current", () => {
    expect(validateDraft({ ...baseDraft, availableFaultCurrentKa: "-1" })
      ["availableFaultCurrentKa"]).toBeDefined();
  });

  it("does not flag empty fault current", () => {
    expect(validateDraft({ ...baseDraft, availableFaultCurrentKa: "" }))
      .toEqual({});
  });
});

describe("calculateProtectionSizing (service → engine)", () => {
  it("returns a valid engine result for a well-rated device", () => {
    const r = calculateProtectionSizing(baseDraft);
    expect(r.isValid).toBe(true);
    // 100 A × 1.25 (role default for battery) = 125 A
    expect(r.designCurrentA).toBeCloseTo(125, 1);
    expect(r.recommendedRatingA).toBe(125);
    // 48 V × 1.2 (DC margin) = 57.6 V
    expect(r.minimumVoltageRatingV).toBeCloseTo(57.6, 1);
  });

  it("applies a custom safety factor when provided", () => {
    const r = calculateProtectionSizing({
      ...baseDraft,
      safetyFactor: "1.5",
    });
    expect(r.designCurrentA).toBeCloseTo(150, 1);
  });

  it("uses PV 1.56× default when role is pv-string", () => {
    const r = calculateProtectionSizing({
      ...baseDraft,
      role: "pv-string",
      technology: "fuse",
      continuousCurrentA: "10",
      systemVoltageV: "200",
      availableFaultCurrentKa: "3",
    });
    expect(r.designCurrentA).toBeCloseTo(15.6, 1);
  });

  it("flags an under-rated device voltage as invalid", () => {
    const r = calculateProtectionSizing({
      ...baseDraft,
      deviceVoltageRatingV: "48",   // < 57.6 V minimum
    });
    expect(r.isValid).toBe(false);
    expect(r.voltageCompatible).toBe(false);
  });

  it("flags an under-rated interrupt rating as invalid", () => {
    const r = calculateProtectionSizing({
      ...baseDraft,
      deviceInterruptRatingKa: "3",   // < 6 kA fault
    });
    expect(r.isValid).toBe(false);
    expect(r.interruptCompatible).toBe(false);
  });

  it("flags an under-rated current rating as invalid", () => {
    const r = calculateProtectionSizing({
      ...baseDraft,
      deviceCurrentRatingA: "100",   // design current is 125 A
    });
    expect(r.isValid).toBe(false);
    expect(r.currentRatingSufficient).toBe(false);
  });

  it("warns when fault current is not provided", () => {
    const r = calculateProtectionSizing({
      ...baseDraft,
      availableFaultCurrentKa: "",
    });
    expect(r.warnings.some((w) => /fault current not provided/i.test(w)))
      .toBe(true);
  });

  it("warns on DC circuits protected by MCB", () => {
    const r = calculateProtectionSizing({
      ...baseDraft,
      technology: "mcb",
    });
    expect(r.warnings.some((w) => /DC circuits/i.test(w))).toBe(true);
  });

  it("warns that SPD uses a different sizing convention", () => {
    const r = calculateProtectionSizing({
      ...baseDraft,
      technology: "spd",
    });
    expect(r.warnings.some((w) => /SPD/i.test(w))).toBe(true);
  });
});
