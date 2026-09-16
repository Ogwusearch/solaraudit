/**
 * SolarAudit — Voltage Drop feature: Result panel
 *
 * Renders the engine result as-is. Handles BOTH modes: the forward
 * outputs are shown when they exist, the inverse output when it exists,
 * and the verdict is shown when a target was provided.
 */

import type { VoltageDropView } from "../types";

export interface VoltageDropResultPanelProps {
  readonly view: VoltageDropView | null;
}

export function VoltageDropResultPanel(props: VoltageDropResultPanelProps) {
  if (!props.view) {
    return <p>No result yet.</p>;
  }

  const { result, calculatedAt } = props.view;

  return (
    <section aria-label="Voltage drop result">
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
          <h4>Context</h4>
          <dl>
            <dt>Circuit factor</dt>
            <dd>{result.circuitFactor}</dd>

            <dt>Conductor temperature</dt>
            <dd>{result.conductorTempC} °C</dd>

            <dt>Power factor</dt>
            <dd>{result.effectivePowerFactor}</dd>

            <dt>Resistivity ρ(T)</dt>
            <dd>{result.resistivityOhmMm2PerM} Ω·mm²/m</dd>
          </dl>

          {result.voltageDropV > 0 && (
            <>
              <h4>Forward (computed drop)</h4>
              <dl>
                <dt>Voltage drop</dt>
                <dd>{result.voltageDropV} V</dd>

                <dt>Voltage drop (%)</dt>
                <dd>{result.voltageDropPercent} %</dd>

                <dt>Resistance per km</dt>
                <dd>{result.resistanceOhmPerKm} Ω/km</dd>

                <dt>Total resistance</dt>
                <dd>{result.resistanceOhm} Ω</dd>

                <dt>Power loss</dt>
                <dd>{result.powerLossW} W</dd>
              </dl>
            </>
          )}

          {result.calculatedMinAreaMm2 > 0 && (
            <>
              <h4>Inverse (solved minimum area)</h4>
              <dl>
                <dt>Minimum conductor area</dt>
                <dd>{result.calculatedMinAreaMm2} mm²</dd>
              </dl>
            </>
          )}

          {result.voltageDropPercent > 0 && (
            <>
              <h4>Verdict</h4>
              <dl>
                <dt>Within target</dt>
                <dd>{result.withinTarget ? "yes" : "no"}</dd>
              </dl>
            </>
          )}
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
