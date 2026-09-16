/**
 * SolarAudit — Charge Controller Sizing feature: PV array form
 *
 * Presentational. No engineering logic.
 */

import type { FormValidationErrors } from "../types";

export interface PvArrayFormProps {
  readonly pvArrayKwp: string;
  readonly pvVmp: string;
  readonly pvVoc: string;
  readonly pvImp: string;
  readonly pvIsc: string;
  readonly errors: FormValidationErrors;
  readonly disabled?: boolean;
  readonly onField: (field: string, value: string) => void;
}

export function PvArrayForm(props: PvArrayFormProps) {
  const { errors, disabled, onField } = props;

  return (
    <fieldset disabled={disabled}>
      <legend>PV array</legend>

      <label>
        Array power (kWp)
        <input
          type="number"
          min="0"
          step="0.1"
          value={props.pvArrayKwp}
          onChange={(e) => onField("pvArrayKwp", e.target.value)}
        />
        {errors["pvArrayKwp"] && (
          <span role="alert">{errors["pvArrayKwp"]}</span>
        )}
      </label>

      <label>
        Array Vmp (V)
        <input
          type="number"
          min="0"
          step="0.1"
          value={props.pvVmp}
          onChange={(e) => onField("pvVmp", e.target.value)}
        />
        {errors["pvVmp"] && <span role="alert">{errors["pvVmp"]}</span>}
      </label>

      <label>
        Array Voc (V)
        <input
          type="number"
          min="0"
          step="0.1"
          value={props.pvVoc}
          onChange={(e) => onField("pvVoc", e.target.value)}
        />
        {errors["pvVoc"] && <span role="alert">{errors["pvVoc"]}</span>}
      </label>

      <label>
        Array Imp (A)
        <input
          type="number"
          min="0"
          step="0.1"
          value={props.pvImp}
          onChange={(e) => onField("pvImp", e.target.value)}
        />
        {errors["pvImp"] && <span role="alert">{errors["pvImp"]}</span>}
      </label>

      <label>
        Array Isc (A)
        <input
          type="number"
          min="0"
          step="0.1"
          value={props.pvIsc}
          onChange={(e) => onField("pvIsc", e.target.value)}
        />
        {errors["pvIsc"] && <span role="alert">{errors["pvIsc"]}</span>}
      </label>
    </fieldset>
  );
}
