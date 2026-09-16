/**
 * SolarAudit — Load Audit feature: Controls
 *
 * Diversity factor, safety margin, and action buttons.
 * Presentational. No engineering logic.
 */

export interface LoadAuditControlsProps {
  readonly diversityFactor: string;
  readonly safetyMargin: string;
  readonly diversityError?: string;
  readonly safetyError?: string;
  readonly disabled?: boolean;
  readonly onChangeDiversityFactor: (value: string) => void;
  readonly onChangeSafetyMargin: (value: string) => void;
  readonly onCalculate: () => void;
  readonly onReset: () => void;
  readonly onLoadSample: () => void;
}

export function LoadAuditControls(props: LoadAuditControlsProps) {
  return (
    <fieldset>
      <legend>Design factors</legend>

      <label>
        Diversity factor
        <input
          type="number"
          min="0"
          max="1"
          step="0.05"
          value={props.diversityFactor}
          onChange={(e) => props.onChangeDiversityFactor(e.target.value)}
          disabled={props.disabled}
        />
        {props.diversityError && (
          <span role="alert">{props.diversityError}</span>
        )}
      </label>

      <label>
        Safety margin
        <input
          type="number"
          min="0"
          step="0.05"
          value={props.safetyMargin}
          onChange={(e) => props.onChangeSafetyMargin(e.target.value)}
          disabled={props.disabled}
        />
        {props.safetyError && (
          <span role="alert">{props.safetyError}</span>
        )}
      </label>

      <div>
        <button
          type="button"
          onClick={props.onCalculate}
          disabled={props.disabled}
        >
          Calculate
        </button>
        <button type="button" onClick={props.onLoadSample}>
          Load sample
        </button>
        <button type="button" onClick={props.onReset}>
          Reset
        </button>
      </div>
    </fieldset>
  );
}
