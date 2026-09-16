/**
 * SolarAudit — Audit Repository: Types
 */

import type { LoadResult } from "../../engineering/load";
import type { EnergyResult } from "../../engineering/energy";
import type { SolarResult } from "../../engineering/solar";
import type { BatteryResult } from "../../engineering/battery";
import type { InverterResult } from "../../engineering/inverter";
import type { ChargeControllerResult } from "../../engineering/charge-controller";
import type { CableResult } from "../../engineering/cable";
import type { VoltageDropResult } from "../../engineering/voltage-drop";
import type { ProtectionResult } from "../../engineering/protection";
import type { CostingResult } from "../../engineering/costing";
import type { ValidationResult } from "../../engineering/validation";

export type AuditStatus = "draft" | "completed" | "invalid" | "superseded";

export interface AuditAssumption {
  readonly key: string;
  readonly value: string;
  readonly source?: string;
}

export interface AuditResults {
  readonly load?: LoadResult;
  readonly energy?: EnergyResult;
  readonly solar?: SolarResult;
  readonly battery?: BatteryResult;
  readonly inverter?: InverterResult;
  readonly chargeController?: ChargeControllerResult;
  readonly cable?: CableResult;
  readonly voltageDrop?: VoltageDropResult;
  readonly protection?: ProtectionResult;
  readonly costing?: CostingResult;
  readonly validation?: ValidationResult;
}

export interface Audit {
  readonly id: string;
  readonly projectId: string;
  readonly name: string;
  readonly status: AuditStatus;
  readonly calculationVersion: string;
  readonly inputs: Readonly<Record<string, unknown>>;
  readonly assumptions: readonly AuditAssumption[];
  readonly results: AuditResults;
  readonly warnings: readonly string[];
  readonly errors: readonly string[];
  readonly createdAt: string;
  readonly updatedAt: string;
  readonly parentAuditId?: string;
  readonly supersededBy?: string;
  readonly reportId?: string;
}

export type CreateAuditInput = Omit<Audit, "id" | "createdAt" | "updatedAt"> & {
  readonly status?: AuditStatus;
};

export type UpdateAuditPatch = Partial<
  Omit<Audit, "id" | "createdAt" | "updatedAt">
>;

export interface AuditListFilter {
  readonly projectId?: string;
  readonly status?: AuditStatus;
  readonly limit?: number;
}
