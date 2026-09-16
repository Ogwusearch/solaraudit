/**
 * SolarAudit — Energy Analysis feature: Result panel
 *
 * Renders the engine result as-is. No re-computation.
 */

import type { EnergyAnalysisView } from "../types";

export interface EnergyAnalysisResultPanelProps {
  readonly view: EnergyAnalysisView | null;
}

export function EnergyAnalysisResultPanel(
  props: EnergyAnalysisResultPanelProps,
) {
  if (!props.view) {
    return <p>No result yet.</p>;
  }

  const { result, calculatedAt } = props.view;

  return (
    <section aria-label="Energy analysis result">
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
            <dt>PV generation</dt>
            <dd>{result.pvGenerationKwh} kWh</dd>

            <dt>Consumption</dt>
            <dd>{result.consumptionKwh} kWh</dd>

            <dt>Self-consumed</dt>
            <dd>{result.selfConsumedKwh} kWh</dd>

            <dt>Grid import</dt>
            <dd>{result.gridImportKwh} kWh</dd>

            <dt>Grid export</dt>
            <dd>{result.gridExportKwh} kWh</dd>

            <dt>Self-consumption rate</dt>
            <dd>{result.selfConsumptionRate}</dd>

            <dt>Self-sufficiency rate</dt>
            <dd>{result.selfSufficiencyRate}</dd>
          </dl>

          {(result.batteryChargeKwh > 0 ||
            result.batteryDischargeKwh > 0) && (
            <dl>
              <dt>Battery charge</dt>
              <dd>{result.batteryChargeKwh} kWh</dd>

              <dt>Battery discharge</dt>
              <dd>{result.batteryDischargeKwh} kWh</dd>

              <dt>Battery final SoC</dt>
              <dd>{result.batteryFinalSoc}</dd>

              <dt>Battery cycles</dt>
              <dd>{result.batteryCycles}</dd>
            </dl>
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
