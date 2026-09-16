/**
 * SolarAudit — Protection Sizing feature: Candidate device
 *
 * Optional. When provided, the engine checks the device against the
 * required voltage / interrupt / current ratings and returns
 * isValid:false if the device is under-rated.
 *
 * Presentational. No engineering logic.
 */

export interface CandidateDeviceFormProps {
  readonly deviceVoltageRatingV: string;
  readonly deviceInterruptRatingKa: string;
  readonly deviceCurrentRatingA: string;
  readonly disabled?: boolean;
  readonly onField: (field: string, value: string) => void;
}

export function CandidateDeviceForm(props: CandidateDeviceFormProps) {
  const { disabled, onField } = props;

  return (
    <fieldset disabled={disabled}>
      <legend>Candidate device (optional)</legend>

      <label>
        Device voltage rating (V)
        <input
          type="number"
          min="0"
          step="1"
          value={props.deviceVoltageRatingV}
          onChange={(e) => onField("deviceVoltageRatingV", e.target.value)}
          placeholder="unset"
        />
      </label>

      <label>
        Device interrupt rating (kA)
        <input
          type="number"
          min="0"
          step="0.1"
          value={props.deviceInterruptRatingKa}
          onChange={(e) =>
            onField("deviceInterruptRatingKa", e.target.value)
          }
          placeholder="unset"
        />
      </label>

      <label>
        Device current rating (A)
        <input
          type="number"
          min="0"
          step="1"
          value={props.deviceCurrentRatingA}
          onChange={(e) => onField("deviceCurrentRatingA", e.target.value)}
          placeholder="unset"
        />
      </label>
    </fieldset>
  );
}
