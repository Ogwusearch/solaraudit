import { describe, it, expect } from "vitest";
import { convertUnit } from "../index";

describe("convertUnit (public API)", () => {
  it("returns invalid on NaN input", () => {
    const r = convertUnit({ value: NaN, from: "m", to: "mm" });
    expect(r.isValid).toBe(false);
    expect(r.errors.length).toBeGreaterThan(0);
  });

  it("converts same-dimension values cleanly", () => {
    const r = convertUnit({ value: 5, from: "kWh", to: "Wh" });
    expect(r.isValid).toBe(true);
    expect(r.errors).toEqual([]);
    expect(r.value).toBe(5000);
    expect(r.fromDimension).toBe("energy");
    expect(r.toDimension).toBe("energy");
  });

  it("converts temperature correctly", () => {
    const r = convertUnit({ value: 25, from: "degC", to: "degF" });
    expect(r.isValid).toBe(true);
    expect(r.value).toBeCloseTo(77, 9);
  });

  it("converts VA → W with power factor", () => {
    const r = convertUnit({
      value: 5000, from: "VA", to: "W", powerFactor: 0.9,
    });
    expect(r.isValid).toBe(true);
    expect(r.value).toBeCloseTo(4500, 9);
    expect(r.fromDimension).toBe("apparent-power");
    expect(r.toDimension).toBe("power");
  });

  it("converts Ah → kWh with system voltage", () => {
    const r = convertUnit({
      value: 200, from: "Ah", to: "kWh", systemVoltage: 48,
    });
    expect(r.isValid).toBe(true);
    expect(r.value).toBeCloseTo(9.6, 9);
  });

  it("reports incompatible pairs as invalid", () => {
    const r = convertUnit({ value: 10, from: "V", to: "m" });
    expect(r.isValid).toBe(false);
    expect(r.errors.some((e) => /incompatible/i.test(e))).toBe(true);
  });

  it("missing power factor is reported, not silently zero", () => {
    const r = convertUnit({ value: 1000, from: "W", to: "VA" });
    expect(r.isValid).toBe(false);
    expect(r.errors.some((e) => /powerFactor/i.test(e))).toBe(true);
  });

  it("missing system voltage is reported, not silently zero", () => {
    const r = convertUnit({ value: 1000, from: "Wh", to: "Ah" });
    expect(r.isValid).toBe(false);
    expect(r.errors.some((e) => /systemVoltage/i.test(e))).toBe(true);
  });

  it("identity conversion is valid but warns", () => {
    const r = convertUnit({ value: 42, from: "W", to: "W" });
    expect(r.isValid).toBe(true);
    expect(r.value).toBe(42);
    expect(r.warnings.length).toBeGreaterThan(0);
  });

  it("cross-check: 1 kW at unity PF = 1 kVA", () => {
    const r = convertUnit({
      value: 1, from: "kW", to: "kVA", powerFactor: 1,
    });
    expect(r.value).toBe(1);
  });

  it("cross-check: 10 kWh at 48 V ≈ 208.33 Ah", () => {
    const r = convertUnit({
      value: 10, from: "kWh", to: "Ah", systemVoltage: 48,
    });
    expect(r.value).toBeCloseTo(208.333, 2);
  });
});
