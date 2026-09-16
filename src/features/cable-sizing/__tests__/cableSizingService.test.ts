import { describe, it, expect } from "vitest";
import {
  calculateCableSizing,
  parseDraft,
  validateDraft,
} from "../services/cableSizingService";
import type { CableSizingFormDraft } from "../types";

const baseDraft: CableSizingFormDraft = {
  currentA: "40",
  lengthM: "20",
  systemVoltage: "48",
  allowableDropPercent: "3",
  material: "copper",
  circuitType: "dc",
  installationMethod: "conduit",
  ambientTemperatureC: "30",
  conductorTempC: "70",
  groupingCount: "1",
  designMargin: "",
};

describe("parseDraft", () => {
  it("parses numeric fields", () => {
    const p = parseDraft(baseDraft);
    expect(p.currentA).toBe(40);
    expect(p.lengthM).toBe(20);
    expect(p.systemVoltage).toBe(48);
    expect(p.allowableDropPercent).toBe(3);
    expect(p.ambientTemperatureC).toBe(30);
    expect(p.groupingCount).toBe(1);
  });

  it("omits optional fields when empty", () => {
    const p = parseDraft({
      ...baseDraft,
      ambientTemperatureC: "",
      conductorTempC: "",
      groupingCount: "",
      designMargin: "",
    });
    expect(p.ambientTemperatureC).toBeUndefined();
    expect(p.conductorTempC).toBeUndefined();
    expect(p.groupingCount).toBeUndefined();
    expect(p.designMargin).toBeUndefined();
  });

  it("preserves classification selects", () => {
    const p = parseDraft({
      ...baseDraft,
      material: "aluminium",
      circuitType: "ac-three-phase",
      installationMethod: "buried",
    });
    expect(p.material).toBe("aluminium");
    expect(p.circuitType).toBe("ac-three-phase");
    expect(p.installationMethod).toBe("buried");
  });
});

describe("validateDraft (form-level)", () => {
  it("accepts a well-formed draft", () => {
    expect(validateDraft(baseDraft)).toEqual({});
  });

  it("flags non-positive current", () => {
    expect(validateDraft({ ...baseDraft, currentA: "0" })["currentA"])
      .toBeDefined();
  });

  it("flags non-positive length", () => {
    expect(validateDraft({ ...baseDraft, lengthM: "0" })["lengthM"])
      .toBeDefined();
  });

  it("flags non-positive system voltage", () => {
    expect(validateDraft({ ...baseDraft, systemVoltage: "0" })["systemVoltage"])
      .toBeDefined();
  });

  it("flags non-positive allowable drop", () => {
    expect(validateDraft({ ...baseDraft, allowableDropPercent: "0" })
      ["allowableDropPercent"]).toBeDefined();
  });

  it("flags out-of-range ambient temperature", () => {
    expect(validateDraft({ ...baseDraft, ambientTemperatureC: "100" })
      ["ambientTemperatureC"]).toBeDefined();
  });

  it("flags out-of-range conductor temperature", () => {
    expect(validateDraft({ ...baseDraft, conductorTempC: "10" })
      ["conductorTempC"]).toBeDefined();
  });

  it("flags bad grouping count", () => {
    expect(validateDraft({ ...baseDraft, groupingCount: "0" })
      ["groupingCount"]).toBeDefined();
  });

  it("does not flag empty optional fields", () => {
    const errs = validateDraft({
      ...baseDraft,
      ambientTemperatureC: "",
      conductorTempC: "",
      groupingCount: "",
      designMargin: "",
    });
    expect(errs).toEqual({});
  });
});

describe("calculateCableSizing (service → engine)", () => {
  it("returns a valid engine result for a well-formed draft", () => {
    const r = calculateCableSizing(baseDraft);
    expect(r.isValid).toBe(true);
    expect(r.selectedAreaMm2).toBeGreaterThan(0);
    expect(r.actualDropPercent).toBeLessThanOrEqual(
      baseDraft.allowableDropPercent ? Number(baseDraft.allowableDropPercent) : 0,
    );
  });

  it("passes engine errors through unchanged", () => {
    const bad: CableSizingFormDraft = { ...baseDraft, currentA: "0" };
    const r = calculateCableSizing(bad);
    expect(r.isValid).toBe(false);
    expect(r.errors.length).toBeGreaterThan(0);
  });

  it("aluminium requires larger area than copper", () => {
    const cu = calculateCableSizing(baseDraft);
    const al = calculateCableSizing({ ...baseDraft, material: "aluminium" });
    expect(al.calculatedAreaMm2).toBeGreaterThan(cu.calculatedAreaMm2);
  });

  it("three-phase uses a smaller factor than DC for the same current", () => {
    const dc = calculateCableSizing(baseDraft);
    const tp = calculateCableSizing({
      ...baseDraft,
      circuitType: "ac-three-phase",
    });
    expect(tp.calculatedAreaMm2).toBeLessThan(dc.calculatedAreaMm2);
  });

  it("high ambient temperature reduces ampacity", () => {
    const r = calculateCableSizing({
      ...baseDraft,
      ambientTemperatureC: "50",
    });
    expect(r.temperatureFactor).toBeLessThan(1);
  });

  it("surfaces voltage-drop-dominant warning on long, low-current runs", () => {
    const r = calculateCableSizing({
      ...baseDraft,
      currentA: "5",
      lengthM: "200",
    });
    expect(r.warnings.some((w) => /voltage drop/i.test(w))).toBe(true);
  });
});
