/**
 * SolarAudit — Costing feature: Draft factories
 */

import type {
  CostLineItemDraft,
  CostingFormDraft,
  OverheadsDraft,
} from "../types";

let counter = 0;
function nextId(): string {
  counter += 1;
  return `row-${Date.now()}-${counter}`;
}

export function createEmptyLineItem(): CostLineItemDraft {
  return {
    id: nextId(),
    category: "other",
    description: "",
    quantity: "1",
    unitCost: "",
    unit: "pcs",
  };
}

function emptyOverheads(): OverheadsDraft {
  return {
    installationPercent: "10",
    transportPercent: "4",
    engineeringPercent: "6",
    contingencyPercent: "5",
  };
}

export function createEmptyDraft(): CostingFormDraft {
  return {
    currency: "USD",
    items: [createEmptyLineItem()],
    wasteFactor: "0.05",
    discountPercent: "",
    taxPercent: "",
    overheads: emptyOverheads(),
  };
}

export function createSampleDraft(): CostingFormDraft {
  return {
    currency: "USD",
    items: [
      {
        id: nextId(),
        category: "pv-modules",
        description: "400 W mono panel",
        quantity: "11",
        unitCost: "180",
        unit: "pcs",
      },
      {
        id: nextId(),
        category: "batteries",
        description: "48 V 100 Ah LFP",
        quantity: "4",
        unitCost: "900",
        unit: "pcs",
      },
      {
        id: nextId(),
        category: "inverter",
        description: "5 kVA hybrid inverter",
        quantity: "1",
        unitCost: "800",
        unit: "pcs",
      },
      {
        id: nextId(),
        category: "charge-controller",
        description: "80 A MPPT",
        quantity: "1",
        unitCost: "350",
        unit: "pcs",
      },
      {
        id: nextId(),
        category: "cables",
        description: "25 mm² copper",
        quantity: "80",
        unitCost: "6",
        unit: "m",
      },
    ],
    wasteFactor: "0.08",
    discountPercent: "5",
    taxPercent: "7.5",
    overheads: {
      installationPercent: "12",
      transportPercent: "4",
      engineeringPercent: "6",
      contingencyPercent: "8",
    },
  };
}

export function appendLineItem(
  current: readonly CostLineItemDraft[],
): CostLineItemDraft[] {
  return [...current, createEmptyLineItem()];
}
