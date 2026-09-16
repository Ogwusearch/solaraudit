/**
 * SolarAudit — Report Engine: Constants
 */

// Canonical section order — the report renders in this order.
export const SECTION_ORDER: readonly string[] = [
  "cover",
  "summary",
  "load",
  "energy",
  "solar",
  "battery",
  "inverter",
  "charge-controller",
  "cable",
  "protection",
  "validation",
  "bom",
  "costing",
  "assumptions",
  "traceability",
];

export const SECTION_TITLES: Record<string, string> = {
  cover: "Cover",
  summary: "Executive Summary",
  load: "Load Audit",
  energy: "Energy Analysis",
  solar: "Solar PV Sizing",
  battery: "Battery Sizing",
  inverter: "Inverter Sizing",
  "charge-controller": "Charge Controller Sizing",
  cable: "Cable Sizing",
  protection: "Protection",
  validation: "Engineering Validation",
  bom: "Bill of Materials",
  costing: "Costing",
  assumptions: "Assumptions",
  traceability: "Traceability",
};

// Sections considered core — a missing one makes the report "partial"
export const CORE_SECTIONS: readonly string[] = [
  "load",
  "energy",
  "solar",
  "battery",
  "inverter",
];

export const REQUIRED_METADATA_FIELDS: readonly string[] = [
  "projectName",
  "reportVersion",
  "calculationVersion",
  "generatedAtIso",
];

export const ROUND_DECIMALS = 3;
