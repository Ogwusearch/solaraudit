/**
 * SolarAudit — Voltage Drop feature: Circuit parameters
 *
 * Presentational. No engineering logic.
 */

import type {
  CircuitType,
  ConductorMaterial,
} from "../../../engineering/voltage-drop";
import type { FormValidationErrors } from "../types";

const MATERIAL_OPTIONS: ReadonlyArray<{
  value: ConductorMaterial;
  label: string;
}> = [
  { value: "copper", label: "Copper" },
  { value: "aluminium", label: "Aluminium" },
];

const CIRCUIT_OPTIONS: ReadonlyArray<{
  value: CircuitType;
  label: string;
}> = [
  { value: "dc", label: "DC (2-wire)" },
  { value: "ac-single-phase", label: "AC single-phase" },
  { value: "ac-three-phase", label: "AC three-phase" },
];

export interface VoltageDropCircuitFormProps {
  readonly currentA: string;
  readonly lengthM: string;
  readonly systemVoltageV: string;
  readonly material: ConductorMaterial;
  readonly circuitType: CircuitType;
  readonly errors: FormValidationErrors;
  readonly disabled?: boolean;
  readonly onField: (field: string, value: string) => void;
}

export function VoltageDropCircuitForm(props: VoltageDropCircuitFormProps) {
  const { errors, disabled, onField } = props;

  return (
    <fieldset disabled={disabled}>
      <legend>Circuit parameters</legend>

      <label>
        Current (A)
        <input
          type="number"
          min="0"
          step="1"
          value={props.currentA}
          onChange={(e) => onField("currentA", e.target.value)}
        />
        {errors["currentA"] && <span role="alert">{errors["currentA"]}</span>}
      </label>

      <label>
        One-way length (m)
        <input
          type="number"
          min="0"
          step="0.5"
          value={props.lengthM}
          onChange={(e) => onField("lengthM", e.target.value)}
        />
        {errors["lengthM"] && <span role="alert">{errors["lengthM"]}</span>}
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

      <label>
        Material
        <select
          value={props.material}
          onChange={(e) => onField("material", e.target.value)}
        >
          {MATERIAL_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
      </label>

      <label>
        Circuit type
        <select
          value={props.circuitType}
          onChange={(e) => onField("circuitType", e.target.value)}
        >
          {CIRCUIT_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
      </label>
    </fieldset>
  );
}
