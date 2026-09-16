/**
 * SolarAudit — Cable Repository: In-memory implementation
 *
 * A working stub that satisfies CableRepository without any storage.
 * The implementation is deliberately simple: a Map keyed by id, plus
 * helper functions for filtering and sorting. No business logic, no
 * validation, no engine calls.
 */

import type { CableRepository } from "./cableRepository";
import type {
  CableListFilter,
  CableRecord,
  CreateCableRecordInput,
  UpdateCableRecordPatch,
} from "./types";

let idCounter = 0;
function nextId(): string {
  idCounter += 1;
  return `cab-${Date.now().toString(36)}-${idCounter}`;
}

export function createInMemoryCableRepository(
  seed: readonly CableRecord[] = [],
): CableRepository {
  const store = new Map<string, CableRecord>();
  for (const r of seed) store.set(r.id, r);

  function sortByUpdatedDesc(items: readonly CableRecord[]): CableRecord[] {
    return [...items].sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
  }

  function applyFilter(
    items: readonly CableRecord[],
    filter?: CableListFilter,
  ): CableRecord[] {
    let result = [...items];
    if (filter?.projectId) {
      result = result.filter((r) => r.projectId === filter.projectId);
    }
    if (filter?.auditId) {
      result = result.filter((r) => r.auditId === filter.auditId);
    }
    if (filter?.circuitRole) {
      result = result.filter((r) => r.circuitRole === filter.circuitRole);
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
    status: CableRecord["status"],
  ): CableRecord | null {
    const existing = store.get(id);
    if (!existing) return null;
    const updated: CableRecord = {
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
      const record: CableRecord = {
        id: nextId(),
        projectId: input.projectId,
        auditId: input.auditId,
        label: input.label,
        circuitRole: input.circuitRole,
        circuitType: input.circuitType,
        material: input.material,
        installationMethod: input.installationMethod,
        status: input.status ?? "candidate",
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

    async update(id, patch: UpdateCableRecordPatch) {
      const existing = store.get(id);
      if (!existing) return null;

      const updated: CableRecord = {
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

      // Domain rule: at most one selected per (project, circuitRole).
      // Archive any other record currently selected for the same
      // project AND the same role. Records for other roles are left
      // untouched.
      const now = new Date().toISOString();
      for (const [otherId, other] of store.entries()) {
        if (
          otherId !== id &&
          other.projectId === target.projectId &&
          other.circuitRole === target.circuitRole &&
          other.status === "selected"
        ) {
          store.set(otherId, {
            ...other,
            status: "archived",
            updatedAt: now,
          });
        }
      }

      const updated: CableRecord = {
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
