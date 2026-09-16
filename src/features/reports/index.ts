/**
 * SolarAudit — Reports feature: Public surface
 *
 * Consumers can use:
 *   - ReportsPage          for the standalone route
 *   - useReports           for embedding in a project-scoped page
 *   - ProjectSnapshot      for supplying project state
 *   - assembleReportInput  for compiling a ReportInput manually
 */

export { ReportsPage } from "./components/ReportsPage";
export { useReports } from "./hooks/useReports";
export { assembleReportInput } from "./services/reportsService";
export type {
  AssumptionDraft,
  ProjectSnapshot,
  ReportsFormDraft,
  ReportsStatus,
  ReportsView,
  FormValidationErrors,
} from "./types";
