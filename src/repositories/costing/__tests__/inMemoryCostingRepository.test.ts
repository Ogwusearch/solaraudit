import { describe, it, expect } from "vitest";
import { createInMemoryCostingRepository } from "../inMemoryCostingRepository";
import type {
  CostingRecord,
  CreateCostingRecordInput,
} from "../types";

function makeRepo() {
  return createInMemoryCostingRepository();
}

const inputs = {
  items: [
    {
      category: "pv-modules" as const,
      description: "400 W panel",
      quantity: 10,
      unitCost: 100,
    },
  ],
  currency: "USD",
  wasteFactor: 0.1,
  discountPercent: 5,
  taxPercent: 7.5,
  overheads: {
    installationPercent: 10,
    transportPercent: 4,
    engineeringPercent: 6,
    contingencyPercent: 5,
  },
};

const result = {
  materialSubtotal: 1000,
  wasteCost: 100,
  adjustedMaterials: 1100,
  installationCost: 110,
  transportCost: 44,
  engineeringCost: 66,
  overheadsSubtotal: 220,
  contingencyCost: 66,
  preDiscountTotal: 1386,
  discountAmount: 69.3,
  subtotalAfterDiscount: 1316.7,
  taxAmount: 98.75,
  grandTotal: 1415.45,
  categoryBreakdown: [
    { category: "pv-modules" as const, quantity: 10, extendedCost: 1000 },
  ],
  currency: "USD",
  warnings: [],
  errors: [],
  isValid: true,
};

const baseInput: CreateCostingRecordInput = {
  projectId: "p1",
  auditId: "aud-1",
  label: "Baseline estimate",
  currency: "USD",
  calculationVersion: "0.1.0",
  inputs,
  result,
  warnings: [],
  errors: [],
};

describe("create", () => {
  it("assigns id, timestamps, and default status", async () => {
    const repo = makeRepo();
    const r = await repo.create(baseInput);
    expect(r.id).toMatch(/^cst-/);
    expect(r.createdAt).toBe(r.updatedAt);
    expect(r.status).toBe("draft");
  });

  it("respects an explicit status", async () => {
    const repo = makeRepo();
    const r = await repo.create({ ...baseInput, status: "selected" });
    expect(r.status).toBe("selected");
  });

  it("preserves input and result snapshots verbatim", async () => {
    const repo = makeRepo();
    const r = await repo.create(baseInput);
    expect(r.inputs).toEqual(inputs);
    expect(r.result).toEqual(result);
    expect(r.currency).toBe("USD");
  });

  it("produces unique ids", async () => {
    const repo = makeRepo();
    const a = await repo.create(baseInput);
    const b = await repo.create(baseInput);
    expect(a.id).not.toBe(b.id);
  });
});

describe("get", () => {
  it("returns the record by id", async () => {
    const repo = makeRepo();
    const created = await repo.create(baseInput);
    const fetched = await repo.get(created.id);
    expect(fetched).not.toBeNull();
    expect(fetched!.id).toBe(created.id);
  });

  it("returns null for a missing id", async () => {
    const repo = makeRepo();
    expect(await repo.get("missing")).toBeNull();
  });
});

describe("list", () => {
  it("returns records sorted by updatedAt desc", async () => {
    const repo = makeRepo();
    const a = await repo.create({ ...baseInput, label: "First" });
    await new Promise((r) => setTimeout(r, 5));
    const b = await repo.create({ ...baseInput, label: "Second" });

    const list = await repo.list();
    expect(list.length).toBe(2);
    expect(list[0]!.id).toBe(b.id);
    expect(list[1]!.id).toBe(a.id);
  });

  it("filters by projectId", async () => {
    const repo = makeRepo();
    await repo.create({ ...baseInput, projectId: "p1" });
    await repo.create({ ...baseInput, projectId: "p2" });

    const p1 = await repo.list({ projectId: "p1" });
    expect(p1.length).toBe(1);
    expect(p1[0]!.projectId).toBe("p1");
  });

  it("filters by auditId", async () => {
    const repo = makeRepo();
    await repo.create({ ...baseInput, auditId: "aud-1" });
    await repo.create({ ...baseInput, auditId: "aud-2" });

    const a1 = await repo.list({ auditId: "aud-1" });
    expect(a1.length).toBe(1);
    expect(a1[0]!.auditId).toBe("aud-1");
  });

  it("filters by currency", async () => {
    const repo = makeRepo();
    await repo.create({ ...baseInput, currency: "USD" });
    await repo.create({ ...baseInput, currency: "NGN" });

    const usd = await repo.list({ currency: "USD" });
    expect(usd.length).toBe(1);
    expect(usd[0]!.currency).toBe("USD");
  });

  it("filters by status", async () => {
    const repo = makeRepo();
    await repo.create({ ...baseInput, status: "draft" });
    await repo.create({ ...baseInput, status: "final" });

    const drafts = await repo.list({ status: "draft" });
    expect(drafts.length).toBe(1);
    expect(drafts[0]!.status).toBe("draft");
  });

  it("applies limit after sort", async () => {
    const repo = makeRepo();
    await repo.create({ ...baseInput, label: "A" });
    await new Promise((r) => setTimeout(r, 2));
    await repo.create({ ...baseInput, label: "B" });
    await new Promise((r) => setTimeout(r, 2));
    await repo.create({ ...baseInput, label: "C" });

    const limited = await repo.list({ limit: 2 });
    expect(limited.length).toBe(2);
    expect(limited[0]!.label).toBe("C");
    expect(limited[1]!.label).toBe("B");
  });
});

describe("update", () => {
  it("applies a patch and bumps updatedAt", async () => {
    const repo = makeRepo();
    const created = await repo.create(baseInput);
    await new Promise((r) => setTimeout(r, 5));

    const updated = await repo.update(created.id, { label: "Renamed" });
    expect(updated).not.toBeNull();
    expect(updated!.label).toBe("Renamed");
    expect(updated!.createdAt).toBe(created.createdAt);
    expect(updated!.updatedAt > created.updatedAt).toBe(true);
  });

  it("does not allow overwriting id or createdAt", async () => {
    const repo = makeRepo();
    const created = await repo.create(baseInput);
    const updated = await repo.update(created.id, {
      // @ts-expect-error — id is not part of UpdateCostingRecordPatch
      id: "hacked",
    });
    expect(updated!.id).toBe(created.id);
  });

  it("returns null for a missing id", async () => {
    const repo = makeRepo();
    expect(await repo.update("missing", { label: "x" })).toBeNull();
  });
});

describe("remove", () => {
  it("deletes an existing record", async () => {
    const repo = makeRepo();
    const created = await repo.create(baseInput);
    expect(await repo.remove(created.id)).toBe(true);
    expect(await repo.get(created.id)).toBeNull();
  });

  it("returns false for a missing id", async () => {
    const repo = makeRepo();
    expect(await repo.remove("missing")).toBe(false);
  });
});

describe("select", () => {
  it("marks a record as selected", async () => {
    const repo = makeRepo();
    const r = await repo.create(baseInput);
    const selected = await repo.select(r.id);
    expect(selected).not.toBeNull();
    expect(selected!.status).toBe("selected");
  });

  it("archives a previously selected record for the same project", async () => {
    const repo = makeRepo();
    const a = await repo.create({ ...baseInput, label: "A" });
    const b = await repo.create({ ...baseInput, label: "B" });

    await repo.select(a.id);
    await repo.select(b.id);

    const aAfter = await repo.get(a.id);
    const bAfter = await repo.get(b.id);
    expect(aAfter!.status).toBe("archived");
    expect(bAfter!.status).toBe("selected");
  });

  it("does NOT archive a final record", async () => {
    const repo = makeRepo();
    const a = await repo.create({ ...baseInput, label: "A" });
    const b = await repo.create({ ...baseInput, label: "B" });

    // Finalise A, then select B. A should stay final.
    await repo.finalize(a.id);
    await repo.select(b.id);

    const aAfter = await repo.get(a.id);
    const bAfter = await repo.get(b.id);
    expect(aAfter!.status).toBe("final");
    expect(bAfter!.status).toBe("selected");
  });

  it("does NOT archive a selected record from a different project", async () => {
    const repo = makeRepo();
    const p1 = await repo.create({ ...baseInput, projectId: "p1" });
    const p2 = await repo.create({ ...baseInput, projectId: "p2" });

    await repo.select(p1.id);
    await repo.select(p2.id);

    const p1After = await repo.get(p1.id);
    const p2After = await repo.get(p2.id);
    expect(p1After!.status).toBe("selected");
    expect(p2After!.status).toBe("selected");
  });

  it("returns null for a missing id", async () => {
    const repo = makeRepo();
    expect(await repo.select("missing")).toBeNull();
  });
});

describe("finalize", () => {
  it("marks a record as final", async () => {
    const repo = makeRepo();
    const r = await repo.create(baseInput);
    const finalised = await repo.finalize(r.id);
    expect(finalised!.status).toBe("final");
  });

  it("bumps updatedAt when finalising", async () => {
    const repo = makeRepo();
    const r = await repo.create(baseInput);
    await new Promise((res) => setTimeout(res, 5));
    const finalised = await repo.finalize(r.id);
    expect(finalised!.updatedAt > r.updatedAt).toBe(true);
  });

  it("returns null for a missing id", async () => {
    const repo = makeRepo();
    expect(await repo.finalize("missing")).toBeNull();
  });
});

describe("archive", () => {
  it("marks a record as archived", async () => {
    const repo = makeRepo();
    const r = await repo.create(baseInput);
    const archived = await repo.archive(r.id);
    expect(archived!.status).toBe("archived");
  });

  it("returns null for a missing id", async () => {
    const repo = makeRepo();
    expect(await repo.archive("missing")).toBeNull();
  });
});

describe("seed", () => {
  it("accepts a seed array", async () => {
    const seed: CostingRecord[] = [
      {
        id: "seed-1",
        projectId: "p1",
        label: "Seeded",
        currency: "USD",
        status: "final",
        calculationVersion: "0.1.0",
        inputs,
        result,
        warnings: [],
        errors: [],
        createdAt: "2026-01-01T00:00:00Z",
        updatedAt: "2026-01-01T00:00:00Z",
      },
    ];
    const repo = createInMemoryCostingRepository(seed);
    const list = await repo.list();
    expect(list.length).toBe(1);
    expect(list[0]!.id).toBe("seed-1");
  });
});
