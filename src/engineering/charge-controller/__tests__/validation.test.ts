import { describe, it, expect } from "vitest";
import { validateInput } from "../validation";
import {
  ERROR_INVALID_ARRAY_POWER,
  ERROR_INVALID_BATTERY_VOLTAGE,
  ERROR_INVALID_TECHNOLOGY,
  ERROR_INVALID_MAX_PV_VOLTAGE,
} from "../errors";

const base = {
  pvArrayKwp: 5,
  pvVmp: 136,
  pvVoc: 164,
  pvImp: 36.8,
  pvIsc: 39,
  batteryVoltage: 48,
  batteryCapacityAh: 200,
  technology: "mppt" as const,
  designMargin: 0.25,
  controllerEfficiency: 0.95,
};

describe("validateInput", () => {
  it("accepts a valid input", () => {
    expect(validateInput(base)).toEqual([]);
  });

  it("rejects zero array power", () => {
    expect(validateInput({ ...base, pvArrayKwp: 0 }))
      .toContain(ERROR_INVALID_ARRAY_POWER);
  });

  it("rejects bad battery voltage", () => {
    expect(validateInput({ ...base, batteryVoltage: 0 }))
      .toContain(ERROR_INVALID_BATTERY_VOLTAGE);
  });

  it("rejects invalid technology", () => {
    expect(validateInput({ ...base, technology: "bogus" as never }))
      .toContain(ERROR_INVALID_TECHNOLOGY);
  });

  it("rejects bad maxPvInputVoltage", () => {
    expect(validateInput({ ...base, maxPvInputVoltage: 0 }))
      .toContain(ERROR_INVALID_MAX_PV_VOLTAGE);
  });

  it("collects multiple errors", () => {
    const errs = validateInput({
      ...base,
      pvArrayKwp: 0,
      batteryVoltage: 0,
      controllerEfficiency: 0,
    });
    expect(errs.length).toBeGreaterThanOrEqual(3);
  });
});
