/**
 * SolarAudit — Solar Sizing feature: Site + design factors form
 *
 * Presentational. No engineering logic.
 */

import type { FormValidationErrors } from "../types";

export interface SolarSizingSiteFormProps {
  readonly dailyEnergyKwh: string;
  readonly peakSunHours: string;
  readonly systemEfficiency: string;
  readonly designMargin: string;
  readonly errors: FormValidationErrors;
  readonly disabled?: boolean;
  readonly onField: (field: string, value: string) => void;
}

export function SolarSizingSiteForm(props: SolarSizingSiteFormProps) {
  const { errors, disabled, onField } = props;

  return (
    <fieldset disabled={disabled}>
      <legend>Site &amp; design factors</legend>

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
        Peak sun hours
        <input
          type="number"
          min="0"
          max="24"
          step="0.1"
          value={props.peakSunHours}
          onChange={(e) => onField("peakSunHours", e.target.value)}
        />
        {errors["peakSunHours"] && (
          <span role="alert">{errors["peakSunHours"]}</span>
        )}
      </label>

      <label>
        System efficiency
        <input
          type="number"
          min="0"
          max="1"
          step="0.05"
          value={props.systemEfficiency}
          onChange={(e) => onField("systemEfficiency", e.target.value)}
        />
        {errors["systemEfficiency"] && (
          <span role="alert">{errors["systemEfficiency"]}</span>
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
    </fieldset>
  );
}
