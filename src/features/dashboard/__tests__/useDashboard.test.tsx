import { describe, it, expect } from "vitest";
import { act, renderHook, waitFor } from "@testing-library/react";
import { useDashboard } from "../hooks/useDashboard";
import { createDashboardService } from "../services/dashboardService";
import type { ProjectSummary } from "../../projects";

function fakeProjects(summaries: readonly ProjectSummary[]) {
  return {
    async listSummaries() {
      return summaries;
    },
  };
}

const summaries: ProjectSummary[] = [
  {
    id: "p1",
    name: "Home A",
    updatedAt: "2026-09-12T10:00:00Z",
  },
];

describe("useDashboard", () => {
  it("loads on mount and reaches the loaded state", async () => {
    const svc = createDashboardService(fakeProjects(summaries));
    const { result } = renderHook(() => useDashboard(svc));
    await waitFor(() => expect(result.current.status).toBe("loaded"));
    expect(result.current.view).not.toBeNull();
    expect(result.current.view!.projects.length).toBe(1);
  });

  it("refresh re-fetches the data", async () => {
    let calls = 0;
    const svc = {
      async load() {
        calls += 1;
        return {
          kpis: {
            projectCount: calls,
            totalDailyEnergyKwh: null,
            totalInstalledKwp: null,
            totalInstalledKwh: null,
            totalGrandTotal: null,
            currency: null,
          },
          projects: [],
          loadedAt: new Date().toISOString(),
        };
      },
    };

    const { result } = renderHook(() => useDashboard(svc));
    await waitFor(() => expect(result.current.status).toBe("loaded"));
    expect(result.current.view!.kpis.projectCount).toBe(1);

    await act(async () => {
      await result.current.refresh();
    });
    expect(result.current.view!.kpis.projectCount).toBe(2);
  });

  it("reaches the error state on service failure", async () => {
    const svc = {
      async load() {
        throw new Error("boom");
      },
    };

    const { result } = renderHook(() => useDashboard(svc));
    await waitFor(() => expect(result.current.status).toBe("error"));
    expect(result.current.view).toBeNull();
  });
});
