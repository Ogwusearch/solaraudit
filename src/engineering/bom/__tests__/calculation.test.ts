import { describe, it, expect } from "vitest";
import { calculateInternal } from "../calculation";
import type { BomInput } from "../types";

const baseInput: BomInput = {
  projectName: "Home 5 kWp",
  pv: {
    arrayKwp: 4.4,
    panelRatedWatts: 400,
    seriesPanels: 11,
    parallelStrings: 1,
    totalPanels: 11,
    arrayVoc: 451,
    arrayIsc: 11,
    arrayImp: 10,
  },
  battery: {
    technology: "lifepo4",
    cellVoltage: 12,
    cellCapacityAh: 100,
    seriesCells: 4,
    parallelStrings: 2,
    totalCells: 8,
    bankVoltage: 48,
    bankCapacityAh: 200,
  },
  inverter: {
    recommendedVa: 5000,
    systemVoltage: 48,
    outputVoltage: 230,
    outputFrequency: 50,
  },
  chargeController: {
    technology: "mppt",
    recommendedCurrentA: 100,
    maxPvInputVoltage: 500,
  },
  cables: [
    {
      role: "battery-main",
      selectedAreaMm2: 35,
      lengthM: 3,
      conductorMaterial: "copper",
    },
    {
      role: "pv-string-1",
      selectedAreaMm2: 6,
      lengthM: 15,
      conductorMaterial: "copper",
    },
  ],
  protections: [
    {
      role: "battery-main",
      technology: "dc-breaker",
      selectedRatingA: 150,
      minimumVoltageRatingV: 58,
    },
    {
      role: "pv-string-1",
      technology: "fuse",
      selectedRatingA: 20,
      minimumVoltageRatingV: 500,
    },
  ],
};

describe("calculateInternal", () => {
  it("produces a non-empty item list", () => {
    const r = calculateInternal(baseInput);
    expect(r.items.length).toBeGreaterThan(0);
    expect(r.itemCount).toBe(r.items.length);
  });

  it("includes PV modules with quantity = total panels + reserve", () => {
    const r = calculateInternal(baseInput);
    const panels = r.items.find((i) => i.category === "pv-modules");
    // 11 panels × 1.05 reserve = 11.55 -> ceil to 2dp = 11.55
    expect(panels?.quantity).toBeGreaterThanOrEqual(11);
    expect(panels?.unit).toBe("pcs");
  });

  it("includes battery cells with totalCells + reserve", () => {
    const r = calculateInternal(baseInput);
    const cells = r.items.find((i) => i.category === "batteries");
    expect(cells?.quantity).toBeGreaterThanOrEqual(8);
  });

  it("includes inverter, controller", () => {
    const r = calculateInternal(baseInput);
    expect(r.items.some((i) => i.category === "inverter")).toBe(true);
    expect(r.items.some((i) => i.category === "charge-controller")).toBe(true);
  });

  it("includes cable runs with allowance applied", () => {
    const r = calculateInternal(baseInput);
    const batteryCable = r.items.find(
      (i) => i.category === "battery-cables" && i.description.includes("battery-main"),
    );
    // 3 m + 2 m allowance = 5 m × 2 (go + return) = 10 m, × 1.05 reserve = 10.5
    expect(batteryCable?.quantity).toBeGreaterThanOrEqual(10);
  });

  it("includes protection devices with correct category mapping", () => {
    const r = calculateInternal(baseInput);
    expect(r.items.some((i) => i.category === "dc-breakers")).toBe(true);
    expect(r.items.some((i) => i.category === "dc-fuses")).toBe(true);
  });

  it("includes earthing by default", () => {
    const r = calculateInternal(baseInput);
    expect(r.items.some((i) => i.category === "earthing")).toBe(true);
  });

  it("includes SPD by default", () => {
    const r = calculateInternal(baseInput);
    expect(r.items.some((i) => i.category === "spd")).toBe(true);
  });

  it("includes monitoring when requested", () => {
    const without = calculateInternal(baseInput);
    const withM = calculateInternal({ ...baseInput, includeMonitoring: true });
    const withoutCount = without.items.filter((i) => i.category === "monitoring").length;
    const withCount = withM.items.filter((i) => i.category === "monitoring").length;
    expect(withoutCount).toBe(0);
    expect(withCount).toBeGreaterThan(0);
  });

  it("earthing can be disabled", () => {
    const r = calculateInternal({ ...baseInput, includeEarthing: false });
    expect(r.items.some((i) => i.category === "earthing")).toBe(false);
  });

  it("SPD can be disabled", () => {
    const r = calculateInternal({ ...baseInput, includeSpd: false });
    expect(r.items.some((i) => i.category === "spd")).toBe(false);
  });

  it("emits a warning when no mounting type is provided", () => {
    const r = calculateInternal(baseInput);
    expect(r.warnings.some((w) => /mountingType/i.test(w))).toBe(true);
  });

  it("emits a warning when PWM controller is used", () => {
    const r = calculateInternal({
      ...baseInput,
      chargeController: { ...baseInput.chargeController!, technology: "pwm" },
    });
    expect(r.warnings.some((w) => /PWM/i.test(w))).toBe(true);
  });

  it("emits presence warnings when components are missing", () => {
    const r = calculateInternal({ projectName: "Minimal" });
    expect(r.warnings.length).toBeGreaterThan(0);
    expect(r.items.length).toBeGreaterThanOrEqual(0);
  });

  it("categories list is sorted and unique", () => {
    const r = calculateInternal(baseInput);
    const sorted = [...r.categories].sort();
    expect(r.categories).toEqual(sorted);
    expect(new Set(r.categories).size).toBe(r.categories.length);
  });
});
