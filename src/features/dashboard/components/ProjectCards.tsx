/**
 * SolarAudit — Dashboard feature: Project cards
 *
 * Presentational. Each card links into the project detail page.
 * Metrics that are not available render as "—".
 */

import { Link } from "react-router-dom";
import type { ProjectCard } from "../types";

export interface ProjectCardsProps {
  readonly projects: readonly ProjectCard[];
}

function metric(value: number | undefined, unit: string): string {
  if (value === undefined) return "—";
  return `${value.toLocaleString(undefined, {
    maximumFractionDigits: 2,
  })} ${unit}`;
}

export function ProjectCards(props: ProjectCardsProps) {
  const { projects } = props;

  if (projects.length === 0) {
    return (
      <p>
        No projects yet. <Link to="/projects">Create one</Link>.
      </p>
    );
  }

  return (
    <div className="project-cards">
      {projects.map((p) => (
        <article key={p.id} className="project-card">
          <header>
            <h3>
              <Link to={`/projects/${p.id}`}>{p.name}</Link>
            </h3>
            {p.clientName && <p className="muted">{p.clientName}</p>}
            {p.siteAddress && <p className="muted">{p.siteAddress}</p>}
          </header>

          <dl>
            <dt>Daily energy</dt>
            <dd>{metric(p.metrics?.dailyEnergyKwh, "kWh")}</dd>

            <dt>Installed PV</dt>
            <dd>{metric(p.metrics?.installedKwp, "kWp")}</dd>

            <dt>Installed storage</dt>
            <dd>{metric(p.metrics?.installedKwh, "kWh")}</dd>
          </dl>

          <footer>
            <small>
              Updated {new Date(p.updatedAt).toLocaleDateString()}
            </small>
            {p.metrics?.validationStatus === "invalid" && (
              <strong role="alert"> validation: invalid</strong>
            )}
            {p.metrics?.validationStatus === "warning" && (
              <strong> validation: warning</strong>
            )}
          </footer>
        </article>
      ))}
    </div>
  );
}
