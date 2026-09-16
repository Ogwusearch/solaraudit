import { describe, it, expect } from "vitest";
import { validateInput } from "../validation";
import {
  ERROR_MISSING_CONFIG,
  ERROR_NEGATIVE_DAILY_ENERGY,
  ERROR_NEGATIVE_ARRAY_KWP,
  ERROR_INVALID_RULE_CODE,
} from "../errors";

const base = {
  config: {
    dailyEnergyRequirementKwh: 10,
  },
};

describe("validateInput (structural)", () => {
  it("accepts a minimal valid input", () => {
    expect(validateInput(base)).toEqual([]);
  });

  it("rejects missing config", () => {
    expect(validateInput({} as never)).toContain(ERROR_MISSING_CONFIG);
  });

  it("rejects negative daily energy", () => {
    const errs = validateInput({
      config: { dailyEnergyRequirementKwh: -1 },
    });
    expect(errs).toContain(ERROR_NEGATIVE_DAILY_ENERGY);
  });

  it("rejects negative array kWp", () => {
    const errs = validateInput({
      config: {
        dailyEnergyRequirementKwh: 10,
        pv: { arrayKwp: -1, arrayVoc: 100, arrayIsc: 10, arrayImp: 9, dailyGenerationKwh: 5 },
      },
    });
    expect(errs).toContain(ERROR_NEGATIVE_ARRAY_KWP);
  });

  it("rejects unknown skipRules codes", () => {
    const errs = validateInput({
      ...base,
      skipRules: ["NOT_A_REAL_RULE" as never],
    });
    expect(errs.some((e) => e.includes("NOT_A_REAL_RULE"))).toBe(true);
  });
});
