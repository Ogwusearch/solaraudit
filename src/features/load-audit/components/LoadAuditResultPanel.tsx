/**
 * SolarAudit — Load Audit feature: Result panel
 *
 * Renders the engine result as-is. No re-computation, no formula.
 * The panel trusts the engine's numbers and surfaces its warnings and
 * errors unchanged.
 */

import type { LoadAuditView } from "../types";

export interface LoadAuditResultPanelProps {
  readonly view: LoadAuditView | null;
}

export function LoadAuditResultPanel(props: LoadAuditResultPanelProps) {
  if (!props.view) {
    return <p>No result yet.</p>;
  }

  const { result, calculatedAt } = props.view;

  return (
    <section aria-label="Load audit result">
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
          <dt>Total daily energy</dt>
          <dd>{result.totalDailyEnergyKwh} kWh</dd>

          <dt>Peak load</dt>
          <dd>{result.peakLoadKw} kW</dd>

          <dt>Load factor</dt>
          <dd>{result.loadFactor}</dd>
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
