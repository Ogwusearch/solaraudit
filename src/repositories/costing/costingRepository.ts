/**
 * SolarAudit — Costing Repository: Interface
 *
 * The seam between the service layer and storage. When D1/SQLite
 * lands, write a second implementation and swap it at the composition
 * root; nothing outside this folder needs to change.
 */

import type {
  CostingListFilter,
  CostingRecord,
  CreateCostingRecordInput,
  UpdateCostingRecordPatch,
} from "./types";

export interface CostingRepository {
  /** List records, optionally filtered by project, audit, currency, status, and limited. */
  list(filter?: CostingListFilter): Promise<readonly CostingRecord[]>;

  /** Retrieve one record by id. Returns null if not found. */
  get(id: string): Promise<CostingRecord | null>;

  /** Create a new record. The repository assigns id and timestamps. */
  create(input: CreateCostingRecordInput): Promise<CostingRecord>;

  /**
   * Apply a patch. Returns the updated record, or null if the id does
   * not exist. The repository bumps updatedAt automatically.
   */
  update(
    id: string,
    patch: UpdateCostingRecordPatch,
  ): Promise<CostingRecord | null>;

  /** Delete a record. Returns true if a record was removed. */
  remove(id: string): Promise<boolean>;

  /**
   * Mark a record as the selected costing for its project.
   *
   * Domain rule: at most one selected costing per project. A project
   * normally has one active financial plan. Setting a new selected
   * record implicitly archives any previously selected record for the
   * same project.
   *
   * Does not change "final" records — finalisation is a distinct
   * transition via finalize(). Use select() to pick a working plan;
   * use finalize() to freeze one.
   *
   * Returns the newly selected record, or null if the id is missing.
   */
  select(id: string): Promise<CostingRecord | null>;

  /**
   * Finalise a record. Finalisation is a terminal status that freezes
   * the plan — the frozen plan is what a report or an invoice refers
   * to. Finalising does not archive other records; those decisions are
   * the caller\s via select() and archive().
   *
   * A common workflow is: select() a working plan, adjust inputs,
   * then finalize() when the plan is approved.
   *
   * Returns the finalised record, or null if the id is missing.
   */
  finalize(id: string): Promise<CostingRecord | null>;

  /**
   * Archive a record. Archiving is the soft-delete for the domain;
   * the record remains retrievable but is no longer offered as a
   * candidate or plan.
   */
  archive(id: string): Promise<CostingRecord | null>;
}
