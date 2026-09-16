/**
 * SolarAudit — Protection Sizing feature: Page
 *
 * Composes the feature. Binds the hook to presentational components.
 */

import { useProtectionSizing } from "../hooks/useProtectionSizing";
import { CircuitIdentityForm } from "./CircuitIdentityForm";
import { DesignInputsForm } from "./DesignInputsForm";
import { CandidateDeviceForm } from "./CandidateDeviceForm";
import { ProtectionSizingResultPanel } from "./ProtectionSizingResultPanel";

export function ProtectionSizingPage() {
  const sizing = useProtectionSizing();
  const busy = sizing.status === "calculating";
  const set = (field: string, value: string) =>
    sizing.setField(field as never, value);

  return (
    <main>
      <h1>Protection Sizing</h1>

      <CircuitIdentityForm
        role={sizing.draft.role}
        voltageType={sizing.draft.voltageType}
        technology={sizing.draft.technology}
        continuousCurrentA={sizing.draft.continuousCurrentA}
        systemVoltageV={sizing.draft.systemVoltageV}
        errors={sizing.formErrors}
        disabled={busy}
        onField={set}
      />

      <DesignInputsForm
        safetyFactor={sizing.draft.safetyFactor}
        availableFaultCurrentKa={sizing.draft.availableFaultCurrentKa}
        errors={sizing.formErrors}
        disabled={busy}
        onField={set}
      />

      <CandidateDeviceForm
        deviceVoltageRatingV={sizing.draft.deviceVoltageRatingV}
        deviceInterruptRatingKa={sizing.draft.deviceInterruptRatingKa}
        deviceCurrentRatingA={sizing.draft.deviceCurrentRatingA}
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

      <ProtectionSizingResultPanel view={sizing.view} />
    </main>
  );
}
