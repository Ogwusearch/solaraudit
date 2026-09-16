/**
 * SolarAudit — Reports feature: Assumptions table
 *
 * Key / value / source rows. Presentational.
 */

import type { AssumptionDraft, FormValidationErrors } from "../types";

export interface AssumptionsTableProps {
  readonly assumptions: readonly AssumptionDraft[];
  readonly errors: FormValidationErrors;
  readonly disabled?: boolean;
  readonly onField: (
    id: string,
    field: keyof Omit<AssumptionDraft, "id">,
    value: string,
  ) => void;
  readonly onAdd: () => void;
  readonly onRemove: (id: string) => void;
}

export function AssumptionsTable(props: AssumptionsTableProps) {
  const { assumptions, errors, disabled, onField, onAdd, onRemove } = props;

  return (
    <fieldset disabled={disabled}>
      <legend>Assumptions</legend>

      <table>
        <thead>
          <tr>
            <th>Key</th>
            <th>Value</th>
            <th>Source</th>
            <th aria-label="Actions" />
          </tr>
        </thead>
        <tbody>
          {assumptions.map((a, idx) => (
            <tr key={a.id}>
              <td>
                <input
                  type="text"
                  value={a.key}
                  onChange={(e) => onField(a.id, "key", e.target.value)}
                  placeholder="e.g. Peak sun hours"
                />
                {errors[`assumptions.${idx}.key`] && (
                  <span role="alert">
                    {errors[`assumptions.${idx}.key`]}
                  </span>
                )}
              </td>
              <td>
                <input
                  type="text"
                  value={a.value}
                  onChange={(e) => onField(a.id, "value", e.target.value)}
                  placeholder="e.g. 4.5 h"
                />
              </td>
              <td>
                <input
                  type="text"
                  value={a.source}
                  onChange={(e) => onField(a.id, "source", e.target.value)}
                  placeholder="site survey / default / code"
                />
              </td>
              <td>
                <button
                  type="button"
                  onClick={() => onRemove(a.id)}
                  aria-label="Remove assumption"
                >
                  ✕
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      <button type="button" onClick={onAdd}>
        + Add assumption
      </button>
    </fieldset>
  );
}
