import { describe, it, expect } from "vitest";
import { createInMemoryAuditRepository } from "../inMemoryAuditRepository";
import type { CreateAuditInput } from "../types";

function makeRepo() {
  return createInMemoryAuditRepository();
}

const baseInput: CreateAuditInput = {
  projectId: "p1",
  name: "Baseline audit",
  calculationVersion: "0.1.0",
  inputs: { site: "Lagos", psh: 4.5 },
  assumptions: [
    { key: "PSH", value: "4.5 h", source: "site survey" },
  ],
  results: {},
  warnings: [],
  errors: [],
};

describe("create", () => {
  it("assigns id, createdAt, updatedAt, and default status", async () => {
    const repo = makeRepo();
    const a = await repo.create(baseInput);
    expect(a.id).toMatch(/^aud-/);
    expect(a.createdAt).toBe(a.updatedAt);
    expect(a.status).toBe("draft");
  });

  it("respects an explicit status", async () => {
    const repo = makeRepo();
    const a = await repo.create({ ...baseInput, status: "completed" });
    expect(a.status).toBe("completed");
  });

  it("preserves inputs and assumptions verbatim", async () => {
    const repo = makeRepo();
    const a = await repo.create(baseInput);
    expect(a.inputs).toEqual(baseInput.inputs);
    expect(a.assumptions).toEqual(baseInput.assumptions);
  });

  it("produces unique ids", async () => {
    const repo = makeRepo();
    const a1 = await repo.create(baseInput);
    const a2 = await repo.create(baseInput);
    expect(a1.id).not.toBe(a2.id);
  });
});

describe("get", () => {
  it("returns the audit by id", async () => {
    const repo = makeRepo();
    const created = await repo.create(baseInput);
    const fetched = await repo.get(created.id);
    expect(fetched).not.toBeNull();
    expect(fetched!.id).toBe(created.id);
  });

  it("returns null for missing id", async () => {
    const repo = makeRepo();
    expect(await repo.get("missing")).toBeNull();
  });
});

describe("list", () => {
  it("returns all audits sorted by updatedAt desc", async () => {
    const repo = makeRepo();
    const a1 = await repo.create({ ...baseInput, name: "First" });
    await new Promise((r) => setTimeout(r, 5));
    const a2 = await repo.create({ ...baseInput, name: "Second" });

    const list = await repo.list();
    expect(list.length).toBe(2);
    expect(list[0]!.id).toBe(a2.id);
    expect(list[1]!.id).toBe(a1.id);
  });

  it("filters by projectId", async () => {
    const repo = makeRepo();
    await repo.create({ ...baseInput, projectId: "p1" });
    await repo.create({ ...baseInput, projectId: "p2" });

    const p1Audits = await repo.list({ projectId: "p1" });
    expect(p1Audits.length).toBe(1);
    expect(p1Audits[0]!.projectId).toBe("p1");
  });

  it("filters by status", async () => {
    const repo = makeRepo();
    await repo.create({ ...baseInput, status: "draft" });
    await repo.create({ ...baseInput, status: "completed" });

    const drafts = await repo.list({ status: "draft" });
    expect(drafts.length).toBe(1);
    expect(drafts[0]!.status).toBe("draft");
  });

  it("applies limit after sort", async () => {
    const repo = makeRepo();
    await repo.create({ ...baseInput, name: "A" });
    await new Promise((r) => setTimeout(r, 2));
    await repo.create({ ...baseInput, name: "B" });
    await new Promise((r) => setTimeout(r, 2));
    await repo.create({ ...baseInput, name: "C" });

    const limited = await repo.list({ limit: 2 });
    expect(limited.length).toBe(2);
    expect(limited[0]!.name).toBe("C");
    expect(limited[1]!.name).toBe("B");
  });

  it("combines projectId and status filters", async () => {
    const repo = makeRepo();
    await repo.create({ ...baseInput, projectId: "p1", status: "draft" });
    await repo.create({ ...baseInput, projectId: "p1", status: "completed" });
    await repo.create({ ...baseInput, projectId: "p2", status: "draft" });

    const r = await repo.list({ projectId: "p1", status: "draft" });
    expect(r.length).toBe(1);
    expect(r[0]!.projectId).toBe("p1");
    expect(r[0]!.status).toBe("draft");
  });
});

describe("update", () => {
  it("applies a patch and bumps updatedAt", async () => {
    const repo = makeRepo();
    const created = await repo.create(baseInput);
    await new Promise((r) => setTimeout(r, 5));

    const updated = await repo.update(created.id, { name: "Renamed" });
    expect(updated).not.toBeNull();
    expect(updated!.name).toBe("Renamed");
    expect(updated!.createdAt).toBe(created.createdAt);
    expect(updated!.updatedAt > created.updatedAt).toBe(true);
  });

  it("does not allow overwriting id or createdAt", async () => {
    const repo = makeRepo();
    const created = await repo.create(baseInput);
    const updated = await repo.update(created.id, {
      // @ts-expect-error — id is not part of UpdateAuditPatch
      id: "hacked",
    });
    expect(updated!.id).toBe(created.id);
  });

  it("returns null for missing id", async () => {
    const repo = makeRepo();
    const updated = await repo.update("missing", { name: "x" });
    expect(updated).toBeNull();
  });

  it("stores nested results as-is", async () => {
    const repo = makeRepo();
    const created = await repo.create(baseInput);
    const updated = await repo.update(created.id, {
      results: { load: { isValid: true } as never },
    });
    expect(updated!.results.load).toEqual({ isValid: true });

    const reread = await repo.get(created.id);
    expect(reread!.results.load).toEqual({ isValid: true });
  });
});

describe("remove", () => {
  it("deletes an existing audit", async () => {
    const repo = makeRepo();
    const created = await repo.create(baseInput);
    expect(await repo.remove(created.id)).toBe(true);
    expect(await repo.get(created.id)).toBeNull();
  });

  it("returns false for missing id", async () => {
    const repo = makeRepo();
    expect(await repo.remove("missing")).toBe(false);
  });
});

describe("supersede", () => {
  it("marks the audit as superseded and links the successor", async () => {
    const repo = makeRepo();
    const old = await repo.create({ ...baseInput, name: "v1" });
    const fresh = await repo.create({ ...baseInput, name: "v2" });

    const updated = await repo.supersede(old.id, fresh.id);
    expect(updated).not.toBeNull();
    expect(updated!.status).toBe("superseded");
    expect(updated!.supersededBy).toBe(fresh.id);
  });

  it("returns null if either id is missing", async () => {
    const repo = makeRepo();
    const a = await repo.create(baseInput);
    expect(await repo.supersede(a.id, "missing")).toBeNull();
    expect(await repo.supersede("missing", a.id)).toBeNull();
  });

  it("does not modify the successor", async () => {
    const repo = makeRepo();
    const old = await repo.create({ ...baseInput, name: "v1" });
    const fresh = await repo.create({ ...baseInput, name: "v2" });

    await repo.supersede(old.id, fresh.id);

    const successor = await repo.get(fresh.id);
    expect(successor!.status).toBe("draft");
    expect(successor!.supersededBy).toBeUndefined();
  });
});

describe("seed", () => {
  it("accepts a seed array", async () => {
    const seeded = createInMemoryAuditRepository([
      {
        id: "seed-1",
        projectId: "p1",
        name: "Seeded",
        status: "completed",
        calculationVersion: "0.1.0",
        inputs: {},
        assumptions: [],
        results: {},
        warnings: [],
        errors: [],
        createdAt: "2026-01-01T00:00:00Z",
        updatedAt: "2026-01-01T00:00:00Z",
      },
    ]);
    const list = await seeded.list();
    expect(list.length).toBe(1);
    expect(list[0]!.id).toBe("seed-1");
  });
});
