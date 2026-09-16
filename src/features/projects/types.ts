/**
 * SolarAudit — Projects feature: Types
 *
 * Feature-local domain model. NOT an engineering engine input/output.
 * Projects are records — an id, a name, a client, a site, timestamps.
 * Engineering values (kWp, kWh, cost) are computed elsewhere and are
 * not stored on the Project itself.
 */

export interface Project {
  readonly id: string;
  readonly name: string;
  readonly clientName?: string;
  readonly siteAddress?: string;
  readonly auditorName?: string;
  readonly notes?: string;
  readonly createdAt: string;      // ISO 8601
  readonly updatedAt: string;      // ISO 8601
}

export interface ProjectDraft {
  readonly name: string;
  readonly clientName: string;
  readonly siteAddress: string;
  readonly auditorName: string;
  readonly notes: string;
}

/**
 * What the list shows. Derive this from the full Project when reading
 * from the repository. A future version may compute summary metrics by
 * querying downstream engines; today it is just the base record.
 */
export interface ProjectSummary {
  readonly id: string;
  readonly name: string;
  readonly clientName?: string;
  readonly siteAddress?: string;
  readonly updatedAt: string;
}

export interface ProjectsView {
  readonly projects: readonly ProjectSummary[];
  readonly loadedAt: string;
}

export interface FormValidationErrors {
  readonly [fieldKey: string]: string | undefined;
}

export type ProjectsStatus =
  | "idle"
  | "loading"
  | "loaded"
  | "saving"
  | "error";
