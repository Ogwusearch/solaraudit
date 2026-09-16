/**
 * SolarAudit — Solar Sizing feature: Panel spec form
 *
 * Presentational. No engineering logic.
 */

import type { FormValidationErrors, PanelSpecDraft } from "../types";

export interface PanelSpecFormProps {
  readonly panel: PanelSpecDraft;
  readonly errors: FormValidationErrors;
  readonly disabled?: boolean;
  readonly onChange: (field: keyof PanelSpecDraft, value: string) => void;
}

export function PanelSpecForm(props: PanelSpecFormProps) {
  const { panel, errors, disabled, onChange } = props;

  return (
    <fieldset disabled={disabled}>
      <legend>Panel specification</legend>

      <label>
        Name
        <input
          type="text"
          value={panel.name}
          onChange={(e) => onChange("name", e.target.value)}
          placeholder="e.g. 400 W mono"
        />
        {errors["panel.name"] && <span role="alert">{errors["panel.name"]}</span>}
      </label>

      <label>
        Rated power (W)
        <input
          type="number"
          min="0"
          value={panel.ratedPowerWatts}
          onChange={(e) => onChange("ratedPowerWatts", e.target.value)}
        />
        {errors["panel.ratedPowerWatts"] && (
          <span role="alert">{errors["panel.ratedPowerWatts"]}</span>
        )}
      </label>

      <label>
        Vmp (V)
        <input
          type="number"
          min="0"
          step="0.1"
          value={panel.vmp}
          onChange={(e) => onChange("vmp", e.target.value)}
        />
        {errors["panel.vmp"] && <span role="alert">{errors["panel.vmp"]}</span>}
      </label>

      <label>
        Imp (A)
        <input
          type="number"
          min="0"
          step="0.1"
          value={panel.imp}
          onChange={(e) => onChange("imp", e.target.value)}
        />
        {errors["panel.imp"] && <span role="alert">{errors["panel.imp"]}</span>}
      </label>

      <label>
        Voc (V)
        <input
          type="number"
          min="0"
          step="0.1"
          value={panel.voc}
          onChange={(e) => onChange("voc", e.target.value)}
        />
        {errors["panel.voc"] && <span role="alert">{errors["panel.voc"]}</span>}
      </label>

      <label>
        Isc (A)
        <input
          type="number"
          min="0"
          step="0.1"
          value={panel.isc}
          onChange={(e) => onChange("isc", e.target.value)}
        />
        {errors["panel.isc"] && <span role="alert">{errors["panel.isc"]}</span>}
      </label>
    </fieldset>
  );
}
