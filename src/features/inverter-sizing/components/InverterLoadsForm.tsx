/**
 * SolarAudit — Inverter Sizing feature: Loads form
 *
 * Continuous / peak / surge loads. Typically will be prefilled from a
 * Load Audit in a later phase — for now, entered directly.
 *
 * Presentational. No engineering logic.
 */

import type { FormValidationErrors } from "../types";

export interface InverterLoadsFormProps {
  readonly continuousLoadW: string;
  readonly peakLoadW: string;
  readonly surgeLoadW: string;
  readonly errors: FormValidationErrors;
  readonly disabled?: boolean;
  readonly onField: (field: string, value: string) => void;
}

export function InverterLoadsForm(props: InverterLoadsFormProps) {
  const { errors, disabled, onField } = props;

  return (
    <fieldset disabled={disabled}>
      <legend>Load profile</legend>

      <label>
        Continuous load (W)
        <input
          type="number"
          min="0"
          step="10"
          value={props.continuousLoadW}
          onChange={(e) => onField("continuousLoadW", e.target.value)}
        />
        {errors["continuousLoadW"] && (
          <span role="alert">{errors["continuousLoadW"]}</span>
        )}
      </label>

      <label>
        Peak load (W)
        <input
          type="number"
          min="0"
          step="10"
          value={props.peakLoadW}
          onChange={(e) => onField("peakLoadW", e.target.value)}
        />
        {errors["peakLoadW"] && (
          <span role="alert">{errors["peakLoadW"]}</span>
        )}
      </label>

      <label>
        Surge load (W)
        <input
          type="number"
          min="0"
          step="10"
          value={props.surgeLoadW}
          onChange={(e) => onField("surgeLoadW", e.target.value)}
        />
        {errors["surgeLoadW"] && (
          <span role="alert">{errors["surgeLoadW"]}</span>
        )}
      </label>
    </fieldset>
  );
}
