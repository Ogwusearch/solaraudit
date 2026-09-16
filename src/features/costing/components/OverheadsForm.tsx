/**
 * SolarAudit — Costing feature: Overheads + waste/discount/tax
 *
 * Presentational. No engineering logic.
 */

import type { FormValidationErrors } from "../types";

export interface OverheadsFormProps {
  readonly currency: string;
  readonly wasteFactor: string;
  readonly discountPercent: string;
  readonly taxPercent: string;
  readonly installationPercent: string;
  readonly transportPercent: string;
  readonly engineeringPercent: string;
  readonly contingencyPercent: string;
  readonly errors: FormValidationErrors;
  readonly disabled?: boolean;
  readonly onTopField: (field: string, value: string) => void;
  readonly onOverheadField: (field: string, value: string) => void;
}

export function OverheadsForm(props: OverheadsFormProps) {
  const { errors, disabled, onTopField, onOverheadField } = props;

  return (
    <>
      <fieldset disabled={disabled}>
        <legend>Currency &amp; adjustments</legend>

        <label>
          Currency
          <input
            type="text"
            value={props.currency}
            onChange={(e) => onTopField("currency", e.target.value)}
            placeholder="e.g. USD, NGN"
            maxLength={3}
          />
          {errors["currency"] && (
            <span role="alert">{errors["currency"]}</span>
          )}
        </label>

        <label>
          Waste factor (0..1)
          <input
            type="number"
            min="0"
            max="1"
            step="0.01"
            value={props.wasteFactor}
            onChange={(e) => onTopField("wasteFactor", e.target.value)}
          />
          {errors["wasteFactor"] && (
            <span role="alert">{errors["wasteFactor"]}</span>
          )}
        </label>

        <label>
          Discount (%)
          <input
            type="number"
            min="0"
            max="100"
            step="0.5"
            value={props.discountPercent}
            onChange={(e) => onTopField("discountPercent", e.target.value)}
          />
          {errors["discountPercent"] && (
            <span role="alert">{errors["discountPercent"]}</span>
          )}
        </label>

        <label>
          Tax (%)
          <input
            type="number"
            min="0"
            max="100"
            step="0.5"
            value={props.taxPercent}
            onChange={(e) => onTopField("taxPercent", e.target.value)}
          />
          {errors["taxPercent"] && (
            <span role="alert">{errors["taxPercent"]}</span>
          )}
        </label>
      </fieldset>

      <fieldset disabled={disabled}>
        <legend>Overheads (% of adjusted materials)</legend>

        <label>
          Installation (%)
          <input
            type="number"
            min="0"
            max="100"
            step="0.5"
            value={props.installationPercent}
            onChange={(e) =>
              onOverheadField("installationPercent", e.target.value)
            }
          />
          {errors["overheads.installationPercent"] && (
            <span role="alert">
              {errors["overheads.installationPercent"]}
            </span>
          )}
        </label>

        <label>
          Transport (%)
          <input
            type="number"
            min="0"
            max="100"
            step="0.5"
            value={props.transportPercent}
            onChange={(e) =>
              onOverheadField("transportPercent", e.target.value)
            }
          />
          {errors["overheads.transportPercent"] && (
            <span role="alert">
              {errors["overheads.transportPercent"]}
            </span>
          )}
        </label>

        <label>
          Engineering (%)
          <input
            type="number"
            min="0"
            max="100"
            step="0.5"
            value={props.engineeringPercent}
            onChange={(e) =>
              onOverheadField("engineeringPercent", e.target.value)
            }
          />
          {errors["overheads.engineeringPercent"] && (
            <span role="alert">
              {errors["overheads.engineeringPercent"]}
            </span>
          )}
        </label>

        <label>
          Contingency (%)
          <input
            type="number"
            min="0"
            max="100"
            step="0.5"
            value={props.contingencyPercent}
            onChange={(e) =>
              onOverheadField("contingencyPercent", e.target.value)
            }
          />
          {errors["overheads.contingencyPercent"] && (
            <span role="alert">
              {errors["overheads.contingencyPercent"]}
            </span>
          )}
        </label>
      </fieldset>
    </>
  );
}
