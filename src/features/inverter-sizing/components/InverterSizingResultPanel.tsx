/**
 * SolarAudit — Inverter Sizing feature: Result panel
 *
 * Renders the engine result as-is. No re-computation.
 */

import type { InverterSizingView } from "../types";

export interface InverterSizingResultPanelProps {
  readonly view: InverterSizingView | null;
}

export function InverterSizingResultPanel(
  props: InverterSizingResultPanelProps,
) {
  if (!props.view) {
    return <p>No result yet.</p>;
  }

  const { result, calculatedAt } = props.view;

  return (
    <section aria-label="Inverter sizing result">
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
          <dt>Continuous (VA)</dt>
          <dd>{result.continuousVa} VA</dd>

          <dt>Peak (VA)</dt>
          <dd>{result.peakVa} VA</dd>

          <dt>Surge (VA)</dt>
          <dd>{result.surgeVa} VA</dd>

          <dt>Minimum inverter rating</dt>
          <dd>{result.minInverterVa} VA</dd>

          <dt>Recommended inverter rating</dt>
          <dd>{result.recommendedInverterVa} VA</dd>

          <dt>Required surge capability</dt>
          <dd>{result.requiredSurgeVa} VA</dd>

          <dt>DC input current</dt>
          <dd>{result.dcInputCurrentA} A</dd>

          <dt>DC surge current</dt>
          <dd>{result.dcSurgeCurrentA} A</dd>
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
