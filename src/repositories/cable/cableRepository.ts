/**
 * SolarAudit — Cable Repository: Interface
 *
 * The seam between the service layer and storage. When D1/SQLite
 * lands, write a second implementation and swap it at the composition
 * root; nothing outside this folder needs to change.
 */

import type {
  CableListFilter,
  CableRecord,
  CreateCableRecordInput,
  UpdateCableRecordPatch,
} from "./types";

export interface CableRepository {
  /** List records, optionally filtered by project, audit, role, status, and limited. */
  list(filter?: CableListFilter): Promise<readonly CableRecord[]>;

  /** Retrieve one record by id. Returns null if not found. */
  get(id: string): Promise<CableRecord | null>;

  /** Create a new record. The repository assigns id and timestamps. */
  create(input: CreateCableRecordInput): Promise<CableRecord>;

  /**
   * Apply a patch. Returns the updated record, or null if the id does
   * not exist. The repository bumps updatedAt automatically.
   */
  update(
    id: string,
    patch: UpdateCableRecordPatch,
  ): Promise<CableRecord | null>;

  /** Delete a record. Returns true if a record was removed. */
  remove(id: string): Promise<boolean>;

  /**
   * Mark a record as the selected cable for its (project, circuitRole).
   *
   * Domain rule: at most one selected record per (project, role). A
   * different role (e.g. inverter AC vs battery main) may have its own
   * selected record simultaneously — the uniqueness is per role, not
   * per project.
   *
   * Setting a new selected record implicitly archives any previously
   * selected record for the SAME project AND SAME role. Records for
   * other roles are left alone.
   *
   * Returns the newly selected record, or null if the id is missing.
   */
  select(id: string): Promise<CableRecord | null>;

  /**
   * Mark a record as installed. Installed is a terminal status that
   * signifies the cable run was physically deployed. It does not
   * archive other records — that is the caller\s decision via select().
   */
  install(id: string): Promise<CableRecord | null>;

  /**
   * Archive a record. Archiving is the soft-delete for the domain;
   * the record remains retrievable but is no longer offered as a
   * candidate.
   */
  archive(id: string): Promise<CableRecord | null>;
}
