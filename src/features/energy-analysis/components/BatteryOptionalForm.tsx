/**
 * SolarAudit — Energy Analysis feature: Optional battery form
 *
 * Presentational. The `includeBattery` checkbox enables the sub-form.
 * When unchecked, the service omits the battery from the engine input.
 */

import type { BatteryDraft, FormValidationErrors } from "../types";

export interface BatteryOptionalFormProps {
  readonly includeBattery: boolean;
  readonly battery: BatteryDraft;
  readonly errors: FormValidationErrors;
  readonly disabled?: boolean;
  readonly onToggle: (include: boolean) => void;
  readonly onField: (field: keyof BatteryDraft, value: string) => void;
}

export function BatteryOptionalForm(props: BatteryOptionalFormProps) {
  const { includeBattery, battery, errors, disabled, onToggle, onField } =
    props;

  return (
    <fieldset disabled={disabled}>
      <legend>
        <label>
          <input
            type="checkbox"
            checked={includeBattery}
            onChange={(e) => onToggle(e.target.checked)}
          />{" "}
          Include battery storage
        </label>
      </legend>

      {includeBattery && (
        <>
          <label>
            Name
            <input
              type="text"
              value={battery.name}
              onChange={(e) => onField("name", e.target.value)}
            />
          </label>

          <label>
            Capacity (kWh)
            <input
              type="number"
              min="0"
              step="0.1"
              value={battery.capacityKwh}
              onChange={(e) => onField("capacityKwh", e.target.value)}
            />
            {errors["battery.capacityKwh"] && (
              <span role="alert">{errors["battery.capacityKwh"]}</span>
            )}
          </label>

          <label>
            Depth of discharge
            <input
              type="number"
              min="0"
              max="1"
              step="0.05"
              value={battery.depthOfDischarge}
              onChange={(e) => onField("depthOfDischarge", e.target.value)}
            />
            {errors["battery.depthOfDischarge"] && (
              <span role="alert">{errors["battery.depthOfDischarge"]}</span>
            )}
          </label>

          <label>
            Round-trip efficiency
            <input
              type="number"
              min="0"
              max="1"
              step="0.05"
              value={battery.roundTripEfficiency}
              onChange={(e) =>
                onField("roundTripEfficiency", e.target.value)
              }
            />
            {errors["battery.roundTripEfficiency"] && (
              <span role="alert">
                {errors["battery.roundTripEfficiency"]}
              </span>
            )}
          </label>

          <label>
            Initial state of charge
            <input
              type="number"
              min="0"
              max="1"
              step="0.05"
              value={battery.initialSoc}
              onChange={(e) => onField("initialSoc", e.target.value)}
            />
            {errors["battery.initialSoc"] && (
              <span role="alert">{errors["battery.initialSoc"]}</span>
            )}
          </label>
        </>
      )}
    </fieldset>
  );
}
