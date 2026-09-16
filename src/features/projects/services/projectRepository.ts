/**
 * SolarAudit — Projects feature: Repository interface
 *
 * The seam between the Projects feature and whatever storage backs it.
 * Today: in-memory. Tomorrow: D1, SQLite, HTTP, whatever.
 *
 * The feature NEVER imports a database client directly. Everything that
 * wants to persist a project goes through this interface.
 */

import type { Project } from "../types";

export interface ProjectRepository {
  list(): Promise<readonly Project[]>;
  get(id: string): Promise<Project | null>;
  create(input: Omit<Project, "id" | "createdAt" | "updatedAt">): Promise<Project>;
  update(
    id: string,
    patch: Partial<Omit<Project, "id" | "createdAt">>,
  ): Promise<Project | null>;
  remove(id: string): Promise<boolean>;
}
