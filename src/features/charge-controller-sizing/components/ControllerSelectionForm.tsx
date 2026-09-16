/**
 * SolarAudit — Charge Controller Sizing feature: Technology + design
 *
 * Technology select, design factors, and optional controller limits.
 * Presentational. No engineering logic.
 */

import type { ControllerTechnology } from "../../../engineering/charge-controller";
import type { FormValidationErrors } from "../types";

const TECHNOLOGY_OPTIONS: ReadonlyArray<{
  value: ControllerTechnology;
  label: string;
}> = [
  { value: "mppt", label: "MPPT" },
  { value: "pwm", label: "PWM" },
];

export interface ControllerSelectionFormProps {
  readonly technology: ControllerTechnology;
  readonly designMargin: string;
  readonly controllerEfficiency: string;
  readonly maxPvInputVoltage: string;
  readonly maxPvInputCurrentA: string;
  readonly maxOutputCurrentA: string;
  readonly errors: FormValidationErrors;
  readonly disabled?: boolean;
  readonly onField: (field: string, value: string) => void;
}

export function ControllerSelectionForm(props: ControllerSelectionFormProps) {
  const { errors, disabled, onField } = props;

  return (
    <>
      <fieldset disabled={disabled}>
        <legend>Controller technology &amp; design</legend>

        <label>
          Technology
          <select
            value={props.technology}
            onChange={(e) => onField("technology", e.target.value)}
          >
            {TECHNOLOGY_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
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
          Controller efficiency
          <input
            type="number"
            min="0"
            max="1"
            step="0.05"
            value={props.controllerEfficiency}
            onChange={(e) => onField("controllerEfficiency", e.target.value)}
          />
          {errors["controllerEfficiency"] && (
            <span role="alert">{errors["controllerEfficiency"]}</span>
          )}
        </label>
      </fieldset>

      <fieldset disabled={disabled}>
        <legend>Controller limits (optional)</legend>

        <label>
          Max PV input voltage (V)
          <input
            type="number"
            min="0"
            step="1"
            value={props.maxPvInputVoltage}
            onChange={(e) => onField("maxPvInputVoltage", e.target.value)}
            placeholder="unset"
          />
        </label>

        <label>
          Max PV input current (A)
          <input
            type="number"
            min="0"
            step="1"
            value={props.maxPvInputCurrentA}
            onChange={(e) => onField("maxPvInputCurrentA", e.target.value)}
            placeholder="unset"
          />
        </label>

        <label>
          Max output current (A)
          <input
            type="number"
            min="0"
            step="1"
            value={props.maxOutputCurrentA}
            onChange={(e) => onField("maxOutputCurrentA", e.target.value)}
            placeholder="unset"
          />
        </label>
      </fieldset>
    </>
  );
}
