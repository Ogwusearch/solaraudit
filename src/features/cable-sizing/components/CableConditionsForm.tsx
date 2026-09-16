/**
 * SolarAudit — Cable Sizing feature: Optional derating inputs
 *
 * Presentational. Empty fields fall back to the engine's defaults:
 *   ambientTemperatureC  → 30 °C
 *   conductorTempC       → 70 °C (PVC)
 *   groupingCount        → 1
 *   designMargin         → 0
 */

import type { FormValidationErrors } from "../types";

export interface CableConditionsFormProps {
  readonly ambientTemperatureC: string;
  readonly conductorTempC: string;
  readonly groupingCount: string;
  readonly designMargin: string;
  readonly errors: FormValidationErrors;
  readonly disabled?: boolean;
  readonly onField: (field: string, value: string) => void;
}

export function CableConditionsForm(props: CableConditionsFormProps) {
  const { errors, disabled, onField } = props;

  return (
    <fieldset disabled={disabled}>
      <legend>Derating &amp; margin (optional)</legend>

      <label>
        Ambient temperature (°C)
        <input
          type="number"
          step="1"
          value={props.ambientTemperatureC}
          onChange={(e) => onField("ambientTemperatureC", e.target.value)}
          placeholder="default: 30"
        />
        {errors["ambientTemperatureC"] && (
          <span role="alert">{errors["ambientTemperatureC"]}</span>
        )}
      </label>

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
        Grouped circuits
        <input
          type="number"
          min="1"
          step="1"
          value={props.groupingCount}
          onChange={(e) => onField("groupingCount", e.target.value)}
          placeholder="default: 1"
        />
        {errors["groupingCount"] && (
          <span role="alert">{errors["groupingCount"]}</span>
        )}
      </label>

      <label>
        Design margin
        <input
          type="number"
          min="0"
          step="0.05"
          value={props.designMargin}
          onChange={(e) => onField("designMargin", e.target.value)}
          placeholder="default: 0"
        />
        {errors["designMargin"] && (
          <span role="alert">{errors["designMargin"]}</span>
        )}
      </label>
    </fieldset>
  );
}
