/**
 * SolarAudit — Costing feature: Line items table
 *
 * Presentational. No engineering logic, no total computation — the
 * engine produces all sums.
 */

import type { CostCategory } from "../../../engineering/costing";
import type { CostLineItemDraft, FormValidationErrors } from "../types";

const CATEGORY_OPTIONS: ReadonlyArray<{ value: CostCategory; label: string }> = [
  { value: "pv-modules", label: "PV modules" },
  { value: "batteries", label: "Batteries" },
  { value: "inverter", label: "Inverter" },
  { value: "charge-controller", label: "Charge controller" },
  { value: "dc-breakers", label: "DC breakers" },
  { value: "ac-breakers", label: "AC breakers" },
  { value: "fuses", label: "Fuses" },
  { value: "spd", label: "SPD" },
  { value: "cables", label: "Cables" },
  { value: "connectors", label: "Connectors" },
  { value: "busbars", label: "Busbars" },
  { value: "enclosures", label: "Enclosures" },
  { value: "mounting", label: "Mounting" },
  { value: "earthing", label: "Earthing" },
  { value: "monitoring", label: "Monitoring" },
  { value: "labour", label: "Labour" },
  { value: "transport", label: "Transport" },
  { value: "engineering", label: "Engineering" },
  { value: "other", label: "Other" },
];

export interface LineItemsTableProps {
  readonly items: readonly CostLineItemDraft[];
  readonly errors: FormValidationErrors;
  readonly disabled?: boolean;
  readonly onField: (
    id: string,
    field: keyof Omit<CostLineItemDraft, "id">,
    value: string,
  ) => void;
  readonly onAdd: () => void;
  readonly onRemove: (id: string) => void;
}

export function LineItemsTable(props: LineItemsTableProps) {
  const { items, errors, disabled, onField, onAdd, onRemove } = props;

  return (
    <fieldset disabled={disabled}>
      <legend>Line items</legend>

      <table>
        <thead>
          <tr>
            <th>Category</th>
            <th>Description</th>
            <th>Qty</th>
            <th>Unit</th>
            <th>Unit cost</th>
            <th aria-label="Actions" />
          </tr>
        </thead>
        <tbody>
          {items.map((item, idx) => (
            <tr key={item.id}>
              <td>
                <select
                  value={item.category}
                  onChange={(e) => onField(item.id, "category", e.target.value)}
                >
                  {CATEGORY_OPTIONS.map((o) => (
                    <option key={o.value} value={o.value}>
                      {o.label}
                    </option>
                  ))}
                </select>
              </td>
              <td>
                <input
                  type="text"
                  value={item.description}
                  onChange={(e) =>
                    onField(item.id, "description", e.target.value)
                  }
                  placeholder="e.g. 400 W mono panel"
                />
                {errors[`items.${idx}.description`] && (
                  <span role="alert">
                    {errors[`items.${idx}.description`]}
                  </span>
                )}
              </td>
              <td>
                <input
                  type="number"
                  min="0"
                  step="1"
                  value={item.quantity}
                  onChange={(e) =>
                    onField(item.id, "quantity", e.target.value)
                  }
                />
                {errors[`items.${idx}.quantity`] && (
                  <span role="alert">{errors[`items.${idx}.quantity`]}</span>
                )}
              </td>
              <td>
                <input
                  type="text"
                  value={item.unit}
                  onChange={(e) => onField(item.id, "unit", e.target.value)}
                  placeholder="pcs"
                />
              </td>
              <td>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={item.unitCost}
                  onChange={(e) =>
                    onField(item.id, "unitCost", e.target.value)
                  }
                />
                {errors[`items.${idx}.unitCost`] && (
                  <span role="alert">{errors[`items.${idx}.unitCost`]}</span>
                )}
              </td>
              <td>
                <button
                  type="button"
                  onClick={() => onRemove(item.id)}
                  aria-label="Remove line item"
                  disabled={items.length <= 1}
                >
                  ✕
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {errors["items"] && <p role="alert">{errors["items"]}</p>}

      <button type="button" onClick={onAdd}>
        + Add line item
      </button>
    </fieldset>
  );
}
