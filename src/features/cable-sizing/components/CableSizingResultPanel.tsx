/**
 * SolarAudit — Cable Sizing feature: Result panel
 *
 * Renders the engine result as-is. No re-computation.
 *
 * The panel shows BOTH sizing drivers (voltage drop area and ampacity
 * area) side by side, plus the selected size and its actual drop. The
 * engine has already chosen the larger of the two as the requirement —
 * the panel just exposes the reasoning.
 */

import type { CableSizingView } from "../types";

export interface CableSizingResultPanelProps {
  readonly view: CableSizingView | null;
}

export function CableSizingResultPanel(props: CableSizingResultPanelProps) {
  if (!props.view) {
    return <p>No result yet.</p>;
  }

  const { result, calculatedAt } = props.view;

  return (
    <section aria-label="Cable sizing result">
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
        <>
          <dl>
            <dt>Design current</dt>
            <dd>{result.designCurrentA} A</dd>

            <dt>Allowable voltage drop</dt>
            <dd>{result.maxVoltageDropV} V</dd>
          </dl>

          <h4>Sizing drivers</h4>
          <dl>
            <dt>Minimum area (voltage drop)</dt>
            <dd>{result.calculatedAreaMm2} mm²</dd>

            <dt>Minimum area (ampacity)</dt>
            <dd>{result.ampacityAreaMm2} mm²</dd>

            <dt>Required area (max of both)</dt>
            <dd>{result.requiredAreaMm2} mm²</dd>

            <dt>
              <strong>Selected conductor</strong>
            </dt>
            <dd>
              <strong>{result.selectedAreaMm2} mm²</strong>
            </dd>
          </dl>

          <h4>Selected conductor performance</h4>
          <dl>
            <dt>Actual voltage drop</dt>
            <dd>{result.actualVoltageDropV} V</dd>

            <dt>Actual voltage drop (%)</dt>
            <dd>{result.actualDropPercent} %</dd>

            <dt>Resistance</dt>
            <dd>{result.resistanceOhmPerKm} Ω/km</dd>

            <dt>Derated ampacity</dt>
            <dd>{result.deratedAmpacityA} A</dd>
          </dl>

          <h4>Derating factors</h4>
          <dl>
            <dt>Temperature factor</dt>
            <dd>{result.temperatureFactor}</dd>

            <dt>Grouping factor</dt>
            <dd>{result.groupingFactor}</dd>
          </dl>
        </>
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
