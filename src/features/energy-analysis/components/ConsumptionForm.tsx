/**
 * SolarAudit — Energy Analysis feature: Consumption form
 *
 * Daily consumption and simulation horizon.
 * Presentational. No engineering logic.
 */

import type { FormValidationErrors } from "../types";

export interface ConsumptionFormProps {
  readonly dailyConsumptionKwh: string;
  readonly days: string;
  readonly errors: FormValidationErrors;
  readonly disabled?: boolean;
  readonly onTopField: (
    field: "dailyConsumptionKwh" | "days",
    value: string,
  ) => void;
}

export function ConsumptionForm(props: ConsumptionFormProps) {
  const { errors, disabled, onTopField } = props;

  return (
    <fieldset disabled={disabled}>
      <legend>Consumption &amp; horizon</legend>

      <label>
        Daily consumption (kWh)
        <input
          type="number"
          min="0"
          step="0.1"
          value={props.dailyConsumptionKwh}
          onChange={(e) => onTopField("dailyConsumptionKwh", e.target.value)}
        />
        {errors["dailyConsumptionKwh"] && (
          <span role="alert">{errors["dailyConsumptionKwh"]}</span>
        )}
      </label>

      <label>
        Simulation days
        <input
          type="number"
          min="1"
          step="1"
          value={props.days}
          onChange={(e) => onTopField("days", e.target.value)}
        />
        {errors["days"] && <span role="alert">{errors["days"]}</span>}
      </label>
    </fieldset>
  );
}
