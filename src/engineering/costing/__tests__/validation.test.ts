import { describe, it, expect } from "vitest";
import { validateInput } from "../validation";
import {
  ERROR_NO_ITEMS,
  ERROR_INVALID_CURRENCY,
  ERROR_INVALID_WASTE_FACTOR,
  ERROR_INVALID_DISCOUNT_PERCENT,
  ERROR_INVALID_TAX_PERCENT,
} from "../errors";

const item = {
  category: "pv-modules" as const,
  description: "400 W panel",
  quantity: 10,
  unitCost: 250,
};

const base = {
  items: [item],
  currency: "USD",
};

describe("validateInput", () => {
  it("accepts a valid input", () => {
    expect(validateInput(base)).toEqual([]);
  });

  it("rejects empty items", () => {
    expect(validateInput({ ...base, items: [] }))
      .toContain(ERROR_NO_ITEMS);
  });

  it("rejects bad currency", () => {
    expect(validateInput({ ...base, currency: "usd" }))
      .toContain(ERROR_INVALID_CURRENCY);
  });

  it("rejects negative quantity", () => {
    const bad = { ...item, quantity: -1 };
    const errs = validateInput({ ...base, items: [bad] });
    expect(errs.some((e) => /quantity/.test(e))).toBe(true);
  });

  it("rejects negative unitCost", () => {
    const bad = { ...item, unitCost: -1 };
    const errs = validateInput({ ...base, items: [bad] });
    expect(errs.some((e) => /unitCost/.test(e))).toBe(true);
  });

  it("rejects bad wasteFactor", () => {
    expect(validateInput({ ...base, wasteFactor: 1.5 }))
      .toContain(ERROR_INVALID_WASTE_FACTOR);
  });

  it("rejects bad discountPercent", () => {
    expect(validateInput({ ...base, discountPercent: 150 }))
      .toContain(ERROR_INVALID_DISCOUNT_PERCENT);
  });

  it("rejects bad taxPercent", () => {
    expect(validateInput({ ...base, taxPercent: 150 }))
      .toContain(ERROR_INVALID_TAX_PERCENT);
  });

  it("rejects bad overhead percent", () => {
    const errs = validateInput({
      ...base,
      overheads: { installationPercent: 150 },
    });
    expect(errs.some((e) => /installationPercent/.test(e))).toBe(true);
  });

  it("collects multiple errors", () => {
    const errs = validateInput({
      items: [],
      currency: "bad",
      wasteFactor: 2,
      taxPercent: 200,
    });
    expect(errs.length).toBeGreaterThanOrEqual(4);
  });
});
