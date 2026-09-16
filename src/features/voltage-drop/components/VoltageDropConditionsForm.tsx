/**
 * SolarAudit — Voltage Drop feature: Optional conductor conditions
 *
 * Conductor temperature, power factor, reactance. Empty fields fall
 * back to engine defaults (70 °C, pf = 1.0, X ignored).
 *
 * Presentational. No engineering logic.
 */

import type { FormValidationErrors } from "../types";

export interface VoltageDropConditionsFormProps {
  readonly conductorTempC: string;
  readonly powerFactor: string;
  readonly reactanceOhmPerKm: string;
  readonly errors: FormValidationErrors;
  readonly disabled?: boolean;
  readonly onField: (field: string, value: string) => void;
}

export function VoltageDropConditionsForm(
  props: VoltageDropConditionsFormProps,
) {
  const { errors, disabled, onField } = props;

  return (
    <fieldset disabled={disabled}>
      <legend>Conditions (optional)</legend>

      <label>
        Conductor temperature (°C)
        <input
          type="number"
          step="1"
          value={props.conductorTempC}
          onChange={(e) => onField("conductorTempC", e.target.value)}
          placeholder="default: 70"
        />
        {errors["conductorTempC"] && (
          <span role="alert">{errors["conductorTempC"]}</span>
        )}
      </label>

      <label>
        Power factor
        <input
          type="number"
          min="0.1"
          max="1"
          step="0.05"
          value={props.powerFactor}
          onChange={(e) => onField("powerFactor", e.target.value)}
          placeholder="default: 1.0"
        />
        {errors["powerFactor"] && (
          <span role="alert">{errors["powerFactor"]}</span>
        )}
      </label>

      <label>
        Reactance (Ω/km)
        <input
          type="number"
          min="0"
          step="0.01"
          value={props.reactanceOhmPerKm}
          onChange={(e) => onField("reactanceOhmPerKm", e.target.value)}
          placeholder="unset — resistance only"
        />
        {errors["reactanceOhmPerKm"] && (
          <span role="alert">{errors["reactanceOhmPerKm"]}</span>
        )}
      </label>
    </fieldset>
  );
}
