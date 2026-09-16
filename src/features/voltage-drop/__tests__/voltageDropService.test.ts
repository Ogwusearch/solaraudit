import { describe, it, expect } from "vitest";
import {
  calculateVoltageDropFromDraft,
  parseDraft,
  validateDraft,
} from "../services/voltageDropService";
import type { VoltageDropFormDraft } from "../types";

const forwardDraft: VoltageDropFormDraft = {
  currentA: "40",
  lengthM: "20",
  systemVoltageV: "48",
  material: "copper",
  circuitType: "dc",
  conductorAreaMm2: "25",
  targetDropPercent: "",
  conductorTempC: "70",
  powerFactor: "",
  reactanceOhmPerKm: "",
};

const inverseDraft: VoltageDropFormDraft = {
  ...forwardDraft,
  conductorAreaMm2: "",
  targetDropPercent: "3",
};

const bothDraft: VoltageDropFormDraft = {
  ...forwardDraft,
  targetDropPercent: "3",
};

describe("parseDraft", () => {
  it("parses required fields", () => {
    const p = parseDraft(forwardDraft);
    expect(p.currentA).toBe(40);
    expect(p.lengthM).toBe(20);
    expect(p.systemVoltageV).toBe(48);
    expect(p.conductorAreaMm2).toBe(25);
  });

  it("omits optional fields when empty", () => {
    const p = parseDraft({
      ...forwardDraft,
      conductorTempC: "",
      powerFactor: "",
      reactanceOhmPerKm: "",
    });
    expect(p.conductorTempC).toBeUndefined();
    expect(p.powerFactor).toBeUndefined();
    expect(p.reactanceOhmPerKm).toBeUndefined();
  });

  it("omits modes that are not requested", () => {
    expect(parseDraft(forwardDraft).targetDropPercent).toBeUndefined();
    expect(parseDraft(inverseDraft).conductorAreaMm2).toBeUndefined();
  });

  it("preserves both modes when both are provided", () => {
    const p = parseDraft(bothDraft);
    expect(p.conductorAreaMm2).toBe(25);
    expect(p.targetDropPercent).toBe(3);
  });
});

describe("validateDraft (form-level)", () => {
  it("accepts a forward-only draft", () => {
    expect(validateDraft(forwardDraft)).toEqual({});
  });

  it("accepts an inverse-only draft", () => {
    expect(validateDraft(inverseDraft)).toEqual({});
  });

  it("accepts a draft with both modes", () => {
    expect(validateDraft(bothDraft)).toEqual({});
  });

  it("flags missing both modes", () => {
    const errs = validateDraft({
      ...forwardDraft,
      conductorAreaMm2: "",
      targetDropPercent: "",
    });
    expect(errs["conductorAreaMm2"]).toBeDefined();
  });

  it("flags non-positive current", () => {
    expect(validateDraft({ ...forwardDraft, currentA: "0" })["currentA"])
      .toBeDefined();
  });

  it("flags non-positive length", () => {
    expect(validateDraft({ ...forwardDraft, lengthM: "0" })["lengthM"])
      .toBeDefined();
  });

  it("flags non-positive area", () => {
    expect(validateDraft({ ...forwardDraft, conductorAreaMm2: "0" })
      ["conductorAreaMm2"]).toBeDefined();
  });

  it("flags non-positive target drop", () => {
    expect(validateDraft({ ...inverseDraft, targetDropPercent: "0" })
      ["targetDropPercent"]).toBeDefined();
  });

  it("flags bad power factor", () => {
    expect(validateDraft({ ...forwardDraft, powerFactor: "0.05" })
      ["powerFactor"]).toBeDefined();
  });

  it("flags negative reactance", () => {
    expect(validateDraft({ ...forwardDraft, reactanceOhmPerKm: "-0.1" })
      ["reactanceOhmPerKm"]).toBeDefined();
  });
});

describe("calculateVoltageDropFromDraft (service → engine)", () => {
  it("forward mode produces a drop", () => {
    const r = calculateVoltageDropFromDraft(forwardDraft);
    expect(r.isValid).toBe(true);
    expect(r.voltageDropV).toBeGreaterThan(0);
    expect(r.voltageDropPercent).toBeGreaterThan(0);
    expect(r.calculatedMinAreaMm2).toBe(0);
  });

  it("inverse mode produces a minimum area", () => {
    const r = calculateVoltageDropFromDraft(inverseDraft);
    expect(r.isValid).toBe(true);
    expect(r.calculatedMinAreaMm2).toBeGreaterThan(0);
    expect(r.voltageDropV).toBe(0);
  });

  it("both modes produce a drop AND a minimum area AND a verdict", () => {
    const r = calculateVoltageDropFromDraft(bothDraft);
    expect(r.isValid).toBe(true);
    expect(r.voltageDropV).toBeGreaterThan(0);
    expect(r.calculatedMinAreaMm2).toBeGreaterThan(0);
    expect(typeof r.withinTarget).toBe("boolean");
  });

  it("three-phase uses a different circuit factor than DC", () => {
    const dc = calculateVoltageDropFromDraft(forwardDraft);
    const tp = calculateVoltageDropFromDraft({
      ...forwardDraft,
      circuitType: "ac-three-phase",
    });
    expect(dc.circuitFactor).toBe(2);
    expect(tp.circuitFactor).toBeCloseTo(Math.sqrt(3), 4);
  });

  it("reactance increases the drop when provided", () => {
    const withoutX = calculateVoltageDropFromDraft({
      ...forwardDraft,
      circuitType: "ac-three-phase",
      powerFactor: "0.85",
    });
    const withX = calculateVoltageDropFromDraft({
      ...forwardDraft,
      circuitType: "ac-three-phase",
      powerFactor: "0.85",
      reactanceOhmPerKm: "0.08",
    });
    expect(withX.voltageDropV).toBeGreaterThan(withoutX.voltageDropV);
  });

  it("warns when neither mode is provided", () => {
    const r = calculateVoltageDropFromDraft({
      ...forwardDraft,
      conductorAreaMm2: "",
      targetDropPercent: "",
    });
    expect(r.isValid).toBe(false);
    expect(r.errors.length).toBeGreaterThan(0);
  });
});
