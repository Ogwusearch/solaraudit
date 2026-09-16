/**
 * SolarAudit — Solar Sizing feature: Optional array constraints
 *
 * Presentational. All fields are optional — empty means "no constraint".
 */

export interface SolarSizingConstraintsFormProps {
  readonly maxSeriesPanels: string;
  readonly maxParallelStrings: string;
  readonly maxArrayVoc: string;
  readonly minArrayVmp: string;
  readonly disabled?: boolean;
  readonly onField: (field: string, value: string) => void;
}

export function SolarSizingConstraintsForm(
  props: SolarSizingConstraintsFormProps,
) {
  const { disabled, onField } = props;

  return (
    <fieldset disabled={disabled}>
      <legend>Array constraints (optional)</legend>

      <label>
        Max series panels
        <input
          type="number"
          min="1"
          step="1"
          value={props.maxSeriesPanels}
          onChange={(e) => onField("maxSeriesPanels", e.target.value)}
          placeholder="unset"
        />
      </label>

      <label>
        Max parallel strings
        <input
          type="number"
          min="1"
          step="1"
          value={props.maxParallelStrings}
          onChange={(e) => onField("maxParallelStrings", e.target.value)}
          placeholder="unset"
        />
      </label>

      <label>
        Max array Voc (V)
        <input
          type="number"
          min="0"
          step="1"
          value={props.maxArrayVoc}
          onChange={(e) => onField("maxArrayVoc", e.target.value)}
          placeholder="unset"
        />
      </label>

      <label>
        Min array Vmp (V)
        <input
          type="number"
          min="0"
          step="1"
          value={props.minArrayVmp}
          onChange={(e) => onField("minArrayVmp", e.target.value)}
          placeholder="unset"
        />
      </label>
    </fieldset>
  );
}
