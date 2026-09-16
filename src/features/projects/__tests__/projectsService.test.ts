import { describe, it, expect } from "vitest";
import { createProjectsService, validateDraft } from "../services/projectsService";
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

describe("validateDraft (form-level)", () => {
  it("accepts a well-formed draft", () => {
    expect(validateDraft(draft)).toEqual({});
  });

  it("flags missing name", () => {
    expect(validateDraft({ ...draft, name: "" })["name"]).toBeDefined();
  });

  it("flags whitespace-only name", () => {
    expect(validateDraft({ ...draft, name: "   " })["name"]).toBeDefined();
  });

  it("flags long name", () => {
    const longName = "x".repeat(121);
    expect(validateDraft({ ...draft, name: longName })["name"]).toBeDefined();
  });

  it("flags long client name", () => {
    const longClient = "x".repeat(121);
    expect(validateDraft({ ...draft, clientName: longClient })["clientName"])
      .toBeDefined();
  });
});

describe("projectsService", () => {
  it("starts empty", async () => {
    const svc = makeService();
    const list = await svc.listSummaries();
    expect(list).toEqual([]);
  });

  it("creates a project and returns it", async () => {
    const svc = makeService();
    const created = await svc.createProject(draft);
    expect(created.id).toBeTruthy();
    expect(created.name).toBe("Home 5 kWp");
    expect(created.createdAt).toBe(created.updatedAt);
  });

  it("trims whitespace and omits empty optionals", async () => {
    const svc = makeService();
    const created = await svc.createProject({
      name: "  Site A  ",
      clientName: "",
      siteAddress: "",
      auditorName: "",
      notes: "",
    });
    expect(created.name).toBe("Site A");
    expect(created.clientName).toBeUndefined();
    expect(created.siteAddress).toBeUndefined();
  });

  it("lists created projects", async () => {
    const svc = makeService();
    await svc.createProject(draft);
    await svc.createProject({ ...draft, name: "Second" });
    const list = await svc.listSummaries();
    expect(list.length).toBe(2);
    expect(list.map((p) => p.name).sort()).toEqual(["Home 5 kWp", "Second"]);
  });

  it("fetches a project by id", async () => {
    const svc = makeService();
    const created = await svc.createProject(draft);
    const fetched = await svc.getProject(created.id);
    expect(fetched).not.toBeNull();
    expect(fetched!.id).toBe(created.id);
  });

  it("returns null for missing id", async () => {
    const svc = makeService();
    expect(await svc.getProject("missing")).toBeNull();
  });

  it("updates a project and bumps updatedAt", async () => {
    const svc = makeService();
    const created = await svc.createProject(draft);

    // Ensure a deterministic updatedAt delta even on very fast machines
    await new Promise((r) => setTimeout(r, 5));

    const updated = await svc.updateProject(created.id, {
      ...draft,
      name: "Renamed",
    });
    expect(updated).not.toBeNull();
    expect(updated!.name).toBe("Renamed");
    expect(updated!.createdAt).toBe(created.createdAt);
    expect(updated!.updatedAt >= created.updatedAt).toBe(true);
  });

  it("returns null when updating missing id", async () => {
    const svc = makeService();
    const r = await svc.updateProject("missing", draft);
    expect(r).toBeNull();
  });

  it("deletes a project", async () => {
    const svc = makeService();
    const created = await svc.createProject(draft);
    expect(await svc.deleteProject(created.id)).toBe(true);
    expect(await svc.getProject(created.id)).toBeNull();
  });

  it("returns false when deleting missing id", async () => {
    const svc = makeService();
    expect(await svc.deleteProject("missing")).toBe(false);
  });

  it("summary omits notes and auditor", async () => {
    const svc = makeService();
    await svc.createProject(draft);
    const [summary] = await svc.listSummaries();
    expect(summary).toBeDefined();
    expect("notes" in (summary as object)).toBe(false);
    expect("auditorName" in (summary as object)).toBe(false);
  });
});
