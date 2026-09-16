/**
 * SolarAudit — Charge Controller Sizing feature: Result panel
 *
 * Renders the engine result as-is. No re-computation.
 *
 * Highlights the electrical compatibility flags because this engine
 * treats them as part of the validity verdict.
 */

import type { ChargeControllerSizingView } from "../types";

export interface ChargeControllerSizingResultPanelProps {
  readonly view: ChargeControllerSizingView | null;
}

function CompatFlag({
  label,
  value,
}: {
  label: string;
  value: boolean;
}) {
  return (
    <div>
      <dt>{label}</dt>
      <dd>{value ? "compatible" : "not compatible"}</dd>
    </div>
  );
}

export function ChargeControllerSizingResultPanel(
  props: ChargeControllerSizingResultPanelProps,
) {
  if (!props.view) {
    return <p>No result yet.</p>;
  }

  const { result, calculatedAt } = props.view;

  return (
    <section aria-label="Charge controller sizing result">
      <h3>Result</h3>

      {!result.isValid && result.errors.length > 0 && (
        <div role="alert">
          <strong>Invalid configuration:</strong>
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
            <dt>Required charge current</dt>
            <dd>{result.requiredChargeCurrentA} A</dd>

            <dt>Design charge current</dt>
            <dd>{result.designChargeCurrentA} A</dd>

            <dt>Recommended controller</dt>
            <dd>{result.recommendedControllerCurrentA} A</dd>

            <dt>Recommended standard size</dt>
            <dd>{result.recommendedStandardA} A</dd>

            <dt>Technology</dt>
            <dd>{result.technology.toUpperCase()}</dd>
          </dl>

          <dl>
            <CompatFlag
              label="PV voltage compatibility"
              value={result.pvVoltageCompatible}
            />
            <CompatFlag
              label="PV current compatibility"
              value={result.pvCurrentCompatible}
            />
            <CompatFlag
              label="Output current compatibility"
              value={result.outputCurrentCompatible}
            />
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
