/**
 * SolarAudit — Cable Repository: Public surface
 *
 * Consumers import the interface and (for the in-memory stub) the
 * factory. Nothing else in this folder is public.
 */

export type { CableRepository } from "./cableRepository";
export { createInMemoryCableRepository } from "./inMemoryCableRepository";

export type {
  CableListFilter,
  CableRecord,
  CableRecordStatus,
  CreateCableRecordInput,
  UpdateCableRecordPatch,
} from "./types";
