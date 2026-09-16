/**
 * SolarAudit — Costing feature: Result panel
 *
 * Renders the engine result as-is. No re-computation, no total summing.
 * The engine's pipeline is shown in order so a reader can see how the
 * grand total was built.
 */

import type { CostingView } from "../types";

export interface CostingResultPanelProps {
  readonly view: CostingView | null;
}

function money(value: number, currency: string): string {
  return `${value.toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })} ${currency}`;
}

export function CostingResultPanel(props: CostingResultPanelProps) {
  if (!props.view) {
    return <p>No result yet.</p>;
  }

  const { result, calculatedAt } = props.view;
  const cur = result.currency;

  return (
    <section aria-label="Costing result">
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
          <h4>Materials</h4>
          <dl>
            <dt>Material subtotal</dt>
            <dd>{money(result.materialSubtotal, cur)}</dd>

            <dt>Waste</dt>
            <dd>{money(result.wasteCost, cur)}</dd>

            <dt>Adjusted materials</dt>
            <dd>{money(result.adjustedMaterials, cur)}</dd>
          </dl>

          <h4>Overheads</h4>
          <dl>
            <dt>Installation</dt>
            <dd>{money(result.installationCost, cur)}</dd>

            <dt>Transport</dt>
            <dd>{money(result.transportCost, cur)}</dd>

            <dt>Engineering</dt>
            <dd>{money(result.engineeringCost, cur)}</dd>

            <dt>Overheads subtotal</dt>
            <dd>{money(result.overheadsSubtotal, cur)}</dd>
          </dl>

          <h4>Contingency &amp; totals</h4>
          <dl>
            <dt>Contingency</dt>
            <dd>{money(result.contingencyCost, cur)}</dd>

            <dt>Pre-discount total</dt>
            <dd>{money(result.preDiscountTotal, cur)}</dd>

            <dt>Discount</dt>
            <dd>− {money(result.discountAmount, cur)}</dd>

            <dt>Subtotal after discount</dt>
            <dd>{money(result.subtotalAfterDiscount, cur)}</dd>

            <dt>Tax</dt>
            <dd>{money(result.taxAmount, cur)}</dd>

            <dt>
              <strong>Grand total</strong>
            </dt>
            <dd>
              <strong>{money(result.grandTotal, cur)}</strong>
            </dd>
          </dl>

          <h4>Category breakdown</h4>
          <table>
            <thead>
              <tr>
                <th>Category</th>
                <th>Qty</th>
                <th>Extended cost</th>
              </tr>
            </thead>
            <tbody>
              {result.categoryBreakdown.map((c) => (
                <tr key={c.category}>
                  <td>{c.category}</td>
                  <td>{c.quantity}</td>
                  <td>{money(c.extendedCost, cur)}</td>
                </tr>
              ))}
            </tbody>
          </table>
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
