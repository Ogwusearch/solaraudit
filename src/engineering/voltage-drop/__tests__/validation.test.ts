import { describe, it, expect } from "vitest";
import { validateInput } from "../validation";
import {
  ERROR_INVALID_CURRENT,
  ERROR_INVALID_LENGTH,
  ERROR_INVALID_VOLTAGE,
  ERROR_INVALID_MATERIAL,
  ERROR_INVALID_CIRCUIT_TYPE,
  ERROR_INVALID_AREA,
  ERROR_INVALID_TARGET_DROP,
  ERROR_INVALID_POWER_FACTOR,
  ERROR_INVALID_REACTANCE,
  ERROR_NO_MODE,
} from "../errors";

const base = {
  currentA: 40,
  lengthM: 20,
  systemVoltageV: 48,
  material: "copper" as const,
  circuitType: "dc" as const,
  conductorAreaMm2: 25,
};

describe("validateInput", () => {
  it("accepts a forward-mode input", () => {
    expect(validateInput(base)).toEqual([]);
  });

  it("accepts an inverse-mode input", () => {
    expect(validateInput({
      ...base,
      conductorAreaMm2: undefined,
      targetDropPercent: 3,
    })).toEqual([]);
  });

  it("accepts both modes together", () => {
    expect(validateInput({ ...base, targetDropPercent: 3 })).toEqual([]);
  });

  it("rejects missing mode", () => {
    expect(validateInput({
      ...base,
      conductorAreaMm2: undefined,
    })).toContain(ERROR_NO_MODE);
  });

  it("rejects zero current", () => {
    expect(validateInput({ ...base, currentA: 0 }))
      .toContain(ERROR_INVALID_CURRENT);
  });

  it("rejects zero length", () => {
    expect(validateInput({ ...base, lengthM: 0 }))
      .toContain(ERROR_INVALID_LENGTH);
  });

  it("rejects zero voltage", () => {
    expect(validateInput({ ...base, systemVoltageV: 0 }))
      .toContain(ERROR_INVALID_VOLTAGE);
  });

  it("rejects unknown material", () => {
    expect(validateInput({ ...base, material: "steel" as never }))
      .toContain(ERROR_INVALID_MATERIAL);
  });

  it("rejects unknown circuit type", () => {
    expect(validateInput({ ...base, circuitType: "xyz" as never }))
      .toContain(ERROR_INVALID_CIRCUIT_TYPE);
  });

  it("rejects bad area", () => {
    expect(validateInput({ ...base, conductorAreaMm2: 0 }))
      .toContain(ERROR_INVALID_AREA);
  });

  it("rejects bad target drop", () => {
    expect(validateInput({ ...base, targetDropPercent: 0 }))
      .toContain(ERROR_INVALID_TARGET_DROP);
  });

  it("rejects bad power factor", () => {
    expect(validateInput({ ...base, powerFactor: 0.05 }))
      .toContain(ERROR_INVALID_POWER_FACTOR);
  });

  it("rejects negative reactance", () => {
    expect(validateInput({ ...base, reactanceOhmPerKm: -0.1 }))
      .toContain(ERROR_INVALID_REACTANCE);
  });

  it("collects multiple errors", () => {
    const errs = validateInput({
      ...base,
      currentA: 0,
      lengthM: 0,
      conductorAreaMm2: undefined,
    });
    expect(errs.length).toBeGreaterThanOrEqual(3);
  });
});
