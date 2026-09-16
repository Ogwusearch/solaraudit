/**
 * SolarAudit — Battery Repository: Interface
 *
 * The seam between the service layer and storage. When D1/SQLite
 * lands, write a second implementation and swap it at the composition
 * root; nothing outside this folder needs to change.
 */

import type {
  BatteryListFilter,
  BatteryRecord,
  CreateBatteryRecordInput,
  UpdateBatteryRecordPatch,
} from "./types";

export interface BatteryRepository {
  /** List records, optionally filtered by project, audit, status, and limited. */
  list(filter?: BatteryListFilter): Promise<readonly BatteryRecord[]>;

  /** Retrieve one record by id. Returns null if not found. */
  get(id: string): Promise<BatteryRecord | null>;

  /** Create a new record. The repository assigns id and timestamps. */
  create(input: CreateBatteryRecordInput): Promise<BatteryRecord>;

  /**
   * Apply a patch. Returns the updated record, or null if the id does
   * not exist. The repository bumps updatedAt automatically.
   */
  update(
    id: string,
    patch: UpdateBatteryRecordPatch,
  ): Promise<BatteryRecord | null>;

  /** Delete a record. Returns true if a record was removed. */
  remove(id: string): Promise<boolean>;

  /**
   * Mark a record as the selected battery for its project.
   *
   * Domain rule: at most one record per project may have status
   * "selected". Setting a new selected record implicitly archives any
   * previously selected record for the same project. This is a single
   * operation, not two independent field writes — hence a named method
   * rather than a generic update.
   *
   * Returns the newly selected record, or null if the id is missing.
   */
  select(id: string): Promise<BatteryRecord | null>;

  /**
   * Mark a record as installed. Installed is a terminal status that
   * signifies the battery was physically deployed. It does not archive
   * other records — that is the caller\s decision via select().
   */
  install(id: string): Promise<BatteryRecord | null>;

  /**
   * Archive a record. Archiving is the soft-delete for the domain;
   * the record remains retrievable but is no longer offered as a
   * candidate.
   */
  archive(id: string): Promise<BatteryRecord | null>;
}
