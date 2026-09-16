import { Link, useLocation } from "react-router-dom";

interface Crumb {
  readonly label: string;
  readonly to?: string;
}

/**
 * A label for a URL segment. The `/projects/:id` case has no static
 * label — the caller supplies one via the optional `projectName` prop.
 */
export interface BreadcrumbsProps {
  readonly projectName?: string;
}

const STATIC_LABELS: Record<string, string> = {
  dashboard: "Dashboard",
  projects: "Projects",
  "load-audit": "Load Audit",
  "energy-analysis": "Energy Analysis",
  "solar-sizing": "Solar Sizing",
  "battery-sizing": "Battery Sizing",
  "inverter-sizing": "Inverter Sizing",
  "charge-controller-sizing": "Charge Controller",
  "cable-sizing": "Cable Sizing",
  "voltage-drop": "Voltage Drop",
  "protection-sizing": "Protection",
  costing: "Costing",
  reports: "Reports",
  settings: "Settings",
};

function toTitleCase(segment: string): string {
  return segment
    .replace(/-/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

export function Breadcrumbs(props: BreadcrumbsProps) {
  const { projectName } = props;
  const { pathname } = useLocation();

  const segments = pathname.split("/").filter(Boolean);

  if (segments.length === 0) return null;

  const crumbs: Crumb[] = [];
  let acc = "";

  for (let i = 0; i < segments.length; i++) {
    const seg = segments[i]!;
    acc += `/${seg}`;

    // Dynamic project id: /projects/<id>
    const isProjectId = i === 1 && segments[0] === "projects";

    let label: string;
    if (isProjectId) {
      label = projectName ?? "Project";
    } else {
      label = STATIC_LABELS[seg] ?? toTitleCase(seg);
    }

    const isLast = i === segments.length - 1;
    crumbs.push(isLast ? { label } : { label, to: acc });
  }

  return (
    <nav className="breadcrumbs" aria-label="Breadcrumb">
      <ol>
        {crumbs.map((c, i) => (
          <li key={i}>
            {c.to ? <Link to={c.to}>{c.label}</Link> : <span>{c.label}</span>}
          </li>
        ))}
      </ol>
    </nav>
  );
}
