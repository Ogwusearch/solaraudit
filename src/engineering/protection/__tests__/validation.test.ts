import { describe, it, expect } from "vitest";
import { validateInput } from "../validation";
import {
  ERROR_INVALID_CURRENT,
  ERROR_INVALID_VOLTAGE,
  ERROR_INVALID_VOLTAGE_TYPE,
  ERROR_INVALID_ROLE,
  ERROR_INVALID_TECHNOLOGY,
  ERROR_INVALID_SAFETY_FACTOR,
  ERROR_INVALID_FAULT_CURRENT,
} from "../errors";

const base = {
  role: "battery" as const,
  voltageType: "dc" as const,
  technology: "fuse" as const,
  continuousCurrentA: 100,
  systemVoltageV: 48,
};

describe("validateInput", () => {
  it("accepts a valid input", () => {
    expect(validateInput(base)).toEqual([]);
  });

  it("rejects zero current", () => {
    expect(validateInput({ ...base, continuousCurrentA: 0 }))
      .toContain(ERROR_INVALID_CURRENT);
  });

  it("rejects zero voltage", () => {
    expect(validateInput({ ...base, systemVoltageV: 0 }))
      .toContain(ERROR_INVALID_VOLTAGE);
  });

  it("rejects bad voltage type", () => {
    expect(validateInput({ ...base, voltageType: "xyz" as never }))
      .toContain(ERROR_INVALID_VOLTAGE_TYPE);
  });

  it("rejects unknown role", () => {
    expect(validateInput({ ...base, role: "unknown" as never }))
      .toContain(ERROR_INVALID_ROLE);
  });

  it("rejects unknown technology", () => {
    expect(validateInput({ ...base, technology: "xyz" as never }))
      .toContain(ERROR_INVALID_TECHNOLOGY);
  });

  it("rejects safety factor < 1", () => {
    expect(validateInput({ ...base, safetyFactor: 0.5 }))
      .toContain(ERROR_INVALID_SAFETY_FACTOR);
  });

  it("rejects negative fault current", () => {
    expect(validateInput({ ...base, availableFaultCurrentKa: -1 }))
      .toContain(ERROR_INVALID_FAULT_CURRENT);
  });

  it("collects multiple errors", () => {
    const errs = validateInput({
      ...base,
      continuousCurrentA: 0,
      systemVoltageV: 0,
      safetyFactor: 0.5,
    });
    expect(errs.length).toBeGreaterThanOrEqual(3);
  });
});
