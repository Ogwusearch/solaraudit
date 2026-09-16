/**
 * SolarAudit — Charge Controller Sizing feature: Page
 *
 * Composes the feature. Binds the hook to presentational components.
 */

import { useChargeControllerSizing } from "../hooks/useChargeControllerSizing";
import { PvArrayForm } from "./PvArrayForm";
import { BatteryForm } from "./BatteryForm";
import { ControllerSelectionForm } from "./ControllerSelectionForm";
import { ChargeControllerSizingResultPanel } from "./ChargeControllerSizingResultPanel";

export function ChargeControllerSizingPage() {
  const sizing = useChargeControllerSizing();
  const busy = sizing.status === "calculating";
  const set = (field: string, value: string) =>
    sizing.setField(field as never, value);

  return (
    <main>
      <h1>Charge Controller Sizing</h1>

      <PvArrayForm
        pvArrayKwp={sizing.draft.pvArrayKwp}
        pvVmp={sizing.draft.pvVmp}
        pvVoc={sizing.draft.pvVoc}
        pvImp={sizing.draft.pvImp}
        pvIsc={sizing.draft.pvIsc}
        errors={sizing.formErrors}
        disabled={busy}
        onField={set}
      />

      <BatteryForm
        batteryVoltage={sizing.draft.batteryVoltage}
        batteryCapacityAh={sizing.draft.batteryCapacityAh}
        errors={sizing.formErrors}
        disabled={busy}
        onField={set}
      />

      <ControllerSelectionForm
        technology={sizing.draft.technology}
        designMargin={sizing.draft.designMargin}
        controllerEfficiency={sizing.draft.controllerEfficiency}
        maxPvInputVoltage={sizing.draft.maxPvInputVoltage}
        maxPvInputCurrentA={sizing.draft.maxPvInputCurrentA}
        maxOutputCurrentA={sizing.draft.maxOutputCurrentA}
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

      <ChargeControllerSizingResultPanel view={sizing.view} />
    </main>
  );
}
