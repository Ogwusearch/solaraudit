/**
 * SolarAudit — Battery Repository: In-memory implementation
 *
 * A working stub that satisfies BatteryRepository without any storage.
 * The implementation is deliberately simple: a Map keyed by id, plus
 * helper functions for filtering and sorting. No business logic, no
 * validation, no engine calls.
 */

import type { BatteryRepository } from "./batteryRepository";
import type {
  BatteryListFilter,
  BatteryRecord,
  UpdateBatteryRecordPatch,
} from "./types";

let idCounter = 0;
function nextId(): string {
  idCounter += 1;
  return `bat-${Date.now().toString(36)}-${idCounter}`;
}

export function createInMemoryBatteryRepository(
  seed: readonly BatteryRecord[] = [],
): BatteryRepository {
  const store = new Map<string, BatteryRecord>();
  for (const r of seed) store.set(r.id, r);

  function sortByUpdatedDesc(items: readonly BatteryRecord[]): BatteryRecord[] {
    return [...items].sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
  }

  function applyFilter(
    items: readonly BatteryRecord[],
    filter?: BatteryListFilter,
  ): BatteryRecord[] {
    let result = [...items];
    if (filter?.projectId) {
      result = result.filter((r) => r.projectId === filter.projectId);
    }
    if (filter?.auditId) {
      result = result.filter((r) => r.auditId === filter.auditId);
    }
    if (filter?.status) {
      result = result.filter((r) => r.status === filter.status);
    }
    result = sortByUpdatedDesc(result);
    if (filter?.limit !== undefined) {
      result = result.slice(0, filter.limit);
    }
    return result;
  }

  function applyStatus(
    id: string,
    status: BatteryRecord["status"],
  ): BatteryRecord | null {
    const existing = store.get(id);
    if (!existing) return null;
    const updated: BatteryRecord = {
      ...existing,
      status,
      updatedAt: new Date().toISOString(),
    };
    store.set(id, updated);
    return updated;
  }

  return {
    async list(filter) {
      return applyFilter(Array.from(store.values()), filter);
    },

    async get(id) {
      return store.get(id) ?? null;
    },

    async create(input) {
      const now = new Date().toISOString();
      const record: BatteryRecord = {
        id: nextId(),
        projectId: input.projectId,
        auditId: input.auditId,
        name: input.name,
        status: input.status ?? "candidate",
        calculationVersion: input.calculationVersion,
        cellSpec: input.cellSpec,
        inputs: input.inputs,
        result: input.result,
        warnings: input.warnings,
        errors: input.errors,
        notes: input.notes,
        createdAt: now,
        updatedAt: now,
      };
      store.set(record.id, record);
      return record;
    },

    async update(id, patch: UpdateBatteryRecordPatch) {
      const existing = store.get(id);
      if (!existing) return null;

      const updated: BatteryRecord = {
        ...existing,
        ...patch,
        id: existing.id,
        createdAt: existing.createdAt,
        updatedAt: new Date().toISOString(),
      };
      store.set(id, updated);
      return updated;
    },

    async remove(id) {
      return store.delete(id);
    },

    async select(id) {
      const target = store.get(id);
      if (!target) return null;

      // Domain rule: at most one selected per project. Archive any
      // other record currently selected for the same project.
      const now = new Date().toISOString();
      for (const [otherId, other] of store.entries()) {
        if (
          otherId !== id &&
          other.projectId === target.projectId &&
          other.status === "selected"
        ) {
          store.set(otherId, {
            ...other,
            status: "archived",
            updatedAt: now,
          });
        }
      }

      const updated: BatteryRecord = {
        ...target,
        status: "selected",
        updatedAt: now,
      };
      store.set(id, updated);
      return updated;
    },

    async install(id) {
      return applyStatus(id, "installed");
    },

    async archive(id) {
      return applyStatus(id, "archived");
    },
  };
}
