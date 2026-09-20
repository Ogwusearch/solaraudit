
/**
 * SolarAudit — Projects feature: Types
 *
 * Feature-local domain model.
 *
 * Projects are records that identify an engineering/audit project.
 * Engineering calculations such as kWp, kWh, battery capacity, cable
 * sizing, protection, and costing are handled by the engineering layer.
 */

export interface Project {
  readonly id: string;
  readonly name: string;
  readonly clientName?: string;
  readonly siteAddress?: string;
  readonly auditorName?: string;
  readonly notes?: string;

  /** ISO 8601 timestamp */
  readonly createdAt: string;

  /** ISO 8601 timestamp */
  readonly updatedAt: string;
}

/**
 * Form state used when creating or editing a project.
 *
 * Draft fields are required because the form controls use strings.
 * Persistence/application logic may normalize empty strings to undefined.
 */
export interface ProjectDraft {
  readonly name: string;
  readonly clientName: string;
  readonly siteAddress: string;
  readonly auditorName: string;
  readonly notes: string;
}

/**
 * Lightweight representation used by the project list.
 *
 * Derived from Project when loaded from the repository.
 */
export interface ProjectSummary {
  readonly id: string;
  readonly name: string;
  readonly clientName?: string;
  readonly siteAddress?: string;
  readonly updatedAt: string;
}

/**
 * Data required by the projects list view.
 */
export interface ProjectsView {
  readonly projects: readonly ProjectSummary[];
  readonly loadedAt: string;
}

/**
 * Field-level validation errors.
 *
 * Example:
 *
 * {
 *   name: "Project name is required.",
 *   clientName: "Client name is too long."
 * }
 */
export interface FormValidationErrors {
  readonly [fieldKey: string]: string | undefined;
}

/**
 * Projects feature lifecycle state.
 */
export type ProjectsStatus =
  | "idle"
  | "loading"
  | "loaded"
  | "saving"
  | "error";
