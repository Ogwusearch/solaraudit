/**
 * SolarAudit — Inverter Sizing feature: Page
 *
 * Composes the feature. Binds the hook to presentational components.
 */

import { useInverterSizing } from "../hooks/useInverterSizing";
import { InverterLoadsForm } from "./InverterLoadsForm";
import { InverterSystemForm } from "./InverterSystemForm";
import { InverterSizingResultPanel } from "./InverterSizingResultPanel";

export function InverterSizingPage() {
  const sizing = useInverterSizing();
  const busy = sizing.status === "calculating";

  return (
    <main>
      <h1>Inverter Sizing</h1>

      <InverterLoadsForm
        continuousLoadW={sizing.draft.continuousLoadW}
        peakLoadW={sizing.draft.peakLoadW}
        surgeLoadW={sizing.draft.surgeLoadW}
        errors={sizing.formErrors}
        disabled={busy}
        onField={(field, value) => sizing.setField(field as never, value)}
      />

      <InverterSystemForm
        systemVoltage={sizing.draft.systemVoltage}
        outputVoltage={sizing.draft.outputVoltage}
        outputFrequency={sizing.draft.outputFrequency}
        powerFactor={sizing.draft.powerFactor}
        designMargin={sizing.draft.designMargin}
        inverterEfficiency={sizing.draft.inverterEfficiency}
        surgeDurationSec={sizing.draft.surgeDurationSec}
        type={sizing.draft.type}
        topology={sizing.draft.topology}
        maxDcInputCurrentA={sizing.draft.maxDcInputCurrentA}
        errors={sizing.formErrors}
        disabled={busy}
        onField={(field, value) => sizing.setField(field as never, value)}
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

      <InverterSizingResultPanel view={sizing.view} />
    </main>
  );
}
