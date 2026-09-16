/**
 * SolarAudit — Solar Sizing feature: Result panel
 *
 * Renders the engine result as-is. No re-computation, no formula.
 */

import type { SolarSizingView } from "../types";

export interface SolarSizingResultPanelProps {
  readonly view: SolarSizingView | null;
}

export function SolarSizingResultPanel(props: SolarSizingResultPanelProps) {
  if (!props.view) {
    return <p>No result yet.</p>;
  }

  const { result, calculatedAt } = props.view;

  return (
    <section aria-label="Solar sizing result">
      <h3>Result</h3>

      {!result.isValid && result.errors.length > 0 && (
        <div role="alert">
          <strong>Invalid input:</strong>
          <ul>
            {result.errors.map((e, i) => (
              <li key={i}>{e}</li>
            ))}
          </ul>
        </div>
      )}

      {result.isValid && (
        <dl>
          <dt>Required array</dt>
          <dd>{result.requiredArrayKwp} kWp</dd>

          <dt>Design array</dt>
          <dd>{result.designArrayKwp} kWp</dd>

          <dt>Installed array</dt>
          <dd>{result.actualArrayKwp} kWp</dd>

          <dt>Configuration</dt>
          <dd>
            {result.seriesPanels}S × {result.parallelStrings}P
            ({result.totalPanels} panels)
          </dd>

          <dt>Array Vmp</dt>
          <dd>{result.arrayVmp} V</dd>

          <dt>Array Voc</dt>
          <dd>{result.arrayVoc} V</dd>

          <dt>Array Imp</dt>
          <dd>{result.arrayImp} A</dd>

          <dt>Array Isc</dt>
          <dd>{result.arrayIsc} A</dd>
        </dl>
      )}

      {result.warnings.length > 0 && (
        <div>
          <strong>Warnings:</strong>
          <ul>
            {result.warnings.map((w, i) => (
              <li key={i}>{w}</li>
            ))}
          </ul>
        </div>
      )}

      <small>Calculated at {calculatedAt}</small>
    </section>
  );
}
