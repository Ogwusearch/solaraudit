/**
 * SolarAudit — Costing Repository: In-memory implementation
 *
 * A working stub that satisfies CostingRepository without any storage.
 * The implementation is deliberately simple: a Map keyed by id, plus
 * helper functions for filtering and sorting. No business logic, no
 * validation, no engine calls.
 */

import type { CostingRepository } from "./costingRepository";
import type {
  CostingListFilter,
  CostingRecord,
  CreateCostingRecordInput,
  UpdateCostingRecordPatch,
} from "./types";

let idCounter = 0;
function nextId(): string {
  idCounter += 1;
  return `cst-${Date.now().toString(36)}-${idCounter}`;
}

export function createInMemoryCostingRepository(
  seed: readonly CostingRecord[] = [],
): CostingRepository {
  const store = new Map<string, CostingRecord>();
  for (const r of seed) store.set(r.id, r);

  function sortByUpdatedDesc(
    items: readonly CostingRecord[],
  ): CostingRecord[] {
    return [...items].sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
  }

  function applyFilter(
    items: readonly CostingRecord[],
    filter?: CostingListFilter,
  ): CostingRecord[] {
    let result = [...items];
    if (filter?.projectId) {
      result = result.filter((r) => r.projectId === filter.projectId);
    }
    if (filter?.auditId) {
      result = result.filter((r) => r.auditId === filter.auditId);
    }
    if (filter?.currency) {
      result = result.filter((r) => r.currency === filter.currency);
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
    status: CostingRecord["status"],
  ): CostingRecord | null {
    const existing = store.get(id);
    if (!existing) return null;
    const updated: CostingRecord = {
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
      const record: CostingRecord = {
        id: nextId(),
        projectId: input.projectId,
        auditId: input.auditId,
        label: input.label,
        currency: input.currency,
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

    async update(id, patch: UpdateCostingRecordPatch) {
      const existing = store.get(id);
      if (!existing) return null;

      const updated: CostingRecord = {
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

      // Domain rule: at most one selected costing per project.
      // Archive any other record currently selected for the same
      // project. Records with status "final" are left alone — they
      // are frozen plans and are not affected by re-selection.
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

      const updated: CostingRecord = {
        ...target,
        status: "selected",
        updatedAt: now,
      };
      store.set(id, updated);
      return updated;
    },

    async finalize(id) {
      return applyStatus(id, "final");
    },

    async archive(id) {
      return applyStatus(id, "archived");
    },
  };
}
