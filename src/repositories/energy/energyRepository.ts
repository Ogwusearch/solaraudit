/**
 * SolarAudit — Energy Repository: Interface
 *
 * The seam between the service layer and storage. When D1/SQLite
 * lands, write a second implementation and swap it at the composition
 * root; nothing outside this folder needs to change.
 */

import type {
  CreateEnergyRecordInput,
  EnergyListFilter,
  EnergyRecord,
  UpdateEnergyRecordPatch,
} from "./types";

export interface EnergyRepository {
  /** List records, optionally filtered by project, audit, status, hasBattery, and limited. */
  list(filter?: EnergyListFilter): Promise<readonly EnergyRecord[]>;

  /** Retrieve one record by id. Returns null if not found. */
  get(id: string): Promise<EnergyRecord | null>;

  /** Create a new record. The repository assigns id and timestamps. */
  create(input: CreateEnergyRecordInput): Promise<EnergyRecord>;

  /**
   * Apply a patch. Returns the updated record, or null if the id does
   * not exist. The repository bumps updatedAt automatically.
   */
  update(
    id: string,
    patch: UpdateEnergyRecordPatch,
  ): Promise<EnergyRecord | null>;

  /** Delete a record. Returns true if a record was removed. */
  remove(id: string): Promise<boolean>;

  /**
   * Mark a record as the selected energy scenario for its project.
   *
   * Domain rule: at most one selected energy scenario per project.
   * A project may accumulate many scenarios (summer, winter, with
   * battery, without) but only one is the "current" reference that
   * downstream sizing reads from.
   *
   * Setting a new selected record implicitly archives any previously
   * selected record for the same project.
   *
   * Returns the newly selected record, or null if the id is missing.
   */
  select(id: string): Promise<EnergyRecord | null>;

  /**
   * Archive a record. Archiving is the soft-delete for the domain;
   * the record remains retrievable but is no longer offered as a
   * candidate or reference.
   */
  archive(id: string): Promise<EnergyRecord | null>;
}
