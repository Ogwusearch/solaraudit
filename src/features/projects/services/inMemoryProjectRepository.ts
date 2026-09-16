/**
 * SolarAudit — Projects feature: In-memory repository
 *
 * A working stub that implements ProjectRepository without any storage.
 * When real persistence arrives, write a second implementation
 * (e.g. d1ProjectRepository.ts) and swap it at the composition root.
 * Nothing else in the feature needs to change.
 */

import type { Project } from "../types";
import type { ProjectRepository } from "./projectRepository";

let idCounter = 0;
function nextId(): string {
  idCounter += 1;
  return `p-${Date.now().toString(36)}-${idCounter}`;
}

export function createInMemoryProjectRepository(
  seed: readonly Project[] = [],
): ProjectRepository {
  const store = new Map<string, Project>();
  for (const p of seed) store.set(p.id, p);

  return {
    async list() {
      return Array.from(store.values()).sort((a, b) =>
        b.updatedAt.localeCompare(a.updatedAt),
      );
    },

    async get(id) {
      return store.get(id) ?? null;
    },

    async create(input) {
      const now = new Date().toISOString();
      const project: Project = {
        id: nextId(),
        name: input.name,
        clientName: input.clientName,
        siteAddress: input.siteAddress,
        auditorName: input.auditorName,
        notes: input.notes,
        createdAt: now,
        updatedAt: now,
      };
      store.set(project.id, project);
      return project;
    },

    async update(id, patch) {
      const existing = store.get(id);
      if (!existing) return null;
      const updated: Project = {
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
  };
}
