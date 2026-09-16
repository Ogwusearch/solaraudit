/**
 * SolarAudit — Cable Sizing feature: Page
 *
 * Composes the feature. Binds the hook to presentational components.
 */

import { useCableSizing } from "../hooks/useCableSizing";
import { CableCircuitForm } from "./CableCircuitForm";
import { CableSelectionForm } from "./CableSelectionForm";
import { CableConditionsForm } from "./CableConditionsForm";
import { CableSizingResultPanel } from "./CableSizingResultPanel";

export function CableSizingPage() {
  const sizing = useCableSizing();
  const busy = sizing.status === "calculating";
  const set = (field: string, value: string) =>
    sizing.setField(field as never, value);

  return (
    <main>
      <h1>Cable Sizing</h1>

      <CableCircuitForm
        currentA={sizing.draft.currentA}
        lengthM={sizing.draft.lengthM}
        systemVoltage={sizing.draft.systemVoltage}
        allowableDropPercent={sizing.draft.allowableDropPercent}
        errors={sizing.formErrors}
        disabled={busy}
        onField={set}
      />

      <CableSelectionForm
        material={sizing.draft.material}
        circuitType={sizing.draft.circuitType}
        installationMethod={sizing.draft.installationMethod}
        errors={sizing.formErrors}
        disabled={busy}
        onField={set}
      />

      <CableConditionsForm
        ambientTemperatureC={sizing.draft.ambientTemperatureC}
        conductorTempC={sizing.draft.conductorTempC}
        groupingCount={sizing.draft.groupingCount}
        designMargin={sizing.draft.designMargin}
        errors={sizing.formErrors}
        disabled={busy}
        onField={set}
      />

      <div>
        <button type="button" onClick={sizing.calculate} disabled={busy}>
          Calculate
        </button>
        <button type="button" onClick={sizing.loadSample}>
          Load sample
        </button>
        <button type="button" onClick={sizing.reset}>
          Reset
        </button>
      </div>

      <CableSizingResultPanel view={sizing.view} />
    </main>
  );
}
