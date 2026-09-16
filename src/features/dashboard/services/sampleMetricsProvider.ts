/**
 * SolarAudit — Dashboard feature: Sample metrics provider
 *
 * Returns plausible per-project metrics for demo purposes. Used by
 * the "Load sample" action — never by default. These are illustrative
 * only; they are NOT produced by running the engines.
 */

import type { ProjectMetrics, ProjectMetricsProvider } from "../types";

let seed = 0;

export function createSampleMetricsProvider(): ProjectMetricsProvider {
  return {
    async getMetrics(projectIds) {
      return projectIds.map((id, idx): ProjectMetrics => {
        // Deterministic pseudo-random from project id
        const h = hashId(id) + idx;
        return {
          projectId: id,
          dailyEnergyKwh: 8 + (h % 12),
          installedKwp: 2 + ((h >> 2) % 6),
          installedKwh: 4 + ((h >> 3) % 12),
          grandTotal: 4000 + ((h >> 4) % 8000),
          validationStatus: h % 5 === 0 ? "warning" : "valid",
        };
      });
    },
  };
}

function hashId(id: string): number {
  let h = seed++;
  for (let i = 0; i < id.length; i++) {
    h = (h * 31 + id.charCodeAt(i)) | 0;
  }
  return Math.abs(h);
}
