/**
 * SolarAudit — Protection Sizing feature: Circuit identity + params
 *
 * Role, voltage type, technology, continuous current, system voltage.
 * Presentational. No engineering logic.
 */

import type {
  CircuitRole,
  ProtectionTechnology,
  VoltageType,
} from "../../../engineering/protection";
import type { FormValidationErrors } from "../types";

const ROLE_OPTIONS: ReadonlyArray<{ value: CircuitRole; label: string }> = [
  { value: "battery", label: "Battery" },
  { value: "pv-string", label: "PV string" },
  { value: "pv-array", label: "PV array" },
  { value: "charge-controller", label: "Charge controller" },
  { value: "inverter-dc", label: "Inverter DC" },
  { value: "inverter-ac", label: "Inverter AC" },
  { value: "ac-load", label: "AC load" },
  { value: "ac-grid", label: "AC grid" },
];

const VOLTAGE_TYPE_OPTIONS: ReadonlyArray<{
  value: VoltageType;
  label: string;
}> = [
  { value: "dc", label: "DC" },
  { value: "ac", label: "AC" },
];

const TECHNOLOGY_OPTIONS: ReadonlyArray<{
  value: ProtectionTechnology;
  label: string;
}> = [
  { value: "fuse", label: "Fuse" },
  { value: "mcb", label: "MCB" },
  { value: "mccb", label: "MCCB" },
  { value: "dc-breaker", label: "DC breaker" },
  { value: "dc-isolator", label: "DC isolator" },
  { value: "spd", label: "SPD" },
  { value: "rcd", label: "RCD" },
];

export interface CircuitIdentityFormProps {
  readonly role: CircuitRole;
  readonly voltageType: VoltageType;
  readonly technology: ProtectionTechnology;
  readonly continuousCurrentA: string;
  readonly systemVoltageV: string;
  readonly errors: FormValidationErrors;
  readonly disabled?: boolean;
  readonly onField: (field: string, value: string) => void;
}

export function CircuitIdentityForm(props: CircuitIdentityFormProps) {
  const { errors, disabled, onField } = props;

  return (
    <fieldset disabled={disabled}>
      <legend>Circuit</legend>

      <label>
        Role
        <select
          value={props.role}
          onChange={(e) => onField("role", e.target.value)}
        >
          {ROLE_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
      </label>

      <label>
        Voltage type
        <select
          value={props.voltageType}
          onChange={(e) => onField("voltageType", e.target.value)}
        >
          {VOLTAGE_TYPE_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
      </label>

      <label>
        Protection technology
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
        Continuous current (A)
        <input
          type="number"
          min="0"
          step="1"
          value={props.continuousCurrentA}
          onChange={(e) => onField("continuousCurrentA", e.target.value)}
        />
        {errors["continuousCurrentA"] && (
          <span role="alert">{errors["continuousCurrentA"]}</span>
        )}
      </label>

      <label>
        System voltage (V)
        <input
          type="number"
          min="0"
          step="1"
          value={props.systemVoltageV}
          onChange={(e) => onField("systemVoltageV", e.target.value)}
        />
        {errors["systemVoltageV"] && (
          <span role="alert">{errors["systemVoltageV"]}</span>
        )}
      </label>
    </fieldset>
  );
}
