/**
 * SolarAudit — Projects feature: Page
 *
 * Composes the feature. Binds the hook to presentational components.
 */

import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useProjects } from "../hooks/useProjects";
import { ProjectList } from "./ProjectList";
import { NewProjectForm } from "./NewProjectForm";
import { createEmptyDraft, createSampleDraft } from "../services/projectsFactory";
import type { ProjectDraft } from "../types";

export function ProjectsPage() {
  const projects = useProjects();
  const navigate = useNavigate();
  const [draft, setDraft] = useState<ProjectDraft>(() => createEmptyDraft());
  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleCreate = async (candidate: ProjectDraft) => {
    const validation = projects.validate(candidate);
    setErrors(validation);
    if (Object.keys(validation).length > 0) return;

    const created = await projects.createProject(candidate);
    if (created) {
      setDraft(createEmptyDraft());
      navigate(`/projects/${created.id}`);
    }
  };

  const handleDelete = async (id: string) => {
    // eslint-disable-next-line no-alert
    if (!window.confirm("Delete this project?")) return;
    await projects.deleteProject(id);
  };

  const busy = projects.status === "saving";

  return (
    <main>
      <h1>Projects</h1>

      <section aria-label="Project list">
        <h2>Your projects</h2>
        <ProjectList projects={projects.projects} onDelete={handleDelete} />
      </section>

      <section aria-label="New project">
        <h2>Create a project</h2>
        <NewProjectForm
          initialDraft={draft}
          errors={errors}
          disabled={busy}
          onSubmit={handleCreate}
          onLoadSample={() => setDraft(createSampleDraft())}
        />
      </section>
    </main>
  );
}
