import { describe, it, expect } from "vitest";
import { calculateCable } from "../index";

describe("calculateCable (public API)", () => {
  it("returns invalid on bad input", () => {
    const r = calculateCable({
      currentA: 0,
      lengthM: 20,
      systemVoltage: 48,
      allowableDropPercent: 3,
      material: "copper",
      circuitType: "dc",
      installationMethod: "conduit",
    });
    expect(r.isValid).toBe(false);
    expect(r.errors.length).toBeGreaterThan(0);
  });

  it("sizes a battery cable for a 48 V / 40 A DC run", () => {
    const r = calculateCable({
      currentA: 40,
      lengthM: 10,
      systemVoltage: 48,
      allowableDropPercent: 2,
      material: "copper",
      circuitType: "dc",
      installationMethod: "conduit",
    });
    expect(r.isValid).toBe(true);
    expect(r.selectedAreaMm2).toBeGreaterThan(0);
    expect(r.actualDropPercent).toBeLessThanOrEqual(2);
  });

  it("respects high-temperature derating", () => {
    const r = calculateCable({
      currentA: 60,
      lengthM: 5,
      systemVoltage: 48,
      allowableDropPercent: 3,
      material: "copper",
      circuitType: "dc",
      installationMethod: "conduit",
      ambientTemperatureC: 50,
    });
    expect(r.isValid).toBe(true);
    expect(r.temperatureFactor).toBeLessThan(1);
  });

  it("sizes a three-phase AC run from an inverter", () => {
    const r = calculateCable({
      currentA: 25,
      lengthM: 40,
      systemVoltage: 400,
      allowableDropPercent: 3,
      material: "copper",
      circuitType: "ac-three-phase",
      installationMethod: "cable-tray",
    });
    expect(r.isValid).toBe(true);
    expect(r.actualDropPercent).toBeLessThanOrEqual(3);
  });
});
