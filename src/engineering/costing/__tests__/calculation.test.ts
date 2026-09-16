import { describe, it, expect } from "vitest";
import { calculateInternal } from "../calculation";
import type { CostingInput } from "../types";

const baseInput: CostingInput = {
  items: [
    { category: "pv-modules", description: "Panel", quantity: 10, unitCost: 100 },
    { category: "batteries",  description: "LFP 100Ah", quantity: 4, unitCost: 500 },
  ],
  currency: "USD",
};

describe("calculateInternal", () => {
  it("sums material subtotal correctly", () => {
    // 10 × 100 + 4 × 500 = 3000
    const r = calculateInternal(baseInput);
    expect(r.materialSubtotal).toBe(3000);
  });

  it("applies waste factor to materials", () => {
    const r = calculateInternal({ ...baseInput, wasteFactor: 0.1 });
    expect(r.wasteCost).toBe(300);
    expect(r.adjustedMaterials).toBe(3300);
  });

  it("applies overhead percentages against adjusted materials", () => {
    const r = calculateInternal({
      ...baseInput,
      wasteFactor: 0.1,
      overheads: {
        installationPercent: 10,
        transportPercent: 5,
        engineeringPercent: 5,
      },
    });
    // adjusted = 3300
    // installation = 330, transport = 165, engineering = 165
    expect(r.installationCost).toBe(330);
    expect(r.transportCost).toBe(165);
    expect(r.engineeringCost).toBe(165);
    expect(r.overheadsSubtotal).toBe(660);
  });

  it("applies contingency to adjusted materials + overheads", () => {
    const r = calculateInternal({
      ...baseInput,
      wasteFactor: 0.1,
      overheads: {
        installationPercent: 10,
        transportPercent: 5,
        engineeringPercent: 5,
        contingencyPercent: 10,
      },
    });
    // base = 3300 + 660 = 3960; contingency = 396
    expect(r.contingencyCost).toBe(396);
    expect(r.preDiscountTotal).toBe(4356);
  });

  it("applies discount before tax", () => {
    const r = calculateInternal({
      ...baseInput,
      discountPercent: 10,
      taxPercent: 20,
    });
    // preDiscount = 3000; discount = 300; after = 2700; tax = 540; total = 3240
    expect(r.discountAmount).toBe(300);
    expect(r.subtotalAfterDiscount).toBe(2700);
    expect(r.taxAmount).toBe(540);
    expect(r.grandTotal).toBe(3240);
  });

  it("builds category breakdown", () => {
    const r = calculateInternal({
      ...baseInput,
      items: [
        { category: "pv-modules", description: "A", quantity: 5, unitCost: 100 },
        { category: "pv-modules", description: "B", quantity: 5, unitCost: 200 },
        { category: "cables",     description: "C", quantity: 20, unitCost: 5 },
      ],
      currency: "USD",
    });
    // PV total = 500 + 1000 = 1500
    // cables = 100
    const pv = r.categoryBreakdown.find((c) => c.category === "pv-modules");
    const cables = r.categoryBreakdown.find((c) => c.category === "cables");
    expect(pv?.extendedCost).toBe(1500);
    expect(pv?.quantity).toBe(10);
    expect(cables?.extendedCost).toBe(100);
  });

  it("sorts categories by extended cost descending", () => {
    const r = calculateInternal(baseInput);
    const [first, second] = r.categoryBreakdown;
    expect(first!.extendedCost).toBeGreaterThanOrEqual(second!.extendedCost);
  });

  it("warns on high waste factor", () => {
    const r = calculateInternal({ ...baseInput, wasteFactor: 0.2 });
    expect(r.warnings.some((w) => /waste/i.test(w))).toBe(true);
  });

  it("warns when tax is zero", () => {
    const r = calculateInternal(baseInput);
    expect(r.warnings.some((w) => /tax/i.test(w))).toBe(true);
  });

  it("warns on high discount", () => {
    const r = calculateInternal({ ...baseInput, discountPercent: 30 });
    expect(r.warnings.some((w) => /discount/i.test(w))).toBe(true);
  });

  it("zero items totals are zero", () => {
    const r = calculateInternal({
      items: [{ category: "other", description: "x", quantity: 0, unitCost: 0 }],
      currency: "USD",
    });
    expect(r.materialSubtotal).toBe(0);
    expect(r.grandTotal).toBe(0);
    expect(r.warnings.some((w) => /zero/i.test(w))).toBe(true);
  });
});
