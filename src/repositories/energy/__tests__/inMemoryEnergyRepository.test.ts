import { describe, it, expect } from "vitest";
import { createInMemoryEnergyRepository } from "../inMemoryEnergyRepository";
import type {
  CreateEnergyRecordInput,
  EnergyRecord,
} from "../types";

function makeRepo() {
  return createInMemoryEnergyRepository();
}

const inputsNoBattery = {
  pvArrays: [
    {
      name: "Roof",
      capacityKwp: 5,
      peakSunHours: 4.5,
      performanceRatio: 0.8,
    },
  ],
  dailyConsumptionKwh: 10,
  days: 1,
};

const inputsWithBattery = {
  ...inputsNoBattery,
  battery: {
    name: "Home",
    capacityKwh: 10,
    depthOfDischarge: 0.9,
    roundTripEfficiency: 0.9,
    initialSoc: 0.5,
  },
};

const resultNoBattery = {
  pvGenerationKwh: 18,
  consumptionKwh: 10,
  selfConsumedKwh: 10,
  gridImportKwh: 0,
  gridExportKwh: 8,
  batteryChargeKwh: 0,
  batteryDischargeKwh: 0,
  batteryFinalSoc: 0,
  batteryCycles: 0,
  selfConsumptionRate: 0.556,
  selfSufficiencyRate: 1,
  warnings: [],
  errors: [],
  isValid: true,
};

const resultWithBattery = {
  ...resultNoBattery,
  batteryChargeKwh: 5,
  batteryDischargeKwh: 2,
  batteryFinalSoc: 0.7,
  batteryCycles: 0.22,
};

const baseNoBattery: CreateEnergyRecordInput = {
  projectId: "p1",
  auditId: "aud-1",
  label: "Summer scenario",
  days: 1,
  hasBattery: false,
  calculationVersion: "0.1.0",
  inputs: inputsNoBattery,
  result: resultNoBattery,
  warnings: [],
  errors: [],
};

const baseWithBattery: CreateEnergyRecordInput = {
  ...baseNoBattery,
  label: "Summer scenario, with battery",
  hasBattery: true,
  inputs: inputsWithBattery,
  result: resultWithBattery,
};

describe("create", () => {
  it("assigns id, timestamps, and default status", async () => {
    const repo = makeRepo();
    const r = await repo.create(baseNoBattery);
    expect(r.id).toMatch(/^eng-/);
    expect(r.createdAt).toBe(r.updatedAt);
    expect(r.status).toBe("draft");
  });

  it("respects an explicit status", async () => {
    const repo = makeRepo();
    const r = await repo.create({ ...baseNoBattery, status: "selected" });
    expect(r.status).toBe("selected");
  });

  it("preserves input and result snapshots verbatim", async () => {
    const repo = makeRepo();
    const r = await repo.create(baseNoBattery);
    expect(r.inputs).toEqual(inputsNoBattery);
    expect(r.result).toEqual(resultNoBattery);
    expect(r.days).toBe(1);
    expect(r.hasBattery).toBe(false);
  });

  it("carries the hasBattery flag for battery-inclusive analyses", async () => {
    const repo = makeRepo();
    const r = await repo.create(baseWithBattery);
    expect(r.hasBattery).toBe(true);
    expect(r.result.batteryChargeKwh).toBe(5);
  });

  it("produces unique ids", async () => {
    const repo = makeRepo();
    const a = await repo.create(baseNoBattery);
    const b = await repo.create(baseNoBattery);
    expect(a.id).not.toBe(b.id);
  });
});

describe("get", () => {
  it("returns the record by id", async () => {
    const repo = makeRepo();
    const created = await repo.create(baseNoBattery);
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
    const a = await repo.create({ ...baseNoBattery, label: "First" });
    await new Promise((r) => setTimeout(r, 5));
    const b = await repo.create({ ...baseNoBattery, label: "Second" });

    const list = await repo.list();
    expect(list.length).toBe(2);
    expect(list[0]!.id).toBe(b.id);
    expect(list[1]!.id).toBe(a.id);
  });

  it("filters by projectId", async () => {
    const repo = makeRepo();
    await repo.create({ ...baseNoBattery, projectId: "p1" });
    await repo.create({ ...baseNoBattery, projectId: "p2" });

    const p1 = await repo.list({ projectId: "p1" });
    expect(p1.length).toBe(1);
    expect(p1[0]!.projectId).toBe("p1");
  });

  it("filters by auditId", async () => {
    const repo = makeRepo();
    await repo.create({ ...baseNoBattery, auditId: "aud-1" });
    await repo.create({ ...baseNoBattery, auditId: "aud-2" });

    const a1 = await repo.list({ auditId: "aud-1" });
    expect(a1.length).toBe(1);
    expect(a1[0]!.auditId).toBe("aud-1");
  });

  it("filters by hasBattery", async () => {
    const repo = makeRepo();
    await repo.create(baseNoBattery);
    await repo.create(baseWithBattery);

    const withBattery = await repo.list({ hasBattery: true });
    expect(withBattery.length).toBe(1);
    expect(withBattery[0]!.hasBattery).toBe(true);

    const without = await repo.list({ hasBattery: false });
    expect(without.length).toBe(1);
    expect(without[0]!.hasBattery).toBe(false);
  });

  it("filters by status", async () => {
    const repo = makeRepo();
    await repo.create({ ...baseNoBattery, status: "draft" });
    await repo.create({ ...baseNoBattery, status: "selected" });

    const drafts = await repo.list({ status: "draft" });
    expect(drafts.length).toBe(1);
    expect(drafts[0]!.status).toBe("draft");
  });

  it("applies limit after sort", async () => {
    const repo = makeRepo();
    await repo.create({ ...baseNoBattery, label: "A" });
    await new Promise((r) => setTimeout(r, 2));
    await repo.create({ ...baseNoBattery, label: "B" });
    await new Promise((r) => setTimeout(r, 2));
    await repo.create({ ...baseNoBattery, label: "C" });

    const limited = await repo.list({ limit: 2 });
    expect(limited.length).toBe(2);
    expect(limited[0]!.label).toBe("C");
    expect(limited[1]!.label).toBe("B");
  });
});

describe("update", () => {
  it("applies a patch and bumps updatedAt", async () => {
    const repo = makeRepo();
    const created = await repo.create(baseNoBattery);
    await new Promise((r) => setTimeout(r, 5));

    const updated = await repo.update(created.id, { label: "Renamed" });
    expect(updated).not.toBeNull();
    expect(updated!.label).toBe("Renamed");
    expect(updated!.createdAt).toBe(created.createdAt);
    expect(updated!.updatedAt > created.updatedAt).toBe(true);
  });

  it("does not allow overwriting id or createdAt", async () => {
    const repo = makeRepo();
    const created = await repo.create(baseNoBattery);
    const updated = await repo.update(created.id, {
      // @ts-expect-error — id is not part of UpdateEnergyRecordPatch
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
    const created = await repo.create(baseNoBattery);
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
    const r = await repo.create(baseNoBattery);
    const selected = await repo.select(r.id);
    expect(selected).not.toBeNull();
    expect(selected!.status).toBe("selected");
  });

  it("archives a previously selected record for the same project", async () => {
    const repo = makeRepo();
    const a = await repo.create({ ...baseNoBattery, label: "A" });
    const b = await repo.create({ ...baseNoBattery, label: "B" });

    await repo.select(a.id);
    await repo.select(b.id);

    const aAfter = await repo.get(a.id);
    const bAfter = await repo.get(b.id);
    expect(aAfter!.status).toBe("archived");
    expect(bAfter!.status).toBe("selected");
  });

  it("does NOT archive a selected record from a different project", async () => {
    const repo = makeRepo();
    const p1 = await repo.create({ ...baseNoBattery, projectId: "p1" });
    const p2 = await repo.create({ ...baseNoBattery, projectId: "p2" });

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

describe("archive", () => {
  it("marks a record as archived", async () => {
    const repo = makeRepo();
    const r = await repo.create(baseNoBattery);
    const archived = await repo.archive(r.id);
    expect(archived!.status).toBe("archived");
  });

  it("bumps updatedAt when archiving", async () => {
    const repo = makeRepo();
    const r = await repo.create(baseNoBattery);
    await new Promise((res) => setTimeout(res, 5));
    const archived = await repo.archive(r.id);
    expect(archived!.updatedAt > r.updatedAt).toBe(true);
  });

  it("returns null for a missing id", async () => {
    const repo = makeRepo();
    expect(await repo.archive("missing")).toBeNull();
  });
});

describe("seed", () => {
  it("accepts a seed array", async () => {
    const seed: EnergyRecord[] = [
      {
        id: "seed-1",
        projectId: "p1",
        label: "Seeded",
        days: 1,
        hasBattery: false,
        status: "selected",
        calculationVersion: "0.1.0",
        inputs: inputsNoBattery,
        result: resultNoBattery,
        warnings: [],
        errors: [],
        createdAt: "2026-01-01T00:00:00Z",
        updatedAt: "2026-01-01T00:00:00Z",
      },
    ];
    const repo = createInMemoryEnergyRepository(seed);
    const list = await repo.list();
    expect(list.length).toBe(1);
    expect(list[0]!.id).toBe("seed-1");
  });
});
