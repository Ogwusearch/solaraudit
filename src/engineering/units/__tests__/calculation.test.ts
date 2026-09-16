import { describe, it, expect } from "vitest";
import { calculateInternal } from "../calculation";
import type { ConversionInput } from "../types";

describe("calculateInternal — length", () => {
  it("1 m = 1000 mm", () => {
    const r = calculateInternal({ value: 1, from: "m", to: "mm" });
    expect(r.value).toBe(1000);
  });

  it("1 m = 100 cm", () => {
    const r = calculateInternal({ value: 1, from: "m", to: "cm" });
    expect(r.value).toBe(100);
  });

  it("1 in = 25.4 mm (exact)", () => {
    const r = calculateInternal({ value: 1, from: "in", to: "mm" });
    expect(r.value).toBeCloseTo(25.4, 9);
  });

  it("1 ft = 0.3048 m (exact)", () => {
    const r = calculateInternal({ value: 1, from: "ft", to: "m" });
    expect(r.value).toBeCloseTo(0.3048, 9);
  });

  it("1000 m = 1 km", () => {
    const r = calculateInternal({ value: 1000, from: "m", to: "km" });
    expect(r.value).toBe(1);
  });
});

describe("calculateInternal — temperature (affine)", () => {
  it("0 degC = 32 degF", () => {
    const r = calculateInternal({ value: 0, from: "degC", to: "degF" });
    expect(r.value).toBeCloseTo(32, 9);
  });

  it("100 degC = 212 degF", () => {
    const r = calculateInternal({ value: 100, from: "degC", to: "degF" });
    expect(r.value).toBeCloseTo(212, 9);
  });

  it("0 degC = 273.15 K", () => {
    const r = calculateInternal({ value: 0, from: "degC", to: "K" });
    expect(r.value).toBeCloseTo(273.15, 9);
  });

  it("-40 degC = -40 degF", () => {
    const r = calculateInternal({ value: -40, from: "degC", to: "degF" });
    expect(r.value).toBeCloseTo(-40, 9);
  });

  it("round-trips: 25 degC → degF → degC", () => {
    const f = calculateInternal({ value: 25, from: "degC", to: "degF" }).value;
    const c = calculateInternal({ value: f, from: "degF", to: "degC" }).value;
    expect(c).toBeCloseTo(25, 9);
  });
});

describe("calculateInternal — power", () => {
  it("1 kW = 1000 W", () => {
    expect(calculateInternal({ value: 1, from: "kW", to: "W" }).value).toBe(1000);
  });

  it("1 MW = 1000 kW", () => {
    expect(calculateInternal({ value: 1, from: "MW", to: "kW" }).value).toBe(1000);
  });

  it("1 hp ≈ 745.7 W", () => {
    const r = calculateInternal({ value: 1, from: "hp", to: "W" });
    expect(r.value).toBeCloseTo(745.699872, 5);
  });
});

describe("calculateInternal — apparent power", () => {
  it("1 kVA = 1000 VA", () => {
    expect(calculateInternal({ value: 1, from: "kVA", to: "VA" }).value).toBe(1000);
  });
});

describe("calculateInternal — energy", () => {
  it("1 kWh = 1000 Wh", () => {
    expect(calculateInternal({ value: 1, from: "kWh", to: "Wh" }).value).toBe(1000);
  });

  it("1 kWh = 3.6e6 J", () => {
    expect(calculateInternal({ value: 1, from: "kWh", to: "J" }).value).toBeCloseTo(3.6e6, 3);
  });

  it("1 BTU ≈ 0.293 Wh", () => {
    const r = calculateInternal({ value: 1, from: "BTU", to: "Wh" });
    expect(r.value).toBeCloseTo(0.29307107, 6);
  });
});

describe("calculateInternal — charge", () => {
  it("1 Ah = 1000 mAh", () => {
    expect(calculateInternal({ value: 1, from: "Ah", to: "mAh" }).value).toBe(1000);
  });

  it("3600 C = 1 Ah", () => {
    const r = calculateInternal({ value: 3600, from: "C", to: "Ah" });
    expect(r.value).toBeCloseTo(1, 9);
  });
});

describe("calculateInternal — voltage / current / resistance / frequency", () => {
  it("1 kV = 1000 V", () => {
    expect(calculateInternal({ value: 1, from: "kV", to: "V" }).value).toBe(1000);
  });
  it("1 A = 1000 mA", () => {
    expect(calculateInternal({ value: 1, from: "A", to: "mA" }).value).toBe(1000);
  });
  it("1 kOhm = 1000 Ohm", () => {
    expect(calculateInternal({ value: 1, from: "kOhm", to: "Ohm" }).value).toBe(1000);
  });
  it("1 MHz = 1000 kHz", () => {
    expect(calculateInternal({ value: 1, from: "MHz", to: "kHz" }).value).toBe(1000);
  });
});

describe("calculateInternal — cross-dimension", () => {
  it("1000 VA at PF=0.8 = 800 W", () => {
    const r = calculateInternal({
      value: 1000, from: "VA", to: "W", powerFactor: 0.8,
    });
    expect(r.value).toBeCloseTo(800, 9);
  });

  it("800 W at PF=0.8 = 1000 VA", () => {
    const r = calculateInternal({
      value: 800, from: "W", to: "VA", powerFactor: 0.8,
    });
    expect(r.value).toBeCloseTo(1000, 9);
  });

  it("1000 kW at PF=1 = 1000 kVA", () => {
    const r = calculateInternal({
      value: 1000, from: "kW", to: "kVA", powerFactor: 1,
    });
    expect(r.value).toBeCloseTo(1000, 9);
  });

  it("100 Ah at 48 V = 4800 Wh", () => {
    const r = calculateInternal({
      value: 100, from: "Ah", to: "Wh", systemVoltage: 48,
    });
    expect(r.value).toBeCloseTo(4800, 9);
  });

  it("4800 Wh at 48 V = 100 Ah", () => {
    const r = calculateInternal({
      value: 4800, from: "Wh", to: "Ah", systemVoltage: 48,
    });
    expect(r.value).toBeCloseTo(100, 9);
  });

  it("4.8 kWh at 48 V = 100 Ah", () => {
    const r = calculateInternal({
      value: 4.8, from: "kWh", to: "Ah", systemVoltage: 48,
    });
    expect(r.value).toBeCloseTo(100, 9);
  });

  it("requires powerFactor for W ↔ VA", () => {
    const r = calculateInternal({ value: 1000, from: "W", to: "VA" });
    expect(r.isValid).toBe(false);
    expect(r.errors.length).toBeGreaterThan(0);
  });

  it("requires systemVoltage for Wh ↔ Ah", () => {
    const r = calculateInternal({ value: 1000, from: "Wh", to: "Ah" });
    expect(r.isValid).toBe(false);
    expect(r.errors.length).toBeGreaterThan(0);
  });

  it("rejects incompatible pairs", () => {
    const r = calculateInternal({ value: 1, from: "V", to: "A" });
    expect(r.isValid).toBe(false);
  });

  it("rejects length → power", () => {
    const r = calculateInternal({ value: 1, from: "m", to: "W" });
    expect(r.isValid).toBe(false);
  });
});

describe("calculateInternal — warnings", () => {
  it("warns on identity conversion", () => {
    const r = calculateInternal({ value: 5, from: "m", to: "m" });
    expect(r.value).toBe(5);
    expect(r.warnings.some((w) => /identical/i.test(w))).toBe(true);
  });

  it("warns on hp conversion", () => {
    const r = calculateInternal({ value: 1, from: "hp", to: "W" });
    expect(r.warnings.some((w) => /horsepower/i.test(w))).toBe(true);
  });

  it("warns on low power factor", () => {
    const r = calculateInternal({
      value: 1000, from: "VA", to: "W", powerFactor: 0.3,
    });
    expect(r.warnings.some((w) => /power factor/i.test(w))).toBe(true);
  });
});
