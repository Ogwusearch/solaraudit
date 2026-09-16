/**
 * SolarAudit — Battery Sizing feature: Cell spec form
 *
 * Presentational. No engineering logic.
 */

import type {
  BatteryTechnology,
} from "../../../engineering/battery";
import type { CellSpecDraft, FormValidationErrors } from "../types";

const TECHNOLOGY_OPTIONS: ReadonlyArray<{
  value: BatteryTechnology;
  label: string;
}> = [
  { value: "flooded-lead-acid", label: "Flooded lead-acid" },
  { value: "agm", label: "AGM" },
  { value: "gel", label: "Gel" },
  { value: "lifepo4", label: "LiFePO4" },
  { value: "li-ion-nmc", label: "Li-ion NMC" },
];

export interface BatteryCellSpecFormProps {
  readonly cell: CellSpecDraft;
  readonly errors: FormValidationErrors;
  readonly disabled?: boolean;
  readonly onChange: (field: keyof CellSpecDraft, value: string) => void;
}

export function BatteryCellSpecForm(props: BatteryCellSpecFormProps) {
  const { cell, errors, disabled, onChange } = props;

  return (
    <fieldset disabled={disabled}>
      <legend>Battery cell specification</legend>

      <label>
        Name
        <input
          type="text"
          value={cell.name}
          onChange={(e) => onChange("name", e.target.value)}
          placeholder="e.g. LFP 12 V 100 Ah"
        />
        {errors["cell.name"] && <span role="alert">{errors["cell.name"]}</span>}
      </label>

      <label>
        Technology
        <select
          value={cell.technology}
          onChange={(e) => onChange("technology", e.target.value)}
        >
          {TECHNOLOGY_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
      </label>

      <label>
        Nominal voltage (V)
        <input
          type="number"
          min="0"
          step="1"
          value={cell.nominalVoltage}
          onChange={(e) => onChange("nominalVoltage", e.target.value)}
        />
        {errors["cell.nominalVoltage"] && (
          <span role="alert">{errors["cell.nominalVoltage"]}</span>
        )}
      </label>

      <label>
        Capacity (Ah)
        <input
          type="number"
          min="0"
          step="1"
          value={cell.capacityAh}
          onChange={(e) => onChange("capacityAh", e.target.value)}
        />
        {errors["cell.capacityAh"] && (
          <span role="alert">{errors["cell.capacityAh"]}</span>
        )}
      </label>

      <label>
        Cell max DoD
        <input
          type="number"
          min="0"
          max="1"
          step="0.05"
          value={cell.maxDepthOfDischarge}
          onChange={(e) => onChange("maxDepthOfDischarge", e.target.value)}
        />
        {errors["cell.maxDepthOfDischarge"] && (
          <span role="alert">{errors["cell.maxDepthOfDischarge"]}</span>
        )}
      </label>

      <label>
        Cell round-trip efficiency
        <input
          type="number"
          min="0"
          max="1"
          step="0.05"
          value={cell.roundTripEfficiency}
          onChange={(e) => onChange("roundTripEfficiency", e.target.value)}
        />
        {errors["cell.roundTripEfficiency"] && (
          <span role="alert">{errors["cell.roundTripEfficiency"]}</span>
        )}
      </label>

      <label>
        Max charge current (A, optional)
        <input
          type="number"
          min="0"
          step="1"
          value={cell.maxChargeCurrentA}
          onChange={(e) => onChange("maxChargeCurrentA", e.target.value)}
          placeholder="unset"
        />
      </label>
    </fieldset>
  );
}
