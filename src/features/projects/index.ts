/**
 * SolarAudit — Projects feature: Public surface
 */

export { ProjectsPage } from "./components/ProjectsPage";
export { ProjectDetailPage } from "./components/ProjectDetailPage";
export { useProjects } from "./hooks/useProjects";

export type {
  Project,
  ProjectDraft,
  ProjectSummary,
  ProjectsStatus,
  ProjectsView,
  FormValidationErrors,
} from "./types";

export type { ProjectsService } from "./services/projectsService";
export type { ProjectRepository } from "./services/projectRepository";
export { createProjectsService } from "./services/projectsService";
export { createInMemoryProjectRepository } from "./services/inMemoryProjectRepository";
export { defaultProjectsService } from "./services/defaultProjectsService";
