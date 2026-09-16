/**
 * SolarAudit — Reports feature: Result panel
 *
 * Renders the engine's sections as-is, in canonical order. No
 * re-computation, no reformatting beyond what is needed for display.
 */

import type { ReportsView } from "../types";
import type {
  ReportEntry,
  ReportSection,
} from "../../../engineering/report";

export interface ReportsResultPanelProps {
  readonly view: ReportsView | null;
}

function EntryValue(entry: ReportEntry) {
  const { value, unit } = entry;
  if (typeof value === "boolean") return <>{value ? "yes" : "no"}</>;
  if (unit) return <>{value} {unit}</>;
  return <>{value}</>;
}

function Section({ section }: { section: ReportSection }) {
  return (
    <section aria-label={section.title}>
      <h3>
        {section.title}{" "}
        <small>
          <em>{section.status}</em>
        </small>
      </h3>

      {section.status === "missing" ? (
        <p>
          <em>No data provided for this section.</em>
        </p>
      ) : (
        <dl>
          {section.body.map((entry, i) => (
            <div key={i}>
              <dt>{entry.label}</dt>
              <dd>
                <EntryValue {...entry} />
              </dd>
            </div>
          ))}
        </dl>
      )}
    </section>
  );
}

export function ReportsResultPanel(props: ReportsResultPanelProps) {
  if (!props.view) {
    return <p>No report generated yet.</p>;
  }

  const { result, generatedAt } = props.view;

  return (
    <article aria-label="Generated report">
      <header>
        <h2>{result.title}</h2>
        <p>
          <small>
            Status: <strong>{result.overallStatus}</strong> ·{" "}
            {result.sectionCount} sections · generated at{" "}
            {new Date(generatedAt).toLocaleString()}
          </small>
        </p>
      </header>

      {result.errors.length > 0 && (
        <div role="alert">
          <strong>Structural errors:</strong>
          <ul>
            {result.errors.map((e, i) => (
              <li key={i}>{e}</li>
            ))}
          </ul>
        </div>
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

      {result.sections.map((section) => (
        <Section key={section.key} section={section} />
      ))}
    </article>
  );
}
