import { describe, it, expect } from "vitest";
import { validateInput } from "../validation";
import {
  ERROR_NO_APPLIANCES,
  ERROR_INVALID_DIVERSITY,
  ERROR_INVALID_SAFETY_MARGIN,
} from "../errors";

const good = {
  name: "LED",
  powerWatts: 10,
  hoursPerDay: 5,
  quantity: 2,
};

describe("validateInput", () => {
  it("accepts a valid input", () => {
    expect(validateInput({ appliances: [good] }, 1, 0)).toEqual([]);
  });

  it("rejects empty appliances", () => {
    const errs = validateInput({ appliances: [] }, 1, 0);
    expect(errs).toContain(ERROR_NO_APPLIANCES);
  });

  it("rejects bad diversity factor", () => {
    const errs = validateInput({ appliances: [good] }, 2, 0);
    expect(errs).toContain(ERROR_INVALID_DIVERSITY);
  });

  it("rejects negative safety margin", () => {
    const errs = validateInput({ appliances: [good] }, 1, -0.1);
    expect(errs).toContain(ERROR_INVALID_SAFETY_MARGIN);
  });

  it("collects multiple errors", () => {
    const bad = { name: "X", powerWatts: -1, hoursPerDay: 30, quantity: 0 };
    const errs = validateInput({ appliances: [bad] }, 2, -1);
    expect(errs.length).toBeGreaterThanOrEqual(4);
  });
});
