/**
 * SolarAudit — Load Audit feature: Appliance table
 *
 * Presentational. Wires rows to callbacks. No engineering logic.
 */

import type { ApplianceRowDraft, FormValidationErrors } from "../types";
import { ApplianceRow } from "./ApplianceRow";

export interface ApplianceTableProps {
  readonly rows: readonly ApplianceRowDraft[];
  readonly errors: FormValidationErrors;
  readonly onAddRow: () => void;
  readonly onChangeName: (id: string, value: string) => void;
  readonly onChangePower: (id: string, value: string) => void;
  readonly onChangeHours: (id: string, value: string) => void;
  readonly onChangeQuantity: (id: string, value: string) => void;
  readonly onChangeEssential: (id: string, value: boolean) => void;
  readonly onRemoveRow: (id: string) => void;
}

export function ApplianceTable(props: ApplianceTableProps) {
  const { rows, errors, onAddRow } = props;

  return (
    <div>
      <table>
        <thead>
          <tr>
            <th>Name</th>
            <th>Power (W)</th>
            <th>Hours/day</th>
            <th>Qty</th>
            <th>Essential</th>
            <th aria-label="Actions" />
          </tr>
        </thead>
        <tbody>
          {rows.map((row, idx) => (
            <ApplianceRow
              key={row.id}
              row={row}
              errorName={errors[`appliances.${idx}.name`]}
              errorPower={errors[`appliances.${idx}.powerWatts`]}
              errorHours={errors[`appliances.${idx}.hoursPerDay`]}
              errorQuantity={errors[`appliances.${idx}.quantity`]}
              onChangeName={(v) => props.onChangeName(row.id, v)}
              onChangePower={(v) => props.onChangePower(row.id, v)}
              onChangeHours={(v) => props.onChangeHours(row.id, v)}
              onChangeQuantity={(v) => props.onChangeQuantity(row.id, v)}
              onChangeEssential={(v) => props.onChangeEssential(row.id, v)}
              onRemove={() => props.onRemoveRow(row.id)}
            />
          ))}
        </tbody>
      </table>
      {errors["appliances"] && (
        <p role="alert">{errors["appliances"]}</p>
      )}
      <button type="button" onClick={onAddRow}>
        + Add appliance
      </button>
    </div>
  );
}
