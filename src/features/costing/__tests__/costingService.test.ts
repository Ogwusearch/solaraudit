import { describe, it, expect } from "vitest";
import {
  calculateCostingFromDraft,
  parseDraft,
  validateDraft,
} from "../services/costingService";
import type { CostingFormDraft } from "../types";

const baseDraft: CostingFormDraft = {
  currency: "USD",
  items: [
    {
      id: "a",
      category: "pv-modules",
      description: "Panel",
      quantity: "10",
      unitCost: "100",
      unit: "pcs",
    },
    {
      id: "b",
      category: "batteries",
      description: "LFP",
      quantity: "4",
      unitCost: "500",
      unit: "pcs",
    },
  ],
  wasteFactor: "0.1",
  discountPercent: "10",
  taxPercent: "20",
  overheads: {
    installationPercent: "10",
    transportPercent: "5",
    engineeringPercent: "5",
    contingencyPercent: "10",
  },
};

describe("parseDraft", () => {
  it("parses numeric fields on line items", () => {
    const p = parseDraft(baseDraft);
    expect(p.items[0]!.quantity).toBe(10);
    expect(p.items[0]!.unitCost).toBe(100);
    expect(p.currency).toBe("USD");
  });

  it("uppercases currency", () => {
    const p = parseDraft({ ...baseDraft, currency: "usd" });
    expect(p.currency).toBe("USD");
  });

  it("omits optional scalar fields when empty", () => {
    const p = parseDraft({
      ...baseDraft,
      wasteFactor: "",
      discountPercent: "",
      taxPercent: "",
    });
    expect(p.wasteFactor).toBeUndefined();
    expect(p.discountPercent).toBeUndefined();
    expect(p.taxPercent).toBeUndefined();
  });

  it("omits unit when empty", () => {
    const p = parseDraft({
      ...baseDraft,
      items: [{ ...baseDraft.items[0]!, unit: "" }],
    });
    expect(p.items[0]!.unit).toBeUndefined();
  });
});

describe("validateDraft (form-level)", () => {
  it("accepts a well-formed draft", () => {
    expect(validateDraft(baseDraft)).toEqual({});
  });

  it("flags bad currency", () => {
    expect(validateDraft({ ...baseDraft, currency: "US" })["currency"])
      .toBeDefined();
  });

  it("flags empty items", () => {
    expect(validateDraft({ ...baseDraft, items: [] })["items"])
      .toBeDefined();
  });

  it("flags missing description", () => {
    const errs = validateDraft({
      ...baseDraft,
      items: [{ ...baseDraft.items[0]!, description: "" }],
    });
    expect(errs["items.0.description"]).toBeDefined();
  });

  it("flags negative quantity", () => {
    const errs = validateDraft({
      ...baseDraft,
      items: [{ ...baseDraft.items[0]!, quantity: "-1" }],
    });
    expect(errs["items.0.quantity"]).toBeDefined();
  });

  it("flags bad waste factor", () => {
    expect(validateDraft({ ...baseDraft, wasteFactor: "1.5" })["wasteFactor"])
      .toBeDefined();
  });

  it("flags bad discount", () => {
    expect(validateDraft({ ...baseDraft, discountPercent: "150" })
      ["discountPercent"]).toBeDefined();
  });

  it("flags bad tax", () => {
    expect(validateDraft({ ...baseDraft, taxPercent: "150" })["taxPercent"])
      .toBeDefined();
  });

  it("flags bad overhead percentage", () => {
    const errs = validateDraft({
      ...baseDraft,
      overheads: { ...baseDraft.overheads, installationPercent: "150" },
    });
    expect(errs["overheads.installationPercent"]).toBeDefined();
  });
});

describe("calculateCostingFromDraft (service → engine)", () => {
  it("sums material subtotal correctly", () => {
    const r = calculateCostingFromDraft(baseDraft);
    // 10 × 100 + 4 × 500 = 3000
    expect(r.materialSubtotal).toBe(3000);
  });

  it("returns the full pipeline for a well-formed draft", () => {
    const r = calculateCostingFromDraft(baseDraft);
    expect(r.isValid).toBe(true);
    expect(r.grandTotal).toBeGreaterThan(r.materialSubtotal);
    expect(r.categoryBreakdown.length).toBe(2);
  });

  it("passes engine errors through unchanged", () => {
    const bad: CostingFormDraft = {
      ...baseDraft,
      currency: "usdollars",
    };
    const r = calculateCostingFromDraft(bad);
    expect(r.isValid).toBe(false);
    expect(r.errors.length).toBeGreaterThan(0);
  });

  it("builds a category breakdown sorted by cost", () => {
    const r = calculateCostingFromDraft(baseDraft);
    const [first, second] = r.categoryBreakdown;
    // Batteries (2000) > PV modules (1000)
    expect(first!.extendedCost).toBeGreaterThanOrEqual(second!.extendedCost);
  });
});
