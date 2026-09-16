/**
 * SolarAudit — Energy Analysis feature: PV array list
 *
 * Presentational. No engineering logic.
 */

import type { FormValidationErrors, PvArrayDraft } from "../types";

export interface PvArrayListProps {
  readonly arrays: readonly PvArrayDraft[];
  readonly errors: FormValidationErrors;
  readonly disabled?: boolean;
  readonly onField: (idx: number, field: keyof PvArrayDraft, value: string) => void;
  readonly onAdd: () => void;
  readonly onRemove: (idx: number) => void;
}

export function PvArrayList(props: PvArrayListProps) {
  const { arrays, errors, disabled, onField, onAdd, onRemove } = props;

  return (
    <fieldset disabled={disabled}>
      <legend>PV arrays</legend>

      <table>
        <thead>
          <tr>
            <th>Name</th>
            <th>Capacity (kWp)</th>
            <th>Peak sun hours</th>
            <th>Performance ratio</th>
            <th aria-label="Actions" />
          </tr>
        </thead>
        <tbody>
          {arrays.map((pv, idx) => (
            <tr key={idx}>
              <td>
                <input
                  type="text"
                  value={pv.name}
                  onChange={(e) => onField(idx, "name", e.target.value)}
                  placeholder="e.g. Roof array"
                />
                {errors[`pvArrays.${idx}.name`] && (
                  <span role="alert">{errors[`pvArrays.${idx}.name`]}</span>
                )}
              </td>
              <td>
                <input
                  type="number"
                  min="0"
                  step="0.1"
                  value={pv.capacityKwp}
                  onChange={(e) => onField(idx, "capacityKwp", e.target.value)}
                />
                {errors[`pvArrays.${idx}.capacityKwp`] && (
                  <span role="alert">
                    {errors[`pvArrays.${idx}.capacityKwp`]}
                  </span>
                )}
              </td>
              <td>
                <input
                  type="number"
                  min="0"
                  max="24"
                  step="0.1"
                  value={pv.peakSunHours}
                  onChange={(e) =>
                    onField(idx, "peakSunHours", e.target.value)
                  }
                />
                {errors[`pvArrays.${idx}.peakSunHours`] && (
                  <span role="alert">
                    {errors[`pvArrays.${idx}.peakSunHours`]}
                  </span>
                )}
              </td>
              <td>
                <input
                  type="number"
                  min="0"
                  max="1"
                  step="0.05"
                  value={pv.performanceRatio}
                  onChange={(e) =>
                    onField(idx, "performanceRatio", e.target.value)
                  }
                />
                {errors[`pvArrays.${idx}.performanceRatio`] && (
                  <span role="alert">
                    {errors[`pvArrays.${idx}.performanceRatio`]}
                  </span>
                )}
              </td>
              <td>
                <button
                  type="button"
                  onClick={() => onRemove(idx)}
                  aria-label="Remove array"
                  disabled={arrays.length <= 1}
                >
                  ✕
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {errors["pvArrays"] && <p role="alert">{errors["pvArrays"]}</p>}

      <button type="button" onClick={onAdd}>
        + Add PV array
      </button>
    </fieldset>
  );
}
