/**
 * SolarAudit — Projects feature: Project detail page
 *
 * Loads a single project and offers the workflow actions. The workflow
 * actions (Load Audit, Solar Sizing, ...) are links into the other
 * features — this page composes URLs, it does not compose engineering.
 */

import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { defaultProjectsService } from "../services/defaultProjectsService";
import type { Project } from "../types";

export function ProjectDetailPage() {
  const { projectId } = useParams<{ projectId: string }>();
  const [project, setProject] = useState<Project | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    if (!projectId) return;
    void (async () => {
      const p = await defaultProjectsService.getProject(projectId);
      if (!cancelled) {
        setProject(p);
        setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [projectId]);

  if (loading) return <p>Loading…</p>;
  if (!project) {
    return (
      <section>
        <h2>Project not found</h2>
        <Link to="/projects">Back to projects</Link>
      </section>
    );
  }

  return (
    <main>
      <h1>{project.name}</h1>

      <dl>
        {project.clientName && (
          <>
            <dt>Client</dt>
            <dd>{project.clientName}</dd>
          </>
        )}
        {project.siteAddress && (
          <>
            <dt>Site</dt>
            <dd>{project.siteAddress}</dd>
          </>
        )}
        {project.auditorName && (
          <>
            <dt>Auditor</dt>
            <dd>{project.auditorName}</dd>
          </>
        )}
        <dt>Created</dt>
        <dd>{new Date(project.createdAt).toLocaleString()}</dd>
        <dt>Updated</dt>
        <dd>{new Date(project.updatedAt).toLocaleString()}</dd>
      </dl>

      {project.notes && (
        <>
          <h2>Notes</h2>
          <p>{project.notes}</p>
        </>
      )}

      <h2>Workflow</h2>
      <nav>
        <Link to="/load-audit">Load Audit</Link>{" "}
        <Link to="/energy-analysis">Energy Analysis</Link>{" "}
        <Link to="/solar-sizing">Solar Sizing</Link>{" "}
        <Link to="/battery-sizing">Battery Sizing</Link>{" "}
        <Link to="/inverter-sizing">Inverter Sizing</Link>{" "}
        <Link to="/charge-controller-sizing">Charge Controller</Link>{" "}
        <Link to="/cable-sizing">Cable Sizing</Link>{" "}
        <Link to="/costing">Costing</Link>
      </nav>

      <p>
        <Link to="/projects">Back to projects</Link>
      </p>
    </main>
  );
}
