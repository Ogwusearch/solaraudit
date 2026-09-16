import { describe, it, expect } from "vitest";
import { calculateCosting } from "../index";

describe("calculateCosting (public API)", () => {
  it("returns invalid on empty items", () => {
    const r = calculateCosting({ items: [], currency: "USD" });
    expect(r.isValid).toBe(false);
    expect(r.errors.length).toBeGreaterThan(0);
    expect(r.grandTotal).toBe(0);
  });

  it("returns invalid on bad currency", () => {
    const r = calculateCosting({
      items: [
        { category: "other", description: "x", quantity: 1, unitCost: 10 },
      ],
      currency: "dollars",
    });
    expect(r.isValid).toBe(false);
    expect(r.errors.length).toBeGreaterThan(0);
  });

  it("computes a full project cost with all components", () => {
    const r = calculateCosting({
      items: [
        { category: "pv-modules",        description: "400W",    quantity: 10,  unitCost: 180 },
        { category: "batteries",         description: "48V LFP", quantity: 4,   unitCost: 900 },
        { category: "inverter",          description: "5 kVA",   quantity: 1,   unitCost: 800 },
        { category: "charge-controller", description: "80A MPPT",quantity: 1,   unitCost: 350 },
        { category: "cables",            description: "25mm²",   quantity: 80,  unitCost: 6 },
      ],
      currency: "USD",
      wasteFactor: 0.08,
      overheads: {
        installationPercent: 12,
        transportPercent: 4,
        engineeringPercent: 6,
        contingencyPercent: 8,
      },
      discountPercent: 5,
      taxPercent: 7.5,
    });

    expect(r.isValid).toBe(true);
    expect(r.errors).toEqual([]);
    expect(r.materialSubtotal).toBeGreaterThan(0);
    expect(r.grandTotal).toBeGreaterThan(r.materialSubtotal);
    expect(r.categoryBreakdown.length).toBeGreaterThan(0);
    expect(r.currency).toBe("USD");
  });

  it("grand total equals subtotal + tax when no discount", () => {
    const r = calculateCosting({
      items: [
        { category: "other", description: "x", quantity: 1, unitCost: 100 },
      ],
      currency: "USD",
      taxPercent: 10,
    });
    expect(r.grandTotal).toBeCloseTo(r.subtotalAfterDiscount * 1.1, 2);
  });
});
