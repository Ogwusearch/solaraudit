/**
 * SolarAudit — Protection Sizing feature: Design inputs
 *
 * Safety factor override and available fault current.
 * Both optional — empty means "engine default" / "not provided".
 * Presentational. No engineering logic.
 */

import type { FormValidationErrors } from "../types";

export interface DesignInputsFormProps {
  readonly safetyFactor: string;
  readonly availableFaultCurrentKa: string;
  readonly errors: FormValidationErrors;
  readonly disabled?: boolean;
  readonly onField: (field: string, value: string) => void;
}

export function DesignInputsForm(props: DesignInputsFormProps) {
  const { errors, disabled, onField } = props;

  return (
    <fieldset disabled={disabled}>
      <legend>Design inputs (optional)</legend>

      <label>
        Safety factor override
        <input
          type="number"
          min="1"
          step="0.05"
          value={props.safetyFactor}
          onChange={(e) => onField("safetyFactor", e.target.value)}
          placeholder="default: role-based"
        />
        {errors["safetyFactor"] && (
          <span role="alert">{errors["safetyFactor"]}</span>
        )}
      </label>

      <label>
        Available fault current (kA)
        <input
          type="number"
          min="0"
          step="0.1"
          value={props.availableFaultCurrentKa}
          onChange={(e) =>
            onField("availableFaultCurrentKa", e.target.value)
          }
          placeholder="unset"
        />
        {errors["availableFaultCurrentKa"] && (
          <span role="alert">{errors["availableFaultCurrentKa"]}</span>
        )}
      </label>
    </fieldset>
  );
}
