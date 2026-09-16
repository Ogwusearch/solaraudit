/**
 * SolarAudit — Voltage Drop feature: Page
 *
 * Composes the feature. Binds the hook to presentational components.
 */

import { useVoltageDrop } from "../hooks/useVoltageDrop";
import { VoltageDropCircuitForm } from "./VoltageDropCircuitForm";
import { VoltageDropModesForm } from "./VoltageDropModesForm";
import { VoltageDropConditionsForm } from "./VoltageDropConditionsForm";
import { VoltageDropResultPanel } from "./VoltageDropResultPanel";

export function VoltageDropPage() {
  const vd = useVoltageDrop();
  const busy = vd.status === "calculating";
  const set = (field: string, value: string) =>
    vd.setField(field as never, value);

  return (
    <main>
      <h1>Voltage Drop</h1>

      <VoltageDropCircuitForm
        currentA={vd.draft.currentA}
        lengthM={vd.draft.lengthM}
        systemVoltageV={vd.draft.systemVoltageV}
        material={vd.draft.material}
        circuitType={vd.draft.circuitType}
        errors={vd.formErrors}
        disabled={busy}
        onField={set}
      />

      <VoltageDropModesForm
        conductorAreaMm2={vd.draft.conductorAreaMm2}
        targetDropPercent={vd.draft.targetDropPercent}
        errors={vd.formErrors}
        disabled={busy}
        onField={set}
      />

      <VoltageDropConditionsForm
        conductorTempC={vd.draft.conductorTempC}
        powerFactor={vd.draft.powerFactor}
        reactanceOhmPerKm={vd.draft.reactanceOhmPerKm}
        errors={vd.formErrors}
        disabled={busy}
        onField={set}
      />

      <div>
        <button type="button" onClick={vd.calculate} disabled={busy}>
          Calculate
        </button>
        <button type="button" onClick={vd.loadSample}>
          Load sample
        </button>
        <button type="button" onClick={vd.reset}>
          Reset
        </button>
      </div>

      <VoltageDropResultPanel view={vd.view} />
    </main>
  );
}
