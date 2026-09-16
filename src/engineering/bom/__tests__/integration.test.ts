import { describe, it, expect } from "vitest";
import { calculateBom } from "../index";

describe("calculateBom (public API)", () => {
  it("returns invalid on missing project name", () => {
    const r = calculateBom({ projectName: "" });
    expect(r.isValid).toBe(false);
    expect(r.errors.length).toBeGreaterThan(0);
    expect(r.items).toEqual([]);
  });

  it("returns a complete BOM for a full system", () => {
    const r = calculateBom({
      projectName: "Off-grid home",
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
      ],
      protections: [
        {
          role: "battery-main",
          technology: "dc-breaker",
          selectedRatingA: 150,
          minimumVoltageRatingV: 58,
        },
      ],
    });

    expect(r.isValid).toBe(true);
    expect(r.errors).toEqual([]);
    expect(r.items.length).toBeGreaterThan(5);
    expect(r.categories.length).toBeGreaterThan(3);
    expect(r.totalQuantity).toBeGreaterThan(0);
  });

  it("works with only PV", () => {
    const r = calculateBom({
      projectName: "PV-only",
      pv: {
        arrayKwp: 2,
        panelRatedWatts: 400,
        seriesPanels: 5,
        parallelStrings: 1,
        totalPanels: 5,
        arrayVoc: 200,
        arrayIsc: 11,
        arrayImp: 10,
      },
    });
    expect(r.isValid).toBe(true);
    expect(r.items.some((i) => i.category === "pv-modules")).toBe(true);
    expect(r.items.some((i) => i.category === "pv-mounting")).toBe(true);
  });

  it("uses default reserve of 5%", () => {
    const r = calculateBom({
      projectName: "Test",
      pv: {
        arrayKwp: 4,
        panelRatedWatts: 400,
        seriesPanels: 10,
        parallelStrings: 1,
        totalPanels: 10,
        arrayVoc: 400,
        arrayIsc: 11,
        arrayImp: 10,
      },
    });
    const panels = r.items.find((i) => i.category === "pv-modules");
    // 10 × 1.05 = 10.5
    expect(panels?.quantity).toBe(10.5);
  });

  it("respects a custom reserve", () => {
    const r = calculateBom({
      projectName: "Test",
      reservePercent: 0.1,
      pv: {
        arrayKwp: 4,
        panelRatedWatts: 400,
        seriesPanels: 10,
        parallelStrings: 1,
        totalPanels: 10,
        arrayVoc: 400,
        arrayIsc: 11,
        arrayImp: 10,
      },
    });
    const panels = r.items.find((i) => i.category === "pv-modules");
    // 10 × 1.1 = 11
    expect(panels?.quantity).toBe(11);
  });
});
