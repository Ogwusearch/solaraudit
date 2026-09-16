/**
 * SolarAudit — Costing feature: Page
 *
 * Composes the feature. Binds the hook to presentational components.
 */

import { useCosting } from "../hooks/useCosting";
import { LineItemsTable } from "./LineItemsTable";
import { OverheadsForm } from "./OverheadsForm";
import { CostingResultPanel } from "./CostingResultPanel";

export function CostingPage() {
  const costing = useCosting();
  const busy = costing.status === "calculating";

  return (
    <main>
      <h1>Costing</h1>

      <LineItemsTable
        items={costing.draft.items}
        errors={costing.formErrors}
        disabled={busy}
        onField={costing.setItemField}
        onAdd={costing.addItem}
        onRemove={costing.removeItem}
      />

      <OverheadsForm
        currency={costing.draft.currency}
        wasteFactor={costing.draft.wasteFactor}
        discountPercent={costing.draft.discountPercent}
        taxPercent={costing.draft.taxPercent}
        installationPercent={costing.draft.overheads.installationPercent}
        transportPercent={costing.draft.overheads.transportPercent}
        engineeringPercent={costing.draft.overheads.engineeringPercent}
        contingencyPercent={costing.draft.overheads.contingencyPercent}
        errors={costing.formErrors}
        disabled={busy}
        onTopField={(field, value) =>
          costing.setTopField(field as never, value)
        }
        onOverheadField={(field, value) =>
          costing.setOverheadField(field as never, value)
        }
      />

      <div>
        <button type="button" onClick={costing.calculate} disabled={busy}>
          Calculate
        </button>
        <button type="button" onClick={costing.loadSample}>
          Load sample
        </button>
        <button type="button" onClick={costing.reset}>
          Reset
        </button>
      </div>

      <CostingResultPanel view={costing.view} />
    </main>
  );
}
