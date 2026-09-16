import { describe, it, expect } from "vitest";
import { validateInput } from "../validation";
import {
  ERROR_NO_PROJECT_NAME,
  ERROR_INVALID_PANEL_POWER,
  ERROR_INVALID_PANEL_COUNT,
  ERROR_INVALID_BATTERY_CELL_VOLTAGE,
  ERROR_INVALID_INVERTER_VA,
  ERROR_INVALID_RESERVE_PERCENT,
} from "../errors";

const base = { projectName: "Test site" };

describe("validateInput", () => {
  it("accepts a minimal valid input", () => {
    expect(validateInput(base)).toEqual([]);
  });

  it("rejects missing project name", () => {
    expect(validateInput({ projectName: "" }))
      .toContain(ERROR_NO_PROJECT_NAME);
  });

  it("rejects bad panel power", () => {
    const errs = validateInput({
      ...base,
      pv: {
        arrayKwp: 4,
        panelRatedWatts: 0,
        seriesPanels: 10,
        parallelStrings: 1,
        totalPanels: 10,
        arrayVoc: 400,
        arrayIsc: 11,
        arrayImp: 10,
      },
    });
    expect(errs).toContain(ERROR_INVALID_PANEL_POWER);
  });

  it("rejects non-integer panel count", () => {
    const errs = validateInput({
      ...base,
      pv: {
        arrayKwp: 4,
        panelRatedWatts: 400,
        seriesPanels: 10,
        parallelStrings: 1,
        totalPanels: 10.5,
        arrayVoc: 400,
        arrayIsc: 11,
        arrayImp: 10,
      },
    });
    expect(errs).toContain(ERROR_INVALID_PANEL_COUNT);
  });

  it("rejects bad battery cell voltage", () => {
    const errs = validateInput({
      ...base,
      battery: {
        technology: "lifepo4",
        cellVoltage: 0,
        cellCapacityAh: 100,
        seriesCells: 4,
        parallelStrings: 1,
        totalCells: 4,
        bankVoltage: 48,
        bankCapacityAh: 100,
      },
    });
    expect(errs).toContain(ERROR_INVALID_BATTERY_CELL_VOLTAGE);
  });

  it("rejects bad inverter VA", () => {
    const errs = validateInput({
      ...base,
      inverter: {
        recommendedVa: 0,
        systemVoltage: 48,
        outputVoltage: 230,
        outputFrequency: 50,
      },
    });
    expect(errs).toContain(ERROR_INVALID_INVERTER_VA);
  });

  it("rejects bad reserve percent", () => {
    expect(validateInput({ ...base, reservePercent: 0.8 }))
      .toContain(ERROR_INVALID_RESERVE_PERCENT);
  });

  it("collects multiple errors", () => {
    const errs = validateInput({
      projectName: "",
      reservePercent: 1,
    });
    expect(errs.length).toBeGreaterThanOrEqual(2);
  });
});
