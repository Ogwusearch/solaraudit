/**
 * SolarAudit — Audit Repository: In-memory implementation
 */

import type { AuditRepository } from "./auditRepository";
import type {
  Audit,
  AuditListFilter,
  UpdateAuditPatch,
} from "./types";

let idCounter = 0;
function nextId(): string {
  idCounter += 1;
  return `aud-${Date.now().toString(36)}-${idCounter}`;
}

export function createInMemoryAuditRepository(
  seed: readonly Audit[] = [],
): AuditRepository {
  const store = new Map<string, Audit>();
  for (const a of seed) store.set(a.id, a);

  function sortByUpdatedDesc(items: readonly Audit[]): Audit[] {
    return [...items].sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
  }

  function applyFilter(
    items: readonly Audit[],
    filter?: AuditListFilter,
  ): Audit[] {
    let result = [...items];
    if (filter?.projectId) {
      result = result.filter((a) => a.projectId === filter.projectId);
    }
    if (filter?.status) {
      result = result.filter((a) => a.status === filter.status);
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
      const audit: Audit = {
        id: nextId(),
        projectId: input.projectId,
        name: input.name,
        status: input.status ?? "draft",
        calculationVersion: input.calculationVersion,
        inputs: input.inputs,
        assumptions: input.assumptions,
        results: input.results,
        warnings: input.warnings,
        errors: input.errors,
        parentAuditId: input.parentAuditId,
        supersededBy: input.supersededBy,
        reportId: input.reportId,
        createdAt: now,
        updatedAt: now,
      };
      store.set(audit.id, audit);
      return audit;
    },
    async update(id, patch: UpdateAuditPatch) {
      const existing = store.get(id);
      if (!existing) return null;
      const updated: Audit = {
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
    async supersede(id, byAuditId) {
      const existing = store.get(id);
      const successor = store.get(byAuditId);
      if (!existing || !successor) return null;
      const updated: Audit = {
        ...existing,
        status: "superseded",
        supersededBy: byAuditId,
        updatedAt: new Date().toISOString(),
      };
      store.set(id, updated);
      return updated;
    },
  };
}
