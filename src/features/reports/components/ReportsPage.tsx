/**
 * SolarAudit — Reports feature: Page
 *
 * Composes the feature. Binds the hook to presentational components.
 */

import { useReports } from "../hooks/useReports";
import { ReportMetadataForm } from "./ReportMetadataForm";
import { AssumptionsTable } from "./AssumptionsTable";
import { SnapshotStatus } from "./SnapshotStatus";
import { ReportsResultPanel } from "./ReportsResultPanel";

export function ReportsPage() {
  const reports = useReports();
  const busy = reports.status === "generating";
  const setMeta = (field: string, value: string) =>
    reports.setMetadataField(field as never, value);

  return (
    <main>
      <h1>Reports</h1>

      <ReportMetadataForm
        projectName={reports.draft.projectName}
        clientName={reports.draft.clientName}
        siteAddress={reports.draft.siteAddress}
        auditorName={reports.draft.auditorName}
        reportVersion={reports.draft.reportVersion}
        calculationVersion={reports.draft.calculationVersion}
        generatedAtIso={reports.draft.generatedAtIso}
        currency={reports.draft.currency}
        errors={reports.formErrors}
        disabled={busy}
        onField={setMeta}
      />

      <AssumptionsTable
        assumptions={reports.draft.assumptions}
        errors={reports.formErrors}
        disabled={busy}
        onField={reports.setAssumptionField}
        onAdd={reports.addAssumption}
        onRemove={reports.removeAssumption}
      />

      <SnapshotStatus snapshot={reports.snapshot} />

      <div>
        <button
          type="button"
          onClick={reports.generate}
          disabled={busy}
        >
          Generate report
        </button>
        <button type="button" onClick={reports.loadSample}>
          Load sample
        </button>
        <button type="button" onClick={reports.reset}>
          Reset
        </button>
      </div>

      <ReportsResultPanel view={reports.view} />
    </main>
  );
}
