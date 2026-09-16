/**
 * SolarAudit — Settings feature: Engineering defaults form
 *
 * Preferred starting values for the sizing features. Presentational.
 *
 * These are advisory. The sizing features still use their own
 * hard-coded defaults today; a future revision will read from here.
 */

import type { FormValidationErrors, SettingsDraft } from "../types";

export interface EngineeringDefaultsFormProps {
  readonly engineering: SettingsDraft["engineering"];
  readonly errors: FormValidationErrors;
  readonly disabled?: boolean;
  readonly onField: (
    field: keyof SettingsDraft["engineering"],
    value: string,
  ) => void;
}

export function EngineeringDefaultsForm(
  props: EngineeringDefaultsFormProps,
) {
  const { engineering, errors, disabled, onField } = props;

  return (
    <fieldset disabled={disabled}>
      <legend>Engineering defaults</legend>

      <p>
        <small>
          Starting values for new audits. These do not override the
          engines&rsquo; built-in defaults; they seed the sizing features
          when they next initialise a form.
        </small>
      </p>

      <label>
        System voltage (V)
        <input
          type="number"
          min="0"
          step="1"
          value={engineering.defaultSystemVoltage}
          onChange={(e) => onField("defaultSystemVoltage", e.target.value)}
        />
        {errors["engineering.defaultSystemVoltage"] && (
          <span role="alert">
            {errors["engineering.defaultSystemVoltage"]}
          </span>
        )}
      </label>

      <label>
        Peak sun hours
        <input
          type="number"
          min="0"
          max="24"
          step="0.1"
          value={engineering.defaultPeakSunHours}
          onChange={(e) => onField("defaultPeakSunHours", e.target.value)}
        />
        {errors["engineering.defaultPeakSunHours"] && (
          <span role="alert">
            {errors["engineering.defaultPeakSunHours"]}
          </span>
        )}
      </label>

      <label>
        PV design margin
        <input
          type="number"
          min="0"
          step="0.05"
          value={engineering.defaultPvDesignMargin}
          onChange={(e) =>
            onField("defaultPvDesignMargin", e.target.value)
          }
        />
        {errors["engineering.defaultPvDesignMargin"] && (
          <span role="alert">
            {errors["engineering.defaultPvDesignMargin"]}
          </span>
        )}
      </label>

      <label>
        Battery DoD
        <input
          type="number"
          min="0"
          max="1"
          step="0.05"
          value={engineering.defaultBatteryDod}
          onChange={(e) => onField("defaultBatteryDod", e.target.value)}
        />
        {errors["engineering.defaultBatteryDod"] && (
          <span role="alert">
            {errors["engineering.defaultBatteryDod"]}
          </span>
        )}
      </label>

      <label>
        Battery round-trip efficiency
        <input
          type="number"
          min="0"
          max="1"
          step="0.05"
          value={engineering.defaultBatteryRte}
          onChange={(e) => onField("defaultBatteryRte", e.target.value)}
        />
        {errors["engineering.defaultBatteryRte"] && (
          <span role="alert">
            {errors["engineering.defaultBatteryRte"]}
          </span>
        )}
      </label>

      <label>
        Temperature derating
        <input
          type="number"
          min="0"
          max="1"
          step="0.05"
          value={engineering.defaultTemperatureDerating}
          onChange={(e) =>
            onField("defaultTemperatureDerating", e.target.value)
          }
        />
        {errors["engineering.defaultTemperatureDerating"] && (
          <span role="alert">
            {errors["engineering.defaultTemperatureDerating"]}
          </span>
        )}
      </label>

      <label>
        Cable allowable drop (%)
        <input
          type="number"
          min="0"
          step="0.5"
          value={engineering.defaultCableDropPercent}
          onChange={(e) =>
            onField("defaultCableDropPercent", e.target.value)
          }
        />
        {errors["engineering.defaultCableDropPercent"] && (
          <span role="alert">
            {errors["engineering.defaultCableDropPercent"]}
          </span>
        )}
      </label>

      <label>
        Ambient temperature (°C)
        <input
          type="number"
          step="1"
          value={engineering.defaultAmbientTemperatureC}
          onChange={(e) =>
            onField("defaultAmbientTemperatureC", e.target.value)
          }
        />
        {errors["engineering.defaultAmbientTemperatureC"] && (
          <span role="alert">
            {errors["engineering.defaultAmbientTemperatureC"]}
          </span>
        )}
      </label>
    </fieldset>
  );
}
