/**
 * SolarAudit — Protection Sizing feature: Result panel
 *
 * Renders the engine result as-is. No re-computation.
 *
 * Highlights the three compatibility booleans because this engine
 * treats them as part of the validity verdict.
 */

import type { ProtectionSizingView } from "../types";

export interface ProtectionSizingResultPanelProps {
  readonly view: ProtectionSizingView | null;
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

export function ProtectionSizingResultPanel(
  props: ProtectionSizingResultPanelProps,
) {
  if (!props.view) {
    return <p>No result yet.</p>;
  }

  const { result, calculatedAt } = props.view;

  return (
    <section aria-label="Protection sizing result">
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
          <h4>Requirements</h4>
          <dl>
            <dt>Role</dt>
            <dd>{result.role}</dd>

            <dt>Technology</dt>
            <dd>{result.technology}</dd>

            <dt>Design current</dt>
            <dd>{result.designCurrentA} A</dd>

            <dt>Recommended rating</dt>
            <dd>{result.recommendedRatingA} A</dd>

            <dt>Minimum voltage rating</dt>
            <dd>{result.minimumVoltageRatingV} V</dd>

            <dt>Minimum interrupt rating</dt>
            <dd>{result.minimumInterruptRatingKa} kA</dd>

            <dt>Selected rating</dt>
            <dd>{result.selectedRatingA} A</dd>
          </dl>

          <h4>Compatibility</h4>
          <dl>
            <CompatFlag
              label="Voltage compatibility"
              value={result.voltageCompatible}
            />
            <CompatFlag
              label="Interrupt compatibility"
              value={result.interruptCompatible}
            />
            <CompatFlag
              label="Current rating sufficient"
              value={result.currentRatingSufficient}
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
