/**
 * SolarAudit — Load Audit feature: Page
 *
 * Composes the feature. Binds the hook to presentational components.
 * The page has no engineering logic and no direct import from
 * `engineering/`.
 */

import { useLoadAudit } from "../hooks/useLoadAudit";
import { ApplianceTable } from "./ApplianceTable";
import { LoadAuditControls } from "./LoadAuditControls";
import { LoadAuditResultPanel } from "./LoadAuditResultPanel";

export function LoadAuditPage() {
  const audit = useLoadAudit();

  const busy = audit.status === "calculating";

  return (
    <main>
      <h1>Load Audit</h1>

      <ApplianceTable
        rows={audit.draft.appliances}
        errors={audit.formErrors}
        onAddRow={audit.addRow}
        onChangeName={audit.setName}
        onChangePower={audit.setPower}
        onChangeHours={audit.setHours}
        onChangeQuantity={audit.setQuantity}
        onChangeEssential={audit.setEssential}
        onRemoveRow={audit.removeRow}
      />

      <LoadAuditControls
        diversityFactor={audit.draft.diversityFactor}
        safetyMargin={audit.draft.safetyMargin}
        diversityError={audit.formErrors["diversityFactor"]}
        safetyError={audit.formErrors["safetyMargin"]}
        disabled={busy}
        onChangeDiversityFactor={audit.setDiversityFactor}
        onChangeSafetyMargin={audit.setSafetyMargin}
        onCalculate={audit.calculate}
        onReset={audit.reset}
        onLoadSample={audit.loadSample}
      />

      <LoadAuditResultPanel view={audit.view} />
    </main>
  );
}
