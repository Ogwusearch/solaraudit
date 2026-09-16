/**
 * SolarAudit — Energy Analysis feature: Page
 *
 * Composes the feature. Binds the hook to presentational components.
 */

import { useEnergyAnalysis } from "../hooks/useEnergyAnalysis";
import { PvArrayList } from "./PvArrayList";
import { ConsumptionForm } from "./ConsumptionForm";
import { BatteryOptionalForm } from "./BatteryOptionalForm";
import { EnergyAnalysisResultPanel } from "./EnergyAnalysisResultPanel";

export function EnergyAnalysisPage() {
  const analysis = useEnergyAnalysis();
  const busy = analysis.status === "calculating";

  return (
    <main>
      <h1>Energy Analysis</h1>

      <PvArrayList
        arrays={analysis.draft.pvArrays}
        errors={analysis.formErrors}
        disabled={busy}
        onField={analysis.setPvField}
        onAdd={analysis.addPvArray}
        onRemove={analysis.removePvArray}
      />

      <ConsumptionForm
        dailyConsumptionKwh={analysis.draft.dailyConsumptionKwh}
        days={analysis.draft.days}
        errors={analysis.formErrors}
        disabled={busy}
        onTopField={(field, value) =>
          analysis.setTopField(field, value)
        }
      />

      <BatteryOptionalForm
        includeBattery={analysis.draft.includeBattery}
        battery={analysis.draft.battery}
        errors={analysis.formErrors}
        disabled={busy}
        onToggle={(include) => analysis.setTopField("includeBattery", include)}
        onField={analysis.setBatteryField}
      />

      <div>
        <button type="button" onClick={analysis.calculate} disabled={busy}>
          Calculate
        </button>
        <button type="button" onClick={analysis.loadSample}>
          Load sample
        </button>
        <button type="button" onClick={analysis.reset}>
          Reset
        </button>
      </div>

      <EnergyAnalysisResultPanel view={analysis.view} />
    </main>
  );
}
