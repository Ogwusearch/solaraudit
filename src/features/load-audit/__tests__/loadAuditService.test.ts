import { describe, it, expect } from "vitest";
import {
  calculateLoadAudit,
  parseDraft,
  validateDraft,
} from "../services/loadAuditService";
import type { LoadAuditFormDraft } from "../types";

const baseDraft: LoadAuditFormDraft = {
  appliances: [
    { id: "a", name: "LED", powerWatts: "10", hoursPerDay: "5", quantity: "10", essential: false },
    { id: "b", name: "TV", powerWatts: "100", hoursPerDay: "4", quantity: "2", essential: false },
  ],
  diversityFactor: "0.8",
  safetyMargin: "0.1",
};

describe("parseDraft", () => {
  it("parses numeric strings into numbers", () => {
    const parsed = parseDraft(baseDraft);
    expect(parsed.appliances[0]!.powerWatts).toBe(10);
    expect(parsed.appliances[1]!.quantity).toBe(2);
    expect(parsed.diversityFactor).toBe(0.8);
    expect(parsed.safetyMargin).toBe(0.1);
  });

  it("defaults unparseable numbers to 0 or sensible values", () => {
    const bad: LoadAuditFormDraft = {
      appliances: [
        { id: "a", name: "X", powerWatts: "abc", hoursPerDay: "", quantity: "x", essential: false },
      ],
      diversityFactor: "",
      safetyMargin: "",
    };
    const parsed = parseDraft(bad);
    expect(parsed.appliances[0]!.powerWatts).toBe(0);
    expect(parsed.appliances[0]!.hoursPerDay).toBe(0);
    expect(parsed.appliances[0]!.quantity).toBe(0);
    expect(parsed.diversityFactor).toBe(1);
    expect(parsed.safetyMargin).toBe(0);
  });

  it("trims appliance names", () => {
    const draft: LoadAuditFormDraft = {
      ...baseDraft,
      appliances: [{ ...baseDraft.appliances[0]!, name: "  LED  " }],
    };
    const parsed = parseDraft(draft);
    expect(parsed.appliances[0]!.name).toBe("LED");
  });
});

describe("validateDraft (form-level)", () => {
  it("accepts a well-formed draft", () => {
    expect(validateDraft(baseDraft)).toEqual({});
  });

  it("flags empty appliance list", () => {
    const errs = validateDraft({ ...baseDraft, appliances: [] });
    expect(errs["appliances"]).toBeDefined();
  });

  it("flags missing name", () => {
    const errs = validateDraft({
      ...baseDraft,
      appliances: [{ ...baseDraft.appliances[0]!, name: "" }],
    });
    expect(errs["appliances.0.name"]).toBeDefined();
  });

  it("flags non-positive power", () => {
    const errs = validateDraft({
      ...baseDraft,
      appliances: [{ ...baseDraft.appliances[0]!, powerWatts: "0" }],
    });
    expect(errs["appliances.0.powerWatts"]).toBeDefined();
  });

  it("flags hours outside 0..24", () => {
    const errs = validateDraft({
      ...baseDraft,
      appliances: [{ ...baseDraft.appliances[0]!, hoursPerDay: "30" }],
    });
    expect(errs["appliances.0.hoursPerDay"]).toBeDefined();
  });

  it("flags quantity < 1", () => {
    const errs = validateDraft({
      ...baseDraft,
      appliances: [{ ...baseDraft.appliances[0]!, quantity: "0" }],
    });
    expect(errs["appliances.0.quantity"]).toBeDefined();
  });

  it("flags diversity factor out of range", () => {
    const errs = validateDraft({ ...baseDraft, diversityFactor: "1.5" });
    expect(errs["diversityFactor"]).toBeDefined();
  });

  it("flags negative safety margin", () => {
    const errs = validateDraft({ ...baseDraft, safetyMargin: "-0.1" });
    expect(errs["safetyMargin"]).toBeDefined();
  });
});

describe("calculateLoadAudit (service → engine)", () => {
  it("returns a valid engine result for a well-formed draft", () => {
    const r = calculateLoadAudit(baseDraft);
    expect(r.isValid).toBe(true);
    expect(r.totalDailyEnergyKwh).toBeGreaterThan(0);
    expect(r.peakLoadKw).toBeGreaterThan(0);
  });

  it("passes engine-level errors through unchanged", () => {
    const bad: LoadAuditFormDraft = {
      ...baseDraft,
      appliances: [{ ...baseDraft.appliances[0]!, powerWatts: "0" }],
    };
    const r = calculateLoadAudit(bad);
    expect(r.isValid).toBe(false);
    expect(r.errors.length).toBeGreaterThan(0);
  });

  it("surfaces engine warnings", () => {
    const draft: LoadAuditFormDraft = {
      ...baseDraft,
      diversityFactor: "0.3",
    };
    const r = calculateLoadAudit(draft);
    expect(r.warnings.some((w) => /diversity/i.test(w))).toBe(true);
  });
});
