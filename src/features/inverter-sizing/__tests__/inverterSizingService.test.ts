import { describe, it, expect } from "vitest";
import {
  calculateInverterSizing,
  parseDraft,
  validateDraft,
} from "../services/inverterSizingService";
import type { InverterSizingFormDraft } from "../types";

const baseDraft: InverterSizingFormDraft = {
  continuousLoadW: "3000",
  peakLoadW: "5000",
  surgeLoadW: "8000",
  systemVoltage: "48",
  outputVoltage: "230",
  outputFrequency: "50",
  powerFactor: "0.8",
  designMargin: "0.25",
  inverterEfficiency: "0.9",
  surgeDurationSec: "5",
  type: "pure-sine",
  topology: "hybrid",
  maxDcInputCurrentA: "200",
};

describe("parseDraft", () => {
  it("parses numeric fields", () => {
    const p = parseDraft(baseDraft);
    expect(p.continuousLoadW).toBe(3000);
    expect(p.peakLoadW).toBe(5000);
    expect(p.powerFactor).toBe(0.8);
    expect(p.surgeDurationSec).toBe(5);
    expect(p.maxDcInputCurrentA).toBe(200);
  });

  it("omits optional fields when empty", () => {
    const p = parseDraft({
      ...baseDraft,
      surgeDurationSec: "",
      maxDcInputCurrentA: "",
    });
    expect(p.surgeDurationSec).toBeUndefined();
    expect(p.maxDcInputCurrentA).toBeUndefined();
  });

  it("preserves classification fields", () => {
    const p = parseDraft({
      ...baseDraft,
      type: "modified-sine",
      topology: "off-grid",
    });
    expect(p.type).toBe("modified-sine");
    expect(p.topology).toBe("off-grid");
  });
});

describe("validateDraft (form-level)", () => {
  it("accepts a well-formed draft", () => {
    expect(validateDraft(baseDraft)).toEqual({});
  });

  it("flags non-positive continuous load", () => {
    expect(validateDraft({ ...baseDraft, continuousLoadW: "0" })["continuousLoadW"])
      .toBeDefined();
  });

  it("flags peak < continuous", () => {
    expect(validateDraft({ ...baseDraft, peakLoadW: "1000" })["peakLoadW"])
      .toBeDefined();
  });

  it("flags surge < peak", () => {
    expect(validateDraft({ ...baseDraft, surgeLoadW: "1000" })["surgeLoadW"])
      .toBeDefined();
  });

  it("flags invalid power factor", () => {
    expect(validateDraft({ ...baseDraft, powerFactor: "1.5" })["powerFactor"])
      .toBeDefined();
  });

  it("flags invalid efficiency", () => {
    expect(validateDraft({ ...baseDraft, inverterEfficiency: "0" })["inverterEfficiency"])
      .toBeDefined();
  });

  it("flags non-positive system voltage", () => {
    expect(validateDraft({ ...baseDraft, systemVoltage: "0" })["systemVoltage"])
      .toBeDefined();
  });

  it("flags non-positive output voltage", () => {
    expect(validateDraft({ ...baseDraft, outputVoltage: "0" })["outputVoltage"])
      .toBeDefined();
  });
});

describe("calculateInverterSizing (service → engine)", () => {
  it("returns a valid engine result for a well-formed draft", () => {
    const r = calculateInverterSizing(baseDraft);
    expect(r.isValid).toBe(true);
    expect(r.recommendedInverterVa).toBeGreaterThanOrEqual(r.minInverterVa);
    expect(r.dcInputCurrentA).toBeGreaterThan(0);
  });

  it("passes engine errors through unchanged", () => {
    const bad: InverterSizingFormDraft = {
      ...baseDraft,
      peakLoadW: "100",   // < continuous
    };
    const r = calculateInverterSizing(bad);
    expect(r.isValid).toBe(false);
    expect(r.errors.length).toBeGreaterThan(0);
  });

  it("surfaces DC current warning when limit exceeded", () => {
    const r = calculateInverterSizing({
      ...baseDraft,
      maxDcInputCurrentA: "50",   // design current is ~115 A
    });
    expect(r.isValid).toBe(true);
    expect(r.warnings.some((w) => /DC input/i.test(w))).toBe(true);
  });
});
