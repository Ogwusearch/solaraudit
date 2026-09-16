/**
 * SolarAudit — Battery Sizing feature: Page
 *
 * Composes the feature. Binds the hook to presentational components.
 */

import { useBatterySizing } from "../hooks/useBatterySizing";
import { BatteryCellSpecForm } from "./BatteryCellSpecForm";
import { BatterySizingDesignForm } from "./BatterySizingDesignForm";
import { BatterySizingResultPanel } from "./BatterySizingResultPanel";

export function BatterySizingPage() {
  const sizing = useBatterySizing();
  const busy = sizing.status === "calculating";

  return (
    <main>
      <h1>Battery Sizing</h1>

      <BatterySizingDesignForm
        dailyEnergyKwh={sizing.draft.dailyEnergyKwh}
        autonomyDays={sizing.draft.autonomyDays}
        systemVoltage={sizing.draft.systemVoltage}
        designMargin={sizing.draft.designMargin}
        temperatureDerating={sizing.draft.temperatureDerating}
        maxDepthOfDischarge={sizing.draft.maxDepthOfDischarge}
        roundTripEfficiency={sizing.draft.roundTripEfficiency}
        maxParallelStrings={sizing.draft.maxParallelStrings}
        errors={sizing.formErrors}
        disabled={busy}
        onField={(field, value) => sizing.setField(field as never, value)}
      />

      <BatteryCellSpecForm
        cell={sizing.draft.cell}
        errors={sizing.formErrors}
        disabled={busy}
        onChange={sizing.setCellField}
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

      <BatterySizingResultPanel view={sizing.view} />
    </main>
  );
}
