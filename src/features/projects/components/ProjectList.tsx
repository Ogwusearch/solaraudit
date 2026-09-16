/**
 * SolarAudit — Projects feature: Project list
 *
 * Presentational. No repository access, no engineering logic.
 */

import { Link } from "react-router-dom";
import type { ProjectSummary } from "../types";

export interface ProjectListProps {
  readonly projects: readonly ProjectSummary[];
  readonly onDelete: (id: string) => void;
}

export function ProjectList(props: ProjectListProps) {
  const { projects, onDelete } = props;

  if (projects.length === 0) {
    return <p>No projects yet. Create one to get started.</p>;
  }

  return (
    <table>
      <thead>
        <tr>
          <th>Name</th>
          <th>Client</th>
          <th>Site</th>
          <th>Updated</th>
          <th aria-label="Actions" />
        </tr>
      </thead>
      <tbody>
        {projects.map((p) => (
          <tr key={p.id}>
            <td>
              <Link to={`/projects/${p.id}`}>{p.name}</Link>
            </td>
            <td>{p.clientName ?? "—"}</td>
            <td>{p.siteAddress ?? "—"}</td>
            <td>{new Date(p.updatedAt).toLocaleDateString()}</td>
            <td>
              <button
                type="button"
                onClick={() => onDelete(p.id)}
                aria-label={`Delete ${p.name}`}
              >
                Delete
              </button>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
