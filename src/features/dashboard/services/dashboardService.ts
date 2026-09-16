/**
 * SolarAudit — Dashboard feature: Application service
 *
 * The ONLY file in the feature that composes other features' data.
 *
 * Dependencies are injected at construction time:
 *   - projectsService       (required) — provides the project list
 *   - metricsProvider       (optional) — provides per-project metrics
 *
 * The service is pure orchestration:
 *   load project list -> load metrics -> aggregate -> return view
 *
 * It does not compute engineering values. It sums numbers that other
 * features produced. If a number is not available, its tile is null.
 */

import type { ProjectSummary } from "../../projects";
import type {
  DashboardKpis,
  DashboardView,
  ProjectCard,
  ProjectMetrics,
  ProjectMetricsProvider,
} from "../types";

/**
 * Minimal shape the Dashboard needs from the Projects service.
 * Declared here so the Dashboard feature does not depend on the
 * Projects service's full interface — only on the method it uses.
 */
export interface DashboardProjectsService {
  listSummaries(): Promise<readonly ProjectSummary[]>;
}

export interface DashboardService {
  load(currency?: string): Promise<DashboardView>;
}

function aggregateKpis(
  cards: readonly ProjectCard[],
  currency: string | null,
): DashboardKpis {
  let anyEnergy = false;
  let anyKwp = false;
  let anyKwh = false;
  let anyCost = false;

  let energy = 0;
  let kwp = 0;
  let kwh = 0;
  let cost = 0;

  for (const c of cards) {
    const m = c.metrics;
    if (!m) continue;

    anyEnergy = true;
    anyKwp = true;
    anyKwh = true;
    energy += m.dailyEnergyKwh;
    kwp += m.installedKwp;
    kwh += m.installedKwh;

    if (m.grandTotal !== undefined) {
      anyCost = true;
      cost += m.grandTotal;
    }
  }

  return {
    projectCount: cards.length,
    totalDailyEnergyKwh: anyEnergy ? round(energy) : null,
    totalInstalledKwp: anyKwp ? round(kwp) : null,
    totalInstalledKwh: anyKwh ? round(kwh) : null,
    totalGrandTotal: anyCost ? round(cost, 2) : null,
    currency,
  };
}

function round(value: number, decimals = 3): number {
  const factor = 10 ** decimals;
  return Math.round(value * factor) / factor;
}

export function createDashboardService(
  projectsService: DashboardProjectsService,
  metricsProvider?: ProjectMetricsProvider,
): DashboardService {
  return {
    async load(currency?: string) {
      const summaries = await projectsService.listSummaries();
      const ids = summaries.map((s) => s.id);

      let metricsById = new Map<string, ProjectMetrics>();
      if (metricsProvider && ids.length > 0) {
        const metrics = await metricsProvider.getMetrics(ids);
        metricsById = new Map(metrics.map((m) => [m.projectId, m]));
      }

      const projects: ProjectCard[] = summaries.map((s) => ({
        id: s.id,
        name: s.name,
        clientName: s.clientName,
        siteAddress: s.siteAddress,
        updatedAt: s.updatedAt,
        metrics: metricsById.get(s.id) ?? null,
      }));

      return {
        kpis: aggregateKpis(projects, currency ?? null),
        projects,
        loadedAt: new Date().toISOString(),
      };
    },
  };
}
