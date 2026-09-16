/**
 * SolarAudit — Dashboard feature: Page
 *
 * Composes the feature. Binds the hook to presentational components.
 */

import { useDashboard } from "../hooks/useDashboard";
import { KpiRow } from "./KpiRow";
import { ProjectCards } from "./ProjectCards";
import { QuickActions } from "./QuickActions";

export function DashboardPage() {
  const dashboard = useDashboard();

  if (dashboard.status === "loading" && !dashboard.view) {
    return (
      <main>
        <h1>Dashboard</h1>
        <p>Loading…</p>
      </main>
    );
  }

  if (dashboard.status === "error" || !dashboard.view) {
    return (
      <main>
        <h1>Dashboard</h1>
        <div role="alert">
          <p>Could not load dashboard data.</p>
          <button
            type="button"
            onClick={() => void dashboard.refresh()}
          >
            Retry
          </button>
        </div>
      </main>
    );
  }

  const { kpis, projects, loadedAt } = dashboard.view;

  return (
    <main>
      <h1>Dashboard</h1>

      <KpiRow kpis={kpis} />

      <section aria-label="Quick actions">
        <h2>Quick actions</h2>
        <QuickActions />
      </section>

      <section aria-label="Projects">
        <h2>Projects</h2>
        <ProjectCards projects={projects} />
      </section>

      <footer>
        <small>
          Loaded at {new Date(loadedAt).toLocaleString()} ·{" "}
          <button
            type="button"
            onClick={() => void dashboard.refresh()}
            disabled={dashboard.status === "loading"}
          >
            Refresh
          </button>
        </small>
      </footer>
    </main>
  );
}
