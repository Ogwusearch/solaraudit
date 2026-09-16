import { describe, it, expect } from "vitest";
import { createInMemoryBatteryRepository } from "../inMemoryBatteryRepository";
import type {
  BatteryRecord,
  CreateBatteryRecordInput,
} from "../types";

function makeRepo() {
  return createInMemoryBatteryRepository();
}

const cellSpec = {
  name: "LFP 12V 100Ah",
  technology: "lifepo4" as const,
  nominalVoltage: 12,
  capacityAh: 100,
  maxDepthOfDischarge: 0.9,
  roundTripEfficiency: 0.95,
};

const inputs = {
  dailyEnergyKwh: 10,
  autonomyDays: 1,
  systemVoltage: 48,
  designMargin: 0.1,
  temperatureDerating: 0.85,
  maxDepthOfDischarge: 0.8,
  roundTripEfficiency: 0.9,
  cell: cellSpec,
};

const result = {
  requiredCapacityKwh: 16.3,
  designCapacityKwh: 18,
  totalCells: 8,
  seriesCells: 4,
  parallelStrings: 2,
  actualInstalledKwh: 19.2,
  actualUsableKwh: 15.4,
  bankVoltage: 48,
  bankCapacityAh: 200,
  maxChargeCurrentA: 100,
  warnings: [],
  errors: [],
  isValid: true,
};

const baseInput: CreateBatteryRecordInput = {
  projectId: "p1",
  auditId: "aud-1",
  name: "48V LFP candidate A",
  calculationVersion: "0.1.0",
  cellSpec,
  inputs,
  result,
  warnings: [],
  errors: [],
};

describe("create", () => {
  it("assigns id, timestamps, and default status", async () => {
    const repo = makeRepo();
    const r = await repo.create(baseInput);
    expect(r.id).toMatch(/^bat-/);
    expect(r.createdAt).toBe(r.updatedAt);
    expect(r.status).toBe("candidate");
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
    expect(r.cellSpec).toEqual(cellSpec);
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
    const a = await repo.create({ ...baseInput, name: "First" });
    await new Promise((r) => setTimeout(r, 5));
    const b = await repo.create({ ...baseInput, name: "Second" });

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

  it("filters by status", async () => {
    const repo = makeRepo();
    await repo.create({ ...baseInput, status: "candidate" });
    await repo.create({ ...baseInput, status: "selected" });

    const candidates = await repo.list({ status: "candidate" });
    expect(candidates.length).toBe(1);
    expect(candidates[0]!.status).toBe("candidate");
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
      // @ts-expect-error — id is not part of UpdateBatteryRecordPatch
      id: "hacked",
    });
    expect(updated!.id).toBe(created.id);
  });

  it("returns null for a missing id", async () => {
    const repo = makeRepo();
    expect(await repo.update("missing", { name: "x" })).toBeNull();
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
    const a = await repo.create({ ...baseInput, name: "A" });
    const b = await repo.create({ ...baseInput, name: "B" });

    await repo.select(a.id);
    await repo.select(b.id);

    const aAfter = await repo.get(a.id);
    const bAfter = await repo.get(b.id);
    expect(aAfter!.status).toBe("archived");
    expect(bAfter!.status).toBe("selected");
  });

  it("does not archive selected records from other projects", async () => {
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

describe("install", () => {
  it("marks a record as installed", async () => {
    const repo = makeRepo();
    const r = await repo.create(baseInput);
    const installed = await repo.install(r.id);
    expect(installed!.status).toBe("installed");
  });

  it("returns null for a missing id", async () => {
    const repo = makeRepo();
    expect(await repo.install("missing")).toBeNull();
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
    const seed: BatteryRecord[] = [
      {
        id: "seed-1",
        projectId: "p1",
        name: "Seeded",
        status: "installed",
        calculationVersion: "0.1.0",
        cellSpec,
        inputs,
        result,
        warnings: [],
        errors: [],
        createdAt: "2026-01-01T00:00:00Z",
        updatedAt: "2026-01-01T00:00:00Z",
      },
    ];
    const repo = createInMemoryBatteryRepository(seed);
    const list = await repo.list();
    expect(list.length).toBe(1);
    expect(list[0]!.id).toBe("seed-1");
  });
});
