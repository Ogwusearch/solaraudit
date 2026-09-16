/**
 * SolarAudit — Dashboard feature: Public surface
 */

export { DashboardPage } from "./components/DashboardPage";
export { useDashboard } from "./hooks/useDashboard";

export type {
  DashboardKpis,
  DashboardStatus,
  DashboardView,
  ProjectCard,
  ProjectMetrics,
  ProjectMetricsProvider,
  FormValidationErrors,
} from "./types";

export type {
  DashboardService,
  DashboardProjectsService,
} from "./services/dashboardService";

export { createDashboardService } from "./services/dashboardService";
export { createNoopMetricsProvider } from "./services/noopMetricsProvider";
export { createSampleMetricsProvider } from "./services/sampleMetricsProvider";
export { defaultDashboardService } from "./services/defaultDashboardService";
