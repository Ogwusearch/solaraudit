/**
 * SolarAudit — Dashboard feature: Types
 *
 * Feature-local view models.
 *
 * IMPORTANT: no engineering formula lives here.
 *
 * Dashboard is READ-ONLY. It composes two kinds of data:
 *   1. Project list       — sourced from the Projects feature
 *   2. Project metrics    — sourced from a future project-state store
 *                           (per-project summary numbers, if available)
 *
 * Absent metrics are represented as null and rendered as "—".
 */

import type { ProjectSummary } from "../projects";

export interface ProjectMetrics {
  readonly projectId: string;
  readonly dailyEnergyKwh: number;
  readonly installedKwp: number;
  readonly installedKwh: number;
  readonly grandTotal?: number;
  readonly validationStatus?: "valid" | "warning" | "invalid";
}

export interface ProjectCard {
  readonly id: string;
  readonly name: string;
  readonly clientName?: string;
  readonly siteAddress?: string;
  readonly updatedAt: string;
  readonly metrics: ProjectMetrics | null;
}

export interface DashboardKpis {
  readonly projectCount: number;
  readonly totalDailyEnergyKwh: number | null;
  readonly totalInstalledKwp: number | null;
  readonly totalInstalledKwh: number | null;
  readonly totalGrandTotal: number | null;
  readonly currency: string | null;
}

export interface DashboardView {
  readonly kpis: DashboardKpis;
  readonly projects: readonly ProjectCard[];
  readonly loadedAt: string;
}

/**
 * The Dashboard service's view of what it needs to compose a view.
 * Passed in as a dependency — Dashboard does not import Projects'
 * repository, and it does not import the Projects service directly
 * except through its public surface.
 */
export interface ProjectMetricsProvider {
  getMetrics(projectIds: readonly string[]): Promise<readonly ProjectMetrics[]>;
}

export interface FormValidationErrors {
  readonly [fieldKey: string]: string | undefined;
}

export type DashboardStatus =
  | "idle"
  | "loading"
  | "loaded"
  | "error";

// Re-export the type Dashboard consumes so consumers do not need to
// import from Projects directly.
export type { ProjectSummary } from "../projects";
