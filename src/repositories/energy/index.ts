/**
 * SolarAudit — Energy Repository: Public surface
 *
 * Consumers import the interface and (for the in-memory stub) the
 * factory. Nothing else in this folder is public.
 */

export type { EnergyRepository } from "./energyRepository";
export { createInMemoryEnergyRepository } from "./inMemoryEnergyRepository";

export type {
  CreateEnergyRecordInput,
  EnergyListFilter,
  EnergyRecord,
  EnergyRecordStatus,
  UpdateEnergyRecordPatch,
} from "./types";
