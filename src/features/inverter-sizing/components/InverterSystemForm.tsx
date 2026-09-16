/**
 * SolarAudit — Inverter Sizing feature: System form
 *
 * DC input, AC output, power factor, and design factors.
 * Presentational. No engineering logic.
 */

import type {
  InverterTopology,
  InverterType,
} from "../../../engineering/inverter";
import type { FormValidationErrors } from "../types";

const TYPE_OPTIONS: ReadonlyArray<{ value: InverterType; label: string }> = [
  { value: "pure-sine", label: "Pure sine" },
  { value: "modified-sine", label: "Modified sine" },
];

const TOPOLOGY_OPTIONS: ReadonlyArray<{
  value: InverterTopology;
  label: string;
}> = [
  { value: "off-grid", label: "Off-grid" },
  { value: "grid-tied", label: "Grid-tied" },
  { value: "hybrid", label: "Hybrid" },
];

export interface InverterSystemFormProps {
  readonly systemVoltage: string;
  readonly outputVoltage: string;
  readonly outputFrequency: string;
  readonly powerFactor: string;
  readonly designMargin: string;
  readonly inverterEfficiency: string;
  readonly surgeDurationSec: string;
  readonly type: InverterType;
  readonly topology: InverterTopology;
  readonly maxDcInputCurrentA: string;
  readonly errors: FormValidationErrors;
  readonly disabled?: boolean;
  readonly onField: (field: string, value: string) => void;
}

export function InverterSystemForm(props: InverterSystemFormProps) {
  const { errors, disabled, onField } = props;

  return (
    <>
      <fieldset disabled={disabled}>
        <legend>System &amp; output</legend>

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
          Output voltage (V)
          <input
            type="number"
            min="0"
            step="1"
            value={props.outputVoltage}
            onChange={(e) => onField("outputVoltage", e.target.value)}
          />
          {errors["outputVoltage"] && (
            <span role="alert">{errors["outputVoltage"]}</span>
          )}
        </label>

        <label>
          Output frequency (Hz)
          <input
            type="number"
            min="0"
            step="1"
            value={props.outputFrequency}
            onChange={(e) => onField("outputFrequency", e.target.value)}
          />
          {errors["outputFrequency"] && (
            <span role="alert">{errors["outputFrequency"]}</span>
          )}
        </label>

        <label>
          Power factor
          <input
            type="number"
            min="0"
            max="1"
            step="0.05"
            value={props.powerFactor}
            onChange={(e) => onField("powerFactor", e.target.value)}
          />
          {errors["powerFactor"] && (
            <span role="alert">{errors["powerFactor"]}</span>
          )}
        </label>
      </fieldset>

      <fieldset disabled={disabled}>
        <legend>Design factors</legend>

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
          Inverter efficiency
          <input
            type="number"
            min="0"
            max="1"
            step="0.05"
            value={props.inverterEfficiency}
            onChange={(e) => onField("inverterEfficiency", e.target.value)}
          />
          {errors["inverterEfficiency"] && (
            <span role="alert">{errors["inverterEfficiency"]}</span>
          )}
        </label>

        <label>
          Surge duration (s, optional)
          <input
            type="number"
            min="0"
            step="1"
            value={props.surgeDurationSec}
            onChange={(e) => onField("surgeDurationSec", e.target.value)}
            placeholder="unset"
          />
        </label>
      </fieldset>

      <fieldset disabled={disabled}>
        <legend>Classification</legend>

        <label>
          Type
          <select
            value={props.type}
            onChange={(e) => onField("type", e.target.value)}
          >
            {TYPE_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        </label>

        <label>
          Topology
          <select
            value={props.topology}
            onChange={(e) => onField("topology", e.target.value)}
          >
            {TOPOLOGY_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        </label>

        <label>
          Max DC input current (A, optional)
          <input
            type="number"
            min="0"
            step="1"
            value={props.maxDcInputCurrentA}
            onChange={(e) => onField("maxDcInputCurrentA", e.target.value)}
            placeholder="unset"
          />
        </label>
      </fieldset>
    </>
  );
}
