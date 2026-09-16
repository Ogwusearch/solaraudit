import { describe, it, expect } from "vitest";
import {
  calculateChargeControllerSizing,
  parseDraft,
  validateDraft,
} from "../services/chargeControllerSizingService";
import type { ChargeControllerSizingFormDraft } from "../types";

const baseDraft: ChargeControllerSizingFormDraft = {
  pvArrayKwp: "5",
  pvVmp: "136",
  pvVoc: "164",
  pvImp: "36.8",
  pvIsc: "39",
  batteryVoltage: "48",
  batteryCapacityAh: "200",
  technology: "mppt",
  designMargin: "0.25",
  controllerEfficiency: "0.95",
  maxPvInputVoltage: "200",
  maxPvInputCurrentA: "50",
  maxOutputCurrentA: "150",
};

describe("parseDraft", () => {
  it("parses numeric fields", () => {
    const p = parseDraft(baseDraft);
    expect(p.pvArrayKwp).toBe(5);
    expect(p.pvVoc).toBe(164);
    expect(p.batteryVoltage).toBe(48);
    expect(p.maxPvInputVoltage).toBe(200);
  });

  it("omits optional controller limits when empty", () => {
    const p = parseDraft({
      ...baseDraft,
      maxPvInputVoltage: "",
      maxPvInputCurrentA: "",
      maxOutputCurrentA: "",
    });
    expect(p.maxPvInputVoltage).toBeUndefined();
    expect(p.maxPvInputCurrentA).toBeUndefined();
    expect(p.maxOutputCurrentA).toBeUndefined();
  });

  it("preserves technology", () => {
    const p = parseDraft({ ...baseDraft, technology: "pwm" });
    expect(p.technology).toBe("pwm");
  });
});

describe("validateDraft (form-level)", () => {
  it("accepts a well-formed draft", () => {
    expect(validateDraft(baseDraft)).toEqual({});
  });

  it("flags non-positive array power", () => {
    expect(validateDraft({ ...baseDraft, pvArrayKwp: "0" })["pvArrayKwp"])
      .toBeDefined();
  });

  it("flags non-positive Vmp", () => {
    expect(validateDraft({ ...baseDraft, pvVmp: "0" })["pvVmp"])
      .toBeDefined();
  });

  it("flags non-positive Voc", () => {
    expect(validateDraft({ ...baseDraft, pvVoc: "0" })["pvVoc"])
      .toBeDefined();
  });

  it("flags non-positive battery voltage", () => {
    expect(validateDraft({ ...baseDraft, batteryVoltage: "0" })["batteryVoltage"])
      .toBeDefined();
  });

  it("flags invalid efficiency", () => {
    expect(validateDraft({ ...baseDraft, controllerEfficiency: "1.5" })["controllerEfficiency"])
      .toBeDefined();
  });
});

describe("calculateChargeControllerSizing (service → engine)", () => {
  it("returns a valid engine result for a coherent draft", () => {
    const r = calculateChargeControllerSizing(baseDraft);
    expect(r.isValid).toBe(true);
    expect(r.requiredChargeCurrentA).toBeGreaterThan(0);
    expect(r.recommendedControllerCurrentA).toBeGreaterThanOrEqual(
      r.designChargeCurrentA,
    );
  });

  it("passes structural errors through unchanged", () => {
    const bad: ChargeControllerSizingFormDraft = {
      ...baseDraft,
      pvArrayKwp: "0",
    };
    const r = calculateChargeControllerSizing(bad);
    expect(r.isValid).toBe(false);
    expect(r.errors.length).toBeGreaterThan(0);
  });

  it("reports electrical compatibility flags as errors", () => {
    const r = calculateChargeControllerSizing({
      ...baseDraft,
      maxPvInputVoltage: "100",   // array Voc is 164
      maxPvInputCurrentA: "20",   // array Isc is 39
      maxOutputCurrentA: "50",    // design current ~130
    });
    expect(r.isValid).toBe(false);
    expect(r.pvVoltageCompatible).toBe(false);
    expect(r.pvCurrentCompatible).toBe(false);
    expect(r.outputCurrentCompatible).toBe(false);
    expect(r.errors.length).toBeGreaterThanOrEqual(3);
  });

  it("rejects PWM with mismatched Vmp", () => {
    const r = calculateChargeControllerSizing({
      ...baseDraft,
      technology: "pwm",
      pvVmp: "136",    // 48 V battery — far outside ±20%
    });
    expect(r.isValid).toBe(false);
    expect(r.errors.some((e) => /PWM/i.test(e))).toBe(true);
  });

  it("surfaces PWM yield warning even when compatible", () => {
    const r = calculateChargeControllerSizing({
      ...baseDraft,
      technology: "pwm",
      pvVmp: "50",     // close to 48 V
    });
    expect(r.warnings.some((w) => /PWM/i.test(w))).toBe(true);
  });
});
