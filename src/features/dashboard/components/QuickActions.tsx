/**
 * SolarAudit — Dashboard feature: Quick actions
 *
 * A short list of links into the workflow. Presentational — the
 * dashboard does not embed other features, it links to their routes.
 */

import { Link } from "react-router-dom";

export function QuickActions() {
  return (
    <nav className="quick-actions" aria-label="Quick actions">
      <Link to="/projects">New project</Link>
      <Link to="/load-audit">Load audit</Link>
      <Link to="/solar-sizing">Solar sizing</Link>
      <Link to="/battery-sizing">Battery sizing</Link>
      <Link to="/inverter-sizing">Inverter sizing</Link>
      <Link to="/reports">Reports</Link>
    </nav>
  );
}
