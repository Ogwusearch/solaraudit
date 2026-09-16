import { describe, it, expect } from "vitest";
import { validateInput } from "../validation";
import {
  ERROR_INVALID_CURRENT,
  ERROR_INVALID_LENGTH,
  ERROR_INVALID_DROP,
  ERROR_INVALID_MATERIAL,
  ERROR_INVALID_INSTALLATION,
  ERROR_INVALID_GROUPING,
} from "../errors";

const base = {
  currentA: 40,
  lengthM: 20,
  systemVoltage: 48,
  allowableDropPercent: 3,
  material: "copper" as const,
  circuitType: "dc" as const,
  installationMethod: "conduit" as const,
};

describe("validateInput", () => {
  it("accepts a valid input", () => {
    expect(validateInput(base)).toEqual([]);
  });

  it("rejects non-positive current", () => {
    expect(validateInput({ ...base, currentA: 0 }))
      .toContain(ERROR_INVALID_CURRENT);
  });

  it("rejects non-positive length", () => {
    expect(validateInput({ ...base, lengthM: 0 }))
      .toContain(ERROR_INVALID_LENGTH);
  });

  it("rejects non-positive allowable drop", () => {
    expect(validateInput({ ...base, allowableDropPercent: 0 }))
      .toContain(ERROR_INVALID_DROP);
  });

  it("rejects unknown material", () => {
    expect(validateInput({ ...base, material: "steel" as never }))
      .toContain(ERROR_INVALID_MATERIAL);
  });

  it("rejects unknown installation method", () => {
    expect(validateInput({ ...base, installationMethod: "space" as never }))
      .toContain(ERROR_INVALID_INSTALLATION);
  });

  it("rejects bad grouping count", () => {
    expect(validateInput({ ...base, groupingCount: 0 }))
      .toContain(ERROR_INVALID_GROUPING);
  });

  it("collects multiple errors", () => {
    const errs = validateInput({
      ...base,
      currentA: 0,
      lengthM: 0,
      allowableDropPercent: 0,
    });
    expect(errs.length).toBeGreaterThanOrEqual(3);
  });
});
