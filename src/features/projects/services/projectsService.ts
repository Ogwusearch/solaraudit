/**
 * SolarAudit — Projects feature: Application service
 *
 * The ONLY place the feature reaches persistence. Components and hooks
 * call this; they never touch the repository directly.
 *
 * If the feature ever needs to compute a summary metric (e.g. the
 * latest solar sizing result for a project), the orchestration lives
 * HERE — service calls the relevant engine and merges the result into
 * a ProjectSummary. Components never orchestrate.
 */

import type { Project, ProjectDraft, ProjectSummary } from "../types";
import type { ProjectRepository } from "./projectRepository";

export interface ProjectsService {
  listSummaries(): Promise<readonly ProjectSummary[]>;
  getProject(id: string): Promise<Project | null>;
  createProject(draft: ProjectDraft): Promise<Project>;
  updateProject(id: string, draft: ProjectDraft): Promise<Project | null>;
  deleteProject(id: string): Promise<boolean>;
}

export function createProjectsService(repo: ProjectRepository): ProjectsService {
  return {
    async listSummaries() {
      const projects = await repo.list();
      return projects.map(toSummary);
    },

    async getProject(id) {
      return repo.get(id);
    },

    async createProject(draft) {
      return repo.create({
        name: draft.name.trim(),
        clientName: draft.clientName.trim() || undefined,
        siteAddress: draft.siteAddress.trim() || undefined,
        auditorName: draft.auditorName.trim() || undefined,
        notes: draft.notes.trim() || undefined,
      });
    },

    async updateProject(id, draft) {
      return repo.update(id, {
        name: draft.name.trim(),
        clientName: draft.clientName.trim() || undefined,
        siteAddress: draft.siteAddress.trim() || undefined,
        auditorName: draft.auditorName.trim() || undefined,
        notes: draft.notes.trim() || undefined,
      });
    },

    async deleteProject(id) {
      return repo.remove(id);
    },
  };
}

function toSummary(p: Project): ProjectSummary {
  return {
    id: p.id,
    name: p.name,
    clientName: p.clientName,
    siteAddress: p.siteAddress,
    updatedAt: p.updatedAt,
  };
}

/**
 * Form-level validation. No engine validation — Projects is not a
 * sizing engine. This is purely "is the form complete enough to save?".
 */
export function validateDraft(draft: ProjectDraft): Record<string, string> {
  const errors: Record<string, string> = {};

  if (draft.name.trim() === "") {
    errors["name"] = "Project name is required.";
  }

  if (draft.name.trim().length > 120) {
    errors["name"] = "Project name must be 120 characters or fewer.";
  }

  if (draft.clientName.trim().length > 120) {
    errors["clientName"] = "Client name must be 120 characters or fewer.";
  }

  if (draft.siteAddress.trim().length > 240) {
    errors["siteAddress"] = "Site address must be 240 characters or fewer.";
  }

  if (draft.auditorName.trim().length > 120) {
    errors["auditorName"] = "Auditor name must be 120 characters or fewer.";
  }

  return errors;
}
