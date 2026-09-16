import { describe, it, expect } from "vitest";
import { validateInput } from "../validation";
import {
  ERROR_INVALID_VALUE,
  errorUnknownUnit,
  ERROR_POWER_FACTOR_OUT_OF_RANGE,
  ERROR_SYSTEM_VOLTAGE_OUT_OF_RANGE,
} from "../errors";

describe("validateInput", () => {
  it("accepts a simple same-dimension input", () => {
    expect(validateInput({ value: 1, from: "m", to: "mm" })).toEqual([]);
  });

  it("rejects NaN value", () => {
    expect(validateInput({ value: NaN, from: "m", to: "mm" }))
      .toContain(ERROR_INVALID_VALUE);
  });

  it("rejects Infinity value", () => {
    expect(validateInput({ value: Infinity, from: "m", to: "mm" }))
      .toContain(ERROR_INVALID_VALUE);
  });

  it("rejects unknown from-unit", () => {
    const errs = validateInput({ value: 1, from: "furlong" as never, to: "m" });
    expect(errs.some((e) => e.includes("furlong"))).toBe(true);
  });

  it("rejects unknown to-unit", () => {
    const errs = validateInput({ value: 1, from: "m", to: "furlong" as never });
    expect(errs.some((e) => e.includes("furlong"))).toBe(true);
  });

  it("rejects powerFactor > 1", () => {
    const errs = validateInput({
      value: 1000, from: "VA", to: "W", powerFactor: 1.5,
    });
    expect(errs).toContain(ERROR_POWER_FACTOR_OUT_OF_RANGE);
  });

  it("rejects powerFactor <= 0", () => {
    const errs = validateInput({
      value: 1000, from: "VA", to: "W", powerFactor: 0,
    });
    expect(errs).toContain(ERROR_POWER_FACTOR_OUT_OF_RANGE);
  });

  it("rejects systemVoltage <= 0", () => {
    const errs = validateInput({
      value: 100, from: "Ah", to: "Wh", systemVoltage: 0,
    });
    expect(errs).toContain(ERROR_SYSTEM_VOLTAGE_OUT_OF_RANGE);
  });

  it("accepts negative values (temperatures)", () => {
    expect(validateInput({ value: -40, from: "degC", to: "degF" })).toEqual([]);
  });
});
