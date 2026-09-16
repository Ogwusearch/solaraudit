/**
 * SolarAudit — Cable Sizing feature: Circuit electrical parameters
 *
 * Presentational. No engineering logic.
 */

import type { FormValidationErrors } from "../types";

export interface CableCircuitFormProps {
  readonly currentA: string;
  readonly lengthM: string;
  readonly systemVoltage: string;
  readonly allowableDropPercent: string;
  readonly errors: FormValidationErrors;
  readonly disabled?: boolean;
  readonly onField: (field: string, value: string) => void;
}

export function CableCircuitForm(props: CableCircuitFormProps) {
  const { errors, disabled, onField } = props;

  return (
    <fieldset disabled={disabled}>
      <legend>Circuit parameters</legend>

      <label>
        Design current (A)
        <input
          type="number"
          min="0"
          step="1"
          value={props.currentA}
          onChange={(e) => onField("currentA", e.target.value)}
        />
        {errors["currentA"] && <span role="alert">{errors["currentA"]}</span>}
      </label>

      <label>
        One-way length (m)
        <input
          type="number"
          min="0"
          step="0.5"
          value={props.lengthM}
          onChange={(e) => onField("lengthM", e.target.value)}
        />
        {errors["lengthM"] && <span role="alert">{errors["lengthM"]}</span>}
      </label>

      <label>
        System voltage (V)
        <input
          type="number"
          min="0"
          step="1"
          value={props.systemVoltage}
          onChange={(e) => onField("systemVoltage", e.target.value)}
        />
        {errors["systemVoltage"] && (
          <span role="alert">{errors["systemVoltage"]}</span>
        )}
      </label>

      <label>
        Allowable voltage drop (%)
        <input
          type="number"
          min="0"
          step="0.1"
          value={props.allowableDropPercent}
          onChange={(e) => onField("allowableDropPercent", e.target.value)}
        />
        {errors["allowableDropPercent"] && (
          <span role="alert">{errors["allowableDropPercent"]}</span>
        )}
      </label>
    </fieldset>
  );
}
