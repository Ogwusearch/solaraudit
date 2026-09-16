/**
 * SolarAudit — Battery Repository: Public surface
 *
 * Consumers import the interface and (for the in-memory stub) the
 * factory. Nothing else in this folder is public.
 */

export type { BatteryRepository } from "./batteryRepository";
export { createInMemoryBatteryRepository } from "./inMemoryBatteryRepository";

export type {
  BatteryListFilter,
  BatteryRecord,
  BatteryRecordStatus,
  CreateBatteryRecordInput,
  UpdateBatteryRecordPatch,
} from "./types";
