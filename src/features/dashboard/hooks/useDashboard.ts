/**
 * SolarAudit — Dashboard feature: Hook
 *
 * Loads the dashboard view and exposes refresh. Calls the service;
 * never reaches into another feature directly.
 */

import { useCallback, useEffect, useState } from "react";
import type { DashboardStatus, DashboardView } from "../types";
import type { DashboardService } from "../services/dashboardService";
import { defaultDashboardService } from "../services/defaultDashboardService";

export interface UseDashboardReturn {
  readonly view: DashboardView | null;
  readonly status: DashboardStatus;

  readonly refresh: () => Promise<void>;
}

export function useDashboard(
  service: DashboardService = defaultDashboardService,
  currency?: string,
): UseDashboardReturn {
  const [view, setView] = useState<DashboardView | null>(null);
  const [status, setStatus] = useState<DashboardStatus>("idle");

  const refresh = useCallback(async () => {
    setStatus("loading");
    try {
      const v = await service.load(currency);
      setView(v);
      setStatus("loaded");
    } catch {
      setStatus("error");
    }
  }, [service, currency]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  return { view, status, refresh };
}
