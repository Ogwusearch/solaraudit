/**
 * SolarAudit — Battery Sizing feature: Result panel
 *
 * Renders the engine result as-is. No re-computation.
 */

import type { BatterySizingView } from "../types";

export interface BatterySizingResultPanelProps {
  readonly view: BatterySizingView | null;
}

export function BatterySizingResultPanel(
  props: BatterySizingResultPanelProps,
) {
  if (!props.view) {
    return <p>No result yet.</p>;
  }

  const { result, calculatedAt } = props.view;

  return (
    <section aria-label="Battery sizing result">
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
          <dt>Required capacity</dt>
          <dd>{result.requiredCapacityKwh} kWh</dd>

          <dt>Design capacity</dt>
          <dd>{result.designCapacityKwh} kWh</dd>

          <dt>Installed capacity</dt>
          <dd>{result.actualInstalledKwh} kWh</dd>

          <dt>Usable capacity</dt>
          <dd>{result.actualUsableKwh} kWh</dd>

          <dt>Configuration</dt>
          <dd>
            {result.seriesCells}S × {result.parallelStrings}P
            ({result.totalCells} cells)
          </dd>

          <dt>Bank voltage</dt>
          <dd>{result.bankVoltage} V</dd>

          <dt>Bank capacity</dt>
          <dd>{result.bankCapacityAh} Ah</dd>

          {result.maxChargeCurrentA > 0 && (
            <>
              <dt>Max charge current</dt>
              <dd>{result.maxChargeCurrentA} A</dd>
            </>
          )}
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
