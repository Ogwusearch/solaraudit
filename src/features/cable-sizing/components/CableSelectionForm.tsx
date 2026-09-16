/**
 * SolarAudit — Cable Sizing feature: Material / circuit / installation
 *
 * Presentational. Three closed-list selects. No engineering logic.
 */

import type {
  CircuitType,
  ConductorMaterial,
  InstallationMethod,
} from "../../../engineering/cable";
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

const INSTALLATION_OPTIONS: ReadonlyArray<{
  value: InstallationMethod;
  label: string;
}> = [
  { value: "conduit", label: "Conduit" },
  { value: "cable-tray", label: "Cable tray" },
  { value: "buried", label: "Buried" },
  { value: "free-air", label: "Free air" },
  { value: "enclosed", label: "Enclosed" },
];

export interface CableSelectionFormProps {
  readonly material: ConductorMaterial;
  readonly circuitType: CircuitType;
  readonly installationMethod: InstallationMethod;
  readonly errors: FormValidationErrors;
  readonly disabled?: boolean;
  readonly onField: (field: string, value: string) => void;
}

export function CableSelectionForm(props: CableSelectionFormProps) {
  const { errors, disabled, onField } = props;

  return (
    <fieldset disabled={disabled}>
      <legend>Conductor &amp; installation</legend>

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

      <label>
        Installation method
        <select
          value={props.installationMethod}
          onChange={(e) => onField("installationMethod", e.target.value)}
        >
          {INSTALLATION_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
      </label>
    </fieldset>
  );
}
