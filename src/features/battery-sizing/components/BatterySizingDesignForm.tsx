/**
 * SolarAudit — Battery Sizing feature: Design factors form
 *
 * Presentational. No engineering logic.
 */

import type { FormValidationErrors } from "../types";

export interface BatterySizingDesignFormProps {
  readonly dailyEnergyKwh: string;
  readonly autonomyDays: string;
  readonly systemVoltage: string;
  readonly designMargin: string;
  readonly temperatureDerating: string;
  readonly maxDepthOfDischarge: string;
  readonly roundTripEfficiency: string;
  readonly errors: FormValidationErrors;
  readonly disabled?: boolean;
  readonly onField: (field: string, value: string) => void;
}

export function BatterySizingDesignForm(
  props: BatterySizingDesignFormProps,
) {
  const { errors, disabled, onField } = props;

  return (
    <fieldset disabled={disabled}>
      <legend>Design factors</legend>

      <label>
        Daily energy (kWh)
        <input
          type="number"
          min="0"
          step="0.1"
          value={props.dailyEnergyKwh}
          onChange={(e) => onField("dailyEnergyKwh", e.target.value)}
        />
        {errors["dailyEnergyKwh"] && (
          <span role="alert">{errors["dailyEnergyKwh"]}</span>
        )}
      </label>

      <label>
        Autonomy (days)
        <input
          type="number"
          min="0"
          step="0.5"
          value={props.autonomyDays}
          onChange={(e) => onField("autonomyDays", e.target.value)}
        />
        {errors["autonomyDays"] && (
          <span role="alert">{errors["autonomyDays"]}</span>
        )}
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
        Design margin
        <input
          type="number"
          min="0"
          step="0.05"
          value={props.designMargin}
          onChange={(e) => onField("designMargin", e.target.value)}
        />
        {errors["designMargin"] && (
          <span role="alert">{errors["designMargin"]}</span>
        )}
      </label>

      <label>
        Temperature derating
        <input
          type="number"
          min="0"
          max="1"
          step="0.05"
          value={props.temperatureDerating}
          onChange={(e) => onField("temperatureDerating", e.target.value)}
        />
        {errors["temperatureDerating"] && (
          <span role="alert">{errors["temperatureDerating"]}</span>
        )}
      </label>

      <label>
        Design DoD
        <input
          type="number"
          min="0"
          max="1"
          step="0.05"
          value={props.maxDepthOfDischarge}
          onChange={(e) => onField("maxDepthOfDischarge", e.target.value)}
        />
        {errors["maxDepthOfDischarge"] && (
          <span role="alert">{errors["maxDepthOfDischarge"]}</span>
        )}
      </label>

      <label>
        Design round-trip efficiency
        <input
          type="number"
          min="0"
          max="1"
          step="0.05"
          value={props.roundTripEfficiency}
          onChange={(e) => onField("roundTripEfficiency", e.target.value)}
        />
        {errors["roundTripEfficiency"] && (
          <span role="alert">{errors["roundTripEfficiency"]}</span>
        )}
      </label>

      <label>
        Max parallel strings (optional)
        <input
          type="number"
          min="1"
          step="1"
          value={props.maxParallelStrings ?? ""}
          onChange={(e) => onField("maxParallelStrings", e.target.value)}
          placeholder="unset"
        />
      </label>
    </fieldset>
  );
}
