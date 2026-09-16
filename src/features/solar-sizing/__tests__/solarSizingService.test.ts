import { describe, it, expect } from "vitest";
import {
  calculateSolarSizing,
  parseDraft,
  validateDraft,
} from "../services/solarSizingService";
import type { SolarSizingFormDraft } from "../types";

const baseDraft: SolarSizingFormDraft = {
  dailyEnergyKwh: "15",
  peakSunHours: "4.5",
  systemEfficiency: "0.75",
  designMargin: "0.25",
  panel: {
    name: "400 W mono",
    ratedPowerWatts: "400",
    vmp: "34",
    imp: "11.8",
    voc: "41",
    isc: "12.5",
  },
  maxSeriesPanels: "20",
  maxParallelStrings: "4",
  maxArrayVoc: "500",
  minArrayVmp: "120",
};

describe("parseDraft", () => {
  it("parses all numeric fields", () => {
    const parsed = parseDraft(baseDraft);
    expect(parsed.dailyEnergyKwh).toBe(15);
    expect(parsed.peakSunHours).toBe(4.5);
    expect(parsed.panel.ratedPowerWatts).toBe(400);
    expect(parsed.maxSeriesPanels).toBe(20);
  });

  it("omits optional fields when empty", () => {
    const parsed = parseDraft({
      ...baseDraft,
      maxSeriesPanels: "",
      maxParallelStrings: "",
      maxArrayVoc: "",
      minArrayVmp: "",
    });
    expect(parsed.maxSeriesPanels).toBeUndefined();
    expect(parsed.maxParallelStrings).toBeUndefined();
    expect(parsed.maxArrayVoc).toBeUndefined();
    expect(parsed.minArrayVmp).toBeUndefined();
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

  it("flags peak sun hours out of range", () => {
    expect(validateDraft({ ...baseDraft, peakSunHours: "30" })["peakSunHours"])
      .toBeDefined();
  });

  it("flags efficiency out of range", () => {
    expect(validateDraft({ ...baseDraft, systemEfficiency: "1.5" })["systemEfficiency"])
      .toBeDefined();
  });

  it("flags missing panel name", () => {
    const errs = validateDraft({
      ...baseDraft,
      panel: { ...baseDraft.panel, name: "" },
    });
    expect(errs["panel.name"]).toBeDefined();
  });

  it("flags non-positive panel fields", () => {
    const errs = validateDraft({
      ...baseDraft,
      panel: { ...baseDraft.panel, ratedPowerWatts: "0" },
    });
    expect(errs["panel.ratedPowerWatts"]).toBeDefined();
  });
});

describe("calculateSolarSizing (service → engine)", () => {
  it("returns a valid engine result for a well-formed draft", () => {
    const r = calculateSolarSizing(baseDraft);
    expect(r.isValid).toBe(true);
    expect(r.actualArrayKwp).toBeGreaterThan(0);
    expect(r.totalPanels).toBe(r.seriesPanels * r.parallelStrings);
  });

  it("passes engine errors through unchanged", () => {
    const bad: SolarSizingFormDraft = { ...baseDraft, peakSunHours: "0" };
    const r = calculateSolarSizing(bad);
    expect(r.isValid).toBe(false);
    expect(r.errors.length).toBeGreaterThan(0);
  });

  it("respects maxArrayVoc constraint", () => {
    const r = calculateSolarSizing({
      ...baseDraft,
      maxArrayVoc: "150",   // tight — forces short strings
    });
    expect(r.isValid).toBe(true);
    if (r.arrayVoc > 0) {
      expect(r.arrayVoc).toBeLessThanOrEqual(150);
    }
  });
});
