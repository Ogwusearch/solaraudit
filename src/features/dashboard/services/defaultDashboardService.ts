/**
 * SolarAudit — Dashboard feature: Default service instance
 *
 * The composition root for the Dashboard feature. It is the ONLY file
 * in the feature that names a concrete Projects service. If the app
 * later wants to inject a different Projects service (e.g. from a
 * React context), it provides its own — this default is just for the
 * standalone route and for tests.
 */

import { defaultProjectsService } from "../../projects";
import { createDashboardService } from "./dashboardService";
import { createNoopMetricsProvider } from "./noopMetricsProvider";

export const defaultDashboardService = createDashboardService(
  defaultProjectsService,
  createNoopMetricsProvider(),
);
