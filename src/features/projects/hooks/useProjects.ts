/**
 * SolarAudit — Projects feature: List hook
 *
 * Loads the project list and exposes actions for create/delete.
 * Calls the service; never the repository or the engineering engines.
 */

import { useCallback, useEffect, useState } from "react";
import type {
  FormValidationErrors,
  ProjectDraft,
  ProjectsStatus,
  ProjectSummary,
} from "../types";
import type { ProjectsService } from "../services/projectsService";
import { validateDraft } from "../services/projectsService";
import { defaultProjectsService } from "../services/defaultProjectsService";
import { createEmptyDraft } from "../services/projectsFactory";

export interface UseProjectsReturn {
  readonly projects: readonly ProjectSummary[];
  readonly status: ProjectsStatus;
  readonly formErrors: FormValidationErrors;

  readonly refresh: () => Promise<void>;
  readonly createProject: (draft: ProjectDraft) => Promise<ProjectSummary | null>;
  readonly deleteProject: (id: string) => Promise<boolean>;

  readonly validate: (draft: ProjectDraft) => FormValidationErrors;
  readonly newDraft: () => ProjectDraft;
}

export function useProjects(
  service: ProjectsService = defaultProjectsService,
): UseProjectsReturn {
  const [projects, setProjects] = useState<readonly ProjectSummary[]>([]);
  const [status, setStatus] = useState<ProjectsStatus>("idle");

  const refresh = useCallback(async () => {
    setStatus("loading");
    try {
      const summaries = await service.listSummaries();
      setProjects(summaries);
      setStatus("loaded");
    } catch {
      setStatus("error");
    }
  }, [service]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const createProject = useCallback(
    async (draft: ProjectDraft): Promise<ProjectSummary | null> => {
      const errors = validateDraft(draft);
      if (Object.keys(errors).length > 0) return null;

      setStatus("saving");
      try {
        const created = await service.createProject(draft);
        await refresh();
        return {
          id: created.id,
          name: created.name,
          clientName: created.clientName,
          siteAddress: created.siteAddress,
          updatedAt: created.updatedAt,
        };
      } catch {
        setStatus("error");
        return null;
      }
    },
    [service, refresh],
  );

  const deleteProject = useCallback(
    async (id: string): Promise<boolean> => {
      setStatus("saving");
      try {
        const ok = await service.deleteProject(id);
        await refresh();
        return ok;
      } catch {
        setStatus("error");
        return false;
      }
    },
    [service, refresh],
  );

  return {
    projects,
    status,
    formErrors: {},
    refresh,
    createProject,
    deleteProject,
    validate: validateDraft,
    newDraft: createEmptyDraft,
  };
}
