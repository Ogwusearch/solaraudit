/**
 * SolarAudit — Energy Repository: In-memory implementation
 *
 * A working stub that satisfies EnergyRepository without any storage.
 * The implementation is deliberately simple: a Map keyed by id, plus
 * helper functions for filtering and sorting. No business logic, no
 * validation, no engine calls.
 */

import type { EnergyRepository } from "./energyRepository";
import type {
  CreateEnergyRecordInput,
  EnergyListFilter,
  EnergyRecord,
  UpdateEnergyRecordPatch,
} from "./types";

let idCounter = 0;
function nextId(): string {
  idCounter += 1;
  return `eng-${Date.now().toString(36)}-${idCounter}`;
}

export function createInMemoryEnergyRepository(
  seed: readonly EnergyRecord[] = [],
): EnergyRepository {
  const store = new Map<string, EnergyRecord>();
  for (const r of seed) store.set(r.id, r);

  function sortByUpdatedDesc(
    items: readonly EnergyRecord[],
  ): EnergyRecord[] {
    return [...items].sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
  }

  function applyFilter(
    items: readonly EnergyRecord[],
    filter?: EnergyListFilter,
  ): EnergyRecord[] {
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
    if (filter?.hasBattery !== undefined) {
      result = result.filter((r) => r.hasBattery === filter.hasBattery);
    }
    result = sortByUpdatedDesc(result);
    if (filter?.limit !== undefined) {
      result = result.slice(0, filter.limit);
    }
    return result;
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
      const record: EnergyRecord = {
        id: nextId(),
        projectId: input.projectId,
        auditId: input.auditId,
        label: input.label,
        days: input.days,
        hasBattery: input.hasBattery,
        status: input.status ?? "draft",
        calculationVersion: input.calculationVersion,
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

    async update(id, patch: UpdateEnergyRecordPatch) {
      const existing = store.get(id);
      if (!existing) return null;

      const updated: EnergyRecord = {
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

      // Domain rule: at most one selected energy scenario per
      // project. Archive any other record currently selected for the
      // same project.
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

      const updated: EnergyRecord = {
        ...target,
        status: "selected",
        updatedAt: now,
      };
      store.set(id, updated);
      return updated;
    },

    async archive(id) {
      const existing = store.get(id);
      if (!existing) return null;
      const updated: EnergyRecord = {
        ...existing,
        status: "archived",
        updatedAt: new Date().toISOString(),
      };
      store.set(id, updated);
      return updated;
    },
  };
}
