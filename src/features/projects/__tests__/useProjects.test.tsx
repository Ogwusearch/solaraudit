import { describe, it, expect } from "vitest";
import { act, renderHook, waitFor } from "@testing-library/react";
import { useProjects } from "../hooks/useProjects";
import { createProjectsService } from "../services/projectsService";
import { createInMemoryProjectRepository } from "../services/inMemoryProjectRepository";
import type { ProjectDraft } from "../types";

function makeService() {
  return createProjectsService(createInMemoryProjectRepository());
}

const draft: ProjectDraft = {
  name: "Home 5 kWp",
  clientName: "Mr. A",
  siteAddress: "12 Bourdillon Rd",
  auditorName: "Auditor",
  notes: "Off-grid.",
};

describe("useProjects", () => {
  it("loads an empty list on mount", async () => {
    const { result } = renderHook(() => useProjects(makeService()));
    await waitFor(() => expect(result.current.status).toBe("loaded"));
    expect(result.current.projects).toEqual([]);
  });

  it("creates a project and refreshes the list", async () => {
    const { result } = renderHook(() => useProjects(makeService()));
    await waitFor(() => expect(result.current.status).toBe("loaded"));

    let createdId: string | null = null;
    await act(async () => {
      const created = await result.current.createProject(draft);
      createdId = created?.id ?? null;
    });

    expect(createdId).toBeTruthy();
    expect(result.current.projects.length).toBe(1);
    expect(result.current.projects[0]!.name).toBe("Home 5 kWp");
  });

  it("refuses to create an invalid project", async () => {
    const { result } = renderHook(() => useProjects(makeService()));
    await waitFor(() => expect(result.current.status).toBe("loaded"));

    let created: unknown = "not-set";
    await act(async () => {
      created = await result.current.createProject({ ...draft, name: "" });
    });
    expect(created).toBeNull();
    expect(result.current.projects.length).toBe(0);
  });

  it("deletes a project and refreshes the list", async () => {
    const { result } = renderHook(() => useProjects(makeService()));
    await waitFor(() => expect(result.current.status).toBe("loaded"));

    let id = "";
    await act(async () => {
      const created = await result.current.createProject(draft);
      id = created!.id;
    });
    expect(result.current.projects.length).toBe(1);

    await act(async () => {
      await result.current.deleteProject(id);
    });
    expect(result.current.projects.length).toBe(0);
  });

  it("returns false when deleting a missing project", async () => {
    const { result } = renderHook(() => useProjects(makeService()));
    await waitFor(() => expect(result.current.status).toBe("loaded"));

    let ok: boolean | null = null;
    await act(async () => {
      ok = await result.current.deleteProject("missing");
    });
    expect(ok).toBe(false);
  });

  it("exposes validate and newDraft helpers", () => {
    const { result } = renderHook(() => useProjects(makeService()));
    expect(result.current.validate({ ...draft, name: "" })["name"])
      .toBeDefined();
    expect(result.current.newDraft().name).toBe("");
  });
});
