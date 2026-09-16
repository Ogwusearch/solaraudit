/**
 * SolarAudit — Charge Controller Repository: Interface
 *
 * The seam between the service layer and storage. When D1/SQLite
 * lands, write a second implementation and swap it at the composition
 * root; nothing outside this folder needs to change.
 */

import type {
  ChargeControllerListFilter,
  ChargeControllerRecord,
  CreateChargeControllerRecordInput,
  UpdateChargeControllerRecordPatch,
} from "./types";

export interface ChargeControllerRepository {
  /** List records, optionally filtered by project, audit, technology, status, and limited. */
  list(
    filter?: ChargeControllerListFilter,
  ): Promise<readonly ChargeControllerRecord[]>;

  /** Retrieve one record by id. Returns null if not found. */
  get(id: string): Promise<ChargeControllerRecord | null>;

  /** Create a new record. The repository assigns id and timestamps. */
  create(
    input: CreateChargeControllerRecordInput,
  ): Promise<ChargeControllerRecord>;

  /**
   * Apply a patch. Returns the updated record, or null if the id does
   * not exist. The repository bumps updatedAt automatically.
   */
  update(
    id: string,
    patch: UpdateChargeControllerRecordPatch,
  ): Promise<ChargeControllerRecord | null>;

  /** Delete a record. Returns true if a record was removed. */
  remove(id: string): Promise<boolean>;

  /**
   * Mark a record as the selected charge controller for its project.
   *
   * Domain rule: at most one selected charge controller per project.
   * A project normally has exactly one charge controller, so setting
   * a new selected record implicitly archives any previously selected
   * record for the same project.
   *
   * Returns the newly selected record, or null if the id is missing.
   */
  select(id: string): Promise<ChargeControllerRecord | null>;

  /**
   * Mark a record as installed. Installed is a terminal status that
   * signifies the controller was physically deployed. It does not
   * archive other records — that is the caller\s decision via select().
   */
  install(id: string): Promise<ChargeControllerRecord | null>;

  /**
   * Archive a record. Archiving is the soft-delete for the domain;
   * the record remains retrievable but is no longer offered as a
   * candidate.
   */
  archive(id: string): Promise<ChargeControllerRecord | null>;
}
