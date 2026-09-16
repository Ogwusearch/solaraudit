/**
 * SolarAudit — Solar Sizing feature: Page
 *
 * Composes the feature. Binds the hook to presentational components.
 */

import { useSolarSizing } from "../hooks/useSolarSizing";
import { PanelSpecForm } from "./PanelSpecForm";
import { SolarSizingSiteForm } from "./SolarSizingSiteForm";
import { SolarSizingConstraintsForm } from "./SolarSizingConstraintsForm";
import { SolarSizingResultPanel } from "./SolarSizingResultPanel";

export function SolarSizingPage() {
  const sizing = useSolarSizing();
  const busy = sizing.status === "calculating";

  return (
    <main>
      <h1>Solar Sizing</h1>

      <SolarSizingSiteForm
        dailyEnergyKwh={sizing.draft.dailyEnergyKwh}
        peakSunHours={sizing.draft.peakSunHours}
        systemEfficiency={sizing.draft.systemEfficiency}
        designMargin={sizing.draft.designMargin}
        errors={sizing.formErrors}
        disabled={busy}
        onField={(field, value) =>
          sizing.setField(field as never, value)
        }
      />

      <PanelSpecForm
        panel={sizing.draft.panel}
        errors={sizing.formErrors}
        disabled={busy}
        onChange={sizing.setPanelField}
      />

      <SolarSizingConstraintsForm
        maxSeriesPanels={sizing.draft.maxSeriesPanels}
        maxParallelStrings={sizing.draft.maxParallelStrings}
        maxArrayVoc={sizing.draft.maxArrayVoc}
        minArrayVmp={sizing.draft.minArrayVmp}
        disabled={busy}
        onField={(field, value) =>
          sizing.setField(field as never, value)
        }
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

      <SolarSizingResultPanel view={sizing.view} />
    </main>
  );
}
