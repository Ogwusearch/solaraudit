/**
 * SolarAudit — BOM Engine: Types
 *
 * Pure data definitions. No logic, no imports from siblings.
 *
 * The BOM Engine converts engineering selections into a structured,
 * categorical material list. Quantities are derived from the sizing
 * outputs; costs and prices are NOT part of this engine (see Costing).
 */

export type BomCategory =
  | "pv-modules"
  | "pv-mounting"
  | "pv-connectors"
  | "pv-cables"
  | "batteries"
  | "battery-cables"
  | "battery-rack"
  | "inverter"
  | "charge-controller"
  | "dc-breakers"
  | "dc-isolators"
  | "dc-fuses"
  | "ac-breakers"
  | "spd"
  | "earthing"
  | "enclosures"
  | "monitoring"
  | "labour"
  | "consumables";

export interface BomLineItem {
  readonly category: BomCategory;
  readonly description: string;
  readonly specification: string;      // free-form engineering spec
  readonly quantity: number;           // >= 0
  readonly unit: string;               // "pcs", "m", "set", "kg", ...
  readonly notes?: string;             // engineering notes
}

// ------------------------- Sizing snapshots --------------------------

export interface PvSnapshot {
  readonly arrayKwp: number;
  readonly panelRatedWatts: number;
  readonly seriesPanels: number;
  readonly parallelStrings: number;
  readonly totalPanels: number;
  readonly arrayVoc: number;
  readonly arrayIsc: number;
  readonly arrayImp: number;
}

export interface BatterySnapshot {
  readonly technology: string;          // e.g. "lifepo4"
  readonly cellVoltage: number;
  readonly cellCapacityAh: number;
  readonly seriesCells: number;
  readonly parallelStrings: number;
  readonly totalCells: number;
  readonly bankVoltage: number;
  readonly bankCapacityAh: number;
}

export interface InverterSnapshot {
  readonly recommendedVa: number;
  readonly systemVoltage: number;
  readonly outputVoltage: number;
  readonly outputFrequency: number;
}

export interface ChargeControllerSnapshot {
  readonly technology: "mppt" | "pwm";
  readonly recommendedCurrentA: number;
  readonly maxPvInputVoltage?: number;
}

export interface CableSnapshot {
  readonly role: string;              // "battery", "pv-string", "inverter-dc", ...
  readonly selectedAreaMm2: number;
  readonly lengthM: number;
  readonly conductorMaterial: "copper" | "aluminium";
}

export interface ProtectionSnapshot {
  readonly role: string;
  readonly technology: string;        // "fuse", "mcb", "dc-breaker", ...
  readonly selectedRatingA: number;
  readonly minimumVoltageRatingV: number;
  readonly quantity?: number;         // default 1
}

export interface BomInput {
  readonly projectName: string;
  readonly pv?: PvSnapshot;
  readonly battery?: BatterySnapshot;
  readonly inverter?: InverterSnapshot;
  readonly chargeController?: ChargeControllerSnapshot;
  readonly cables?: readonly CableSnapshot[];
  readonly protections?: readonly ProtectionSnapshot[];

  // Preferences / site assumptions
  readonly mountingType?: "roof-pitched" | "roof-flat" | "ground" | "carport";
  readonly includeMonitoring?: boolean;   // default false
  readonly includeSpd?: boolean;          // default true
  readonly includeEarthing?: boolean;     // default true
  readonly reservePercent?: number;       // 0..1 spare parts margin, default 0.05
}

export interface BomResult {
  readonly projectName: string;
  readonly items: readonly BomLineItem[];
  readonly itemCount: number;             // total distinct line items
  readonly totalQuantity: number;         // sum of all quantities
  readonly categories: readonly BomCategory[];
  readonly warnings: readonly string[];
  readonly errors: readonly string[];
  readonly isValid: boolean;
}
