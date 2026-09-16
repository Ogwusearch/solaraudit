/**
 * SolarAudit — Settings feature: App preferences form
 *
 * Theme, language, date format, currency. Presentational.
 */

import type {
  DateFormatPreference,
  FormValidationErrors,
  SettingsDraft,
  ThemePreference,
} from "../types";

const THEME_OPTIONS: ReadonlyArray<{ value: ThemePreference; label: string }> = [
  { value: "system", label: "System" },
  { value: "light", label: "Light" },
  { value: "dark", label: "Dark" },
];

const DATE_FORMAT_OPTIONS: ReadonlyArray<{
  value: DateFormatPreference;
  label: string;
}> = [
  { value: "ISO", label: "ISO (2026-09-12)" },
  { value: "locale", label: "Locale-dependent" },
  { value: "DMY", label: "Day/Month/Year" },
  { value: "MDY", label: "Month/Day/Year" },
];

export interface AppPreferencesFormProps {
  readonly app: SettingsDraft["app"];
  readonly errors: FormValidationErrors;
  readonly disabled?: boolean;
  readonly onField: (field: keyof SettingsDraft["app"], value: string) => void;
}

export function AppPreferencesForm(props: AppPreferencesFormProps) {
  const { app, errors, disabled, onField } = props;

  return (
    <fieldset disabled={disabled}>
      <legend>App preferences</legend>

      <label>
        Theme
        <select
          value={app.theme}
          onChange={(e) => onField("theme", e.target.value)}
        >
          {THEME_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
      </label>

      <label>
        Language
        <input
          type="text"
          value={app.language}
          onChange={(e) => onField("language", e.target.value)}
          placeholder="en"
        />
        {errors["app.language"] && (
          <span role="alert">{errors["app.language"]}</span>
        )}
      </label>

      <label>
        Date format
        <select
          value={app.dateFormat}
          onChange={(e) => onField("dateFormat", e.target.value)}
        >
          {DATE_FORMAT_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
      </label>

      <label>
        Currency
        <input
          type="text"
          maxLength={3}
          value={app.currency}
          onChange={(e) => onField("currency", e.target.value)}
          placeholder="USD"
        />
        {errors["app.currency"] && (
          <span role="alert">{errors["app.currency"]}</span>
        )}
      </label>
    </fieldset>
  );
}
