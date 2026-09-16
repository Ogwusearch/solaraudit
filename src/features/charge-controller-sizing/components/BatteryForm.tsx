/**
 * SolarAudit — Charge Controller Sizing feature: Battery form
 *
 * Presentational. No engineering logic.
 */

import type { FormValidationErrors } from "../types";

export interface BatteryFormProps {
  readonly batteryVoltage: string;
  readonly batteryCapacityAh: string;
  readonly errors: FormValidationErrors;
  readonly disabled?: boolean;
  readonly onField: (field: string, value: string) => void;
}

export function BatteryForm(props: BatteryFormProps) {
  const { errors, disabled, onField } = props;

  return (
    <fieldset disabled={disabled}>
      <legend>Battery bank</legend>

      <label>
        Battery voltage (V)
        <input
          type="number"
          min="0"
          step="1"
          value={props.batteryVoltage}
          onChange={(e) => onField("batteryVoltage", e.target.value)}
        />
        {errors["batteryVoltage"] && (
          <span role="alert">{errors["batteryVoltage"]}</span>
        )}
      </label>

      <label>
        Battery capacity (Ah)
        <input
          type="number"
          min="0"
          step="1"
          value={props.batteryCapacityAh}
          onChange={(e) => onField("batteryCapacityAh", e.target.value)}
        />
        {errors["batteryCapacityAh"] && (
          <span role="alert">{errors["batteryCapacityAh"]}</span>
        )}
      </label>
    </fieldset>
  );
}
