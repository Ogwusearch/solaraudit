/**
 * SolarAudit — Dashboard feature: No-op metrics provider
 *
 * Used until project-state integration lands. Returns an empty list,
 * so every project card has metrics:null and every KPI tile renders
 * as "—". This is honest — the dashboard does not invent numbers.
 */

import type { ProjectMetricsProvider } from "../types";

export function createNoopMetricsProvider(): ProjectMetricsProvider {
  return {
    async getMetrics(_projectIds) {
      return [];
    },
  };
}
