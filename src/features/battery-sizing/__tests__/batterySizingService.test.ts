import { describe, it, expect } from "vitest";
import {
  calculateBatterySizing,
  parseDraft,
  validateDraft,
} from "../services/batterySizingService";
import type { BatterySizingFormDraft } from "../types";

const baseDraft: BatterySizingFormDraft = {
  dailyEnergyKwh: "10",
  autonomyDays: "1",
  systemVoltage: "48",
  designMargin: "0.1",
  temperatureDerating: "0.85",
  maxDepthOfDischarge: "0.8",
  roundTripEfficiency: "0.9",
  cell: {
    name: "LFP 12 V 100 Ah",
    technology: "lifepo4",
    nominalVoltage: "12",
    capacityAh: "100",
    maxDepthOfDischarge: "0.9",
    roundTripEfficiency: "0.95",
    maxChargeCurrentA: "50",
  },
  maxParallelStrings: "",
};

describe("parseDraft", () => {
  it("parses numeric fields", () => {
    const p = parseDraft(baseDraft);
    expect(p.dailyEnergyKwh).toBe(10);
    expect(p.autonomyDays).toBe(1);
    expect(p.systemVoltage).toBe(48);
    expect(p.cell.capacityAh).toBe(100);
    expect(p.cell.maxChargeCurrentA).toBe(50);
  });

  it("omits optional fields when empty", () => {
    const p = parseDraft({ ...baseDraft, maxParallelStrings: "" });
    expect(p.maxParallelStrings).toBeUndefined();
  });

  it("omits maxChargeCurrentA when empty", () => {
    const p = parseDraft({
      ...baseDraft,
      cell: { ...baseDraft.cell, maxChargeCurrentA: "" },
    });
    expect(p.cell.maxChargeCurrentA).toBeUndefined();
  });

  it("preserves technology", () => {
    const p = parseDraft(baseDraft);
    expect(p.cell.technology).toBe("lifepo4");
  });
});

describe("validateDraft (form-level)", () => {
  it("accepts a well-formed draft", () => {
    expect(validateDraft(baseDraft)).toEqual({});
  });

  it("flags missing daily energy", () => {
    expect(validateDraft({ ...baseDraft, dailyEnergyKwh: "" })["dailyEnergyKwh"])
      .toBeDefined();
  });

  it("flags negative autonomy", () => {
    expect(validateDraft({ ...baseDraft, autonomyDays: "-1" })["autonomyDays"])
      .toBeDefined();
  });

  it("flags non-positive system voltage", () => {
    expect(validateDraft({ ...baseDraft, systemVoltage: "0" })["systemVoltage"])
      .toBeDefined();
  });

  it("flags invalid temperature derating", () => {
    expect(validateDraft({ ...baseDraft, temperatureDerating: "1.5" })["temperatureDerating"])
      .toBeDefined();
  });

  it("flags invalid DoD", () => {
    expect(validateDraft({ ...baseDraft, maxDepthOfDischarge: "0" })["maxDepthOfDischarge"])
      .toBeDefined();
  });

  it("flags missing cell name", () => {
    const errs = validateDraft({
      ...baseDraft,
      cell: { ...baseDraft.cell, name: "" },
    });
    expect(errs["cell.name"]).toBeDefined();
  });

  it("flags non-positive cell voltage", () => {
    const errs = validateDraft({
      ...baseDraft,
      cell: { ...baseDraft.cell, nominalVoltage: "0" },
    });
    expect(errs["cell.nominalVoltage"]).toBeDefined();
  });

  it("flags non-positive cell capacity", () => {
    const errs = validateDraft({
      ...baseDraft,
      cell: { ...baseDraft.cell, capacityAh: "0" },
    });
    expect(errs["cell.capacityAh"]).toBeDefined();
  });
});

describe("calculateBatterySizing (service → engine)", () => {
  it("returns a valid engine result for a well-formed draft", () => {
    const r = calculateBatterySizing(baseDraft);
    expect(r.isValid).toBe(true);
    expect(r.bankVoltage).toBe(48);
    expect(r.actualInstalledKwh).toBeGreaterThan(0);
    expect(r.totalCells).toBe(r.seriesCells * r.parallelStrings);
  });

  it("passes engine errors through unchanged", () => {
    const bad: BatterySizingFormDraft = {
      ...baseDraft,
      systemVoltage: "50",   // not a multiple of 12
    };
    const r = calculateBatterySizing(bad);
    expect(r.isValid).toBe(false);
    expect(r.errors.length).toBeGreaterThan(0);
  });

  it("respects maxParallelStrings cap and warns", () => {
    const r = calculateBatterySizing({
      ...baseDraft,
      maxParallelStrings: "1",
    });
    expect(r.parallelStrings).toBe(1);
    expect(r.warnings.length).toBeGreaterThan(0);
  });
});
