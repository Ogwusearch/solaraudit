import { describe, it, expect } from "vitest";
import { createDashboardService } from "../services/dashboardService";
import { createNoopMetricsProvider } from "../services/noopMetricsProvider";
import { createSampleMetricsProvider } from "../services/sampleMetricsProvider";
import type { ProjectMetrics, ProjectMetricsProvider } from "../types";
import type { ProjectSummary } from "../../projects";

function fakeProjects(summaries: readonly ProjectSummary[]) {
  return {
    async listSummaries() {
      return summaries;
    },
  };
}

const sampleSummaries: ProjectSummary[] = [
  {
    id: "p1",
    name: "Home A",
    clientName: "Mr. A",
    siteAddress: "Site A",
    updatedAt: "2026-09-12T10:00:00Z",
  },
  {
    id: "p2",
    name: "Home B",
    updatedAt: "2026-09-12T11:00:00Z",
  },
];

describe("createDashboardService — no metrics provider", () => {
  it("returns the project list with null metrics", async () => {
    const svc = createDashboardService(fakeProjects(sampleSummaries));
    const v = await svc.load();
    expect(v.projects.length).toBe(2);
    expect(v.projects[0]!.metrics).toBeNull();
    expect(v.projects[1]!.metrics).toBeNull();
  });

  it("KPI tiles are null when no metrics are available", async () => {
    const svc = createDashboardService(fakeProjects(sampleSummaries));
    const v = await svc.load("USD");
    expect(v.kpis.projectCount).toBe(2);
    expect(v.kpis.totalDailyEnergyKwh).toBeNull();
    expect(v.kpis.totalInstalledKwp).toBeNull();
    expect(v.kpis.totalInstalledKwh).toBeNull();
    expect(v.kpis.totalGrandTotal).toBeNull();
    expect(v.kpis.currency).toBe("USD");
  });

  it("handles empty project list", async () => {
    const svc = createDashboardService(fakeProjects([]));
    const v = await svc.load();
    expect(v.projects).toEqual([]);
    expect(v.kpis.projectCount).toBe(0);
  });
});

describe("createDashboardService — with metrics", () => {
  const provider: ProjectMetricsProvider = {
    async getMetrics(ids): Promise<readonly ProjectMetrics[]> {
      return ids.map((id) => ({
        projectId: id,
        dailyEnergyKwh: id === "p1" ? 10 : 20,
        installedKwp: id === "p1" ? 3 : 5,
        installedKwh: id === "p1" ? 6 : 10,
        grandTotal: id === "p1" ? 5000 : 8000,
      }));
    },
  };

  it("merges metrics onto project cards", async () => {
    const svc = createDashboardService(fakeProjects(sampleSummaries), provider);
    const v = await svc.load();
    expect(v.projects[0]!.metrics).not.toBeNull();
    expect(v.projects[0]!.metrics!.dailyEnergyKwh).toBe(10);
    expect(v.projects[1]!.metrics!.dailyEnergyKwh).toBe(20);
  });

  it("aggregates KPI tiles across projects", async () => {
    const svc = createDashboardService(fakeProjects(sampleSummaries), provider);
    const v = await svc.load("USD");
    expect(v.kpis.totalDailyEnergyKwh).toBe(30);
    expect(v.kpis.totalInstalledKwp).toBe(8);
    expect(v.kpis.totalInstalledKwh).toBe(16);
    expect(v.kpis.totalGrandTotal).toBe(13000);
    expect(v.kpis.currency).toBe("USD");
  });

  it("sums only the metrics that are present", async () => {
    const partial: ProjectMetricsProvider = {
      async getMetrics() {
        return [
          {
            projectId: "p1",
            dailyEnergyKwh: 10,
            installedKwp: 3,
            installedKwh: 6,
            // no grandTotal
          },
        ];
      },
    };
    const svc = createDashboardService(fakeProjects(sampleSummaries), partial);
    const v = await svc.load("USD");
    expect(v.kpis.totalDailyEnergyKwh).toBe(10);
    expect(v.kpis.totalGrandTotal).toBeNull();
  });
});

describe("noopMetricsProvider", () => {
  it("returns an empty list", async () => {
    const p = createNoopMetricsProvider();
    const r = await p.getMetrics(["p1", "p2"]);
    expect(r).toEqual([]);
  });
});

describe("sampleMetricsProvider", () => {
  it("returns one metric per project id", async () => {
    const p = createSampleMetricsProvider();
    const r = await p.getMetrics(["p1", "p2", "p3"]);
    expect(r.length).toBe(3);
    expect(r.map((m) => m.projectId).sort()).toEqual(["p1", "p2", "p3"]);
  });

  it("produces finite positive numbers", async () => {
    const p = createSampleMetricsProvider();
    const [m] = await p.getMetrics(["p1"]);
    expect(m!.dailyEnergyKwh).toBeGreaterThan(0);
    expect(m!.installedKwp).toBeGreaterThan(0);
    expect(m!.installedKwh).toBeGreaterThan(0);
    expect(m!.grandTotal).toBeGreaterThan(0);
  });
});
