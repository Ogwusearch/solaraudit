/**
 * SolarAudit — Load Audit feature: Appliance row
 *
 * Presentational. Receives values and callbacks. No engineering logic.
 * No imports from `engineering/`.
 */

import type { ApplianceRowDraft } from "../types";

export interface ApplianceRowProps {
  readonly row: ApplianceRowDraft;
  readonly errorName?: string;
  readonly errorPower?: string;
  readonly errorHours?: string;
  readonly errorQuantity?: string;
  readonly onChangeName: (value: string) => void;
  readonly onChangePower: (value: string) => void;
  readonly onChangeHours: (value: string) => void;
  readonly onChangeQuantity: (value: string) => void;
  readonly onChangeEssential: (value: boolean) => void;
  readonly onRemove: () => void;
}

export function ApplianceRow(props: ApplianceRowProps) {
  const {
    row,
    errorName,
    errorPower,
    errorHours,
    errorQuantity,
    onChangeName,
    onChangePower,
    onChangeHours,
    onChangeQuantity,
    onChangeEssential,
    onRemove,
  } = props;

  return (
    <tr>
      <td>
        <input
          type="text"
          value={row.name}
          onChange={(e) => onChangeName(e.target.value)}
          placeholder="e.g. Refrigerator"
          aria-label="Appliance name"
        />
        {errorName && <span role="alert">{errorName}</span>}
      </td>
      <td>
        <input
          type="number"
          min="0"
          value={row.powerWatts}
          onChange={(e) => onChangePower(e.target.value)}
          placeholder="W"
          aria-label="Power (W)"
        />
        {errorPower && <span role="alert">{errorPower}</span>}
      </td>
      <td>
        <input
          type="number"
          min="0"
          max="24"
          step="0.5"
          value={row.hoursPerDay}
          onChange={(e) => onChangeHours(e.target.value)}
          placeholder="h"
          aria-label="Hours per day"
        />
        {errorHours && <span role="alert">{errorHours}</span>}
      </td>
      <td>
        <input
          type="number"
          min="1"
          step="1"
          value={row.quantity}
          onChange={(e) => onChangeQuantity(e.target.value)}
          placeholder="qty"
          aria-label="Quantity"
        />
        {errorQuantity && <span role="alert">{errorQuantity}</span>}
      </td>
      <td>
        <input
          type="checkbox"
          checked={row.essential}
          onChange={(e) => onChangeEssential(e.target.checked)}
          aria-label="Essential"
        />
      </td>
      <td>
        <button type="button" onClick={onRemove} aria-label="Remove row">
          ✕
        </button>
      </td>
    </tr>
  );
}
