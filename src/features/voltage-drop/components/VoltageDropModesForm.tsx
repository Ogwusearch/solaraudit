/**
 * SolarAudit — Voltage Drop feature: Forward / inverse mode form
 *
 * Both fields are optional individually, but at least one must be
 * provided. Presentational. No engineering logic.
 */

import type { FormValidationErrors } from "../types";

export interface VoltageDropModesFormProps {
  readonly conductorAreaMm2: string;
  readonly targetDropPercent: string;
  readonly errors: FormValidationErrors;
  readonly disabled?: boolean;
  readonly onField: (field: string, value: string) => void;
}

export function VoltageDropModesForm(props: VoltageDropModesFormProps) {
  const { errors, disabled, onField } = props;

  return (
    <fieldset disabled={disabled}>
      <legend>Calculation mode</legend>

      <p>
        <small>
          Provide a conductor area to compute the drop (forward), a
          target drop % to solve the minimum area (inverse), or both to
          get the drop AND the solved minimum area in one call.
        </small>
      </p>

      <label>
        Conductor area (mm²) — forward
        <input
          type="number"
          min="0"
          step="0.5"
          value={props.conductorAreaMm2}
          onChange={(e) => onField("conductorAreaMm2", e.target.value)}
          placeholder="unset"
        />
        {errors["conductorAreaMm2"] && (
          <span role="alert">{errors["conductorAreaMm2"]}</span>
        )}
      </label>

      <label>
        Target voltage drop (%) — inverse
        <input
          type="number"
          min="0"
          step="0.1"
          value={props.targetDropPercent}
          onChange={(e) => onField("targetDropPercent", e.target.value)}
          placeholder="unset"
        />
        {errors["targetDropPercent"] && (
          <span role="alert">{errors["targetDropPercent"]}</span>
        )}
      </label>
    </fieldset>
  );
}
