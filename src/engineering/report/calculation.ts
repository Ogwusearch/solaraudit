/**
 * SolarAudit — Report Engine: Calculation
 *
 * Pure assembly. Assumes input is valid. Produces a ReportResult
 * whose sections are ordered canonically, whose status reflects which
 * upstream snapshots were present, and whose summary exposes the key
 * figures an executive reader needs.
 */

import type {
  ReportInput,
  ReportResult,
  ReportSection,
  ReportSectionKey,
  ReportEntry,
  ReportSummary,
  SectionStatus,
  TraceEntry,
} from "./types";
import {
  SECTION_ORDER,
  SECTION_TITLES,
  CORE_SECTIONS,
} from "./constants";
import {
  WARN_NO_LOAD,
  WARN_NO_ENERGY,
  WARN_NO_SOLAR,
  WARN_NO_BATTERY,
  WARN_NO_INVERTER,
  WARN_NO_CONTROLLER,
  WARN_NO_CABLES,
  WARN_NO_PROTECTION,
  WARN_NO_BOM,
  WARN_NO_COSTING,
  WARN_NO_VALIDATION,
  WARN_NO_TRACE,
  WARN_NO_ASSUMPTIONS,
  WARN_VALIDATION_INVALID,
  WARN_VALIDATION_WARNING,
  WARN_MISSING_CORE_SECTIONS,
} from "./errors";

// ---------------------------------------------------------------------
// Section builders
// ---------------------------------------------------------------------

function buildCoverSection(input: ReportInput): ReportSection {
  const m = input.metadata;
  const body: ReportEntry[] = [
    { label: "Project", value: m.projectName },
    { label: "Report Version", value: m.reportVersion },
    { label: "Calculation Version", value: m.calculationVersion },
    { label: "Generated At", value: m.generatedAtIso },
  ];
  if (m.clientName) body.push({ label: "Client", value: m.clientName });
  if (m.siteAddress) body.push({ label: "Site", value: m.siteAddress });
  if (m.auditorName) body.push({ label: "Auditor", value: m.auditorName });
  if (m.currency) body.push({ label: "Currency", value: m.currency });

  return {
    key: "cover",
    title: SECTION_TITLES.cover,
    order: SECTION_ORDER.indexOf("cover"),
    status: "complete",
    body,
  };
}

function buildSummarySection(
  _input: ReportInput,
  summary: ReportSummary,
): ReportSection {
  const body: ReportEntry[] = [];
  if (summary.dailyEnergyKwh !== undefined) {
    body.push({
      label: "Daily Energy",
      value: summary.dailyEnergyKwh,
      unit: "kWh",
    });
  }
  if (summary.arrayKwp !== undefined) {
    body.push({ label: "PV Array", value: summary.arrayKwp, unit: "kWp" });
  }
  if (summary.batteryInstalledKwh !== undefined) {
    body.push({
      label: "Battery Installed",
      value: summary.batteryInstalledKwh,
      unit: "kWh",
    });
  }
  if (summary.inverterVa !== undefined) {
    body.push({ label: "Inverter", value: summary.inverterVa, unit: "VA" });
  }
  if (summary.grandTotal !== undefined) {
    body.push({
      label: "Project Total",
      value: summary.grandTotal,
      unit: summary.currency ?? "",
    });
  }

  const status: SectionStatus = body.length > 0 ? "complete" : "missing";

  return {
    key: "summary",
    title: SECTION_TITLES.summary,
    order: SECTION_ORDER.indexOf("summary"),
    status,
    body,
  };
}

function buildLoadSection(input: ReportInput): ReportSection {
  const l = input.load;
  if (!l) {
    return {
      key: "load",
      title: SECTION_TITLES.load,
      order: SECTION_ORDER.indexOf("load"),
      status: "missing",
      body: [],
    };
  }
  return {
    key: "load",
    title: SECTION_TITLES.load,
    order: SECTION_ORDER.indexOf("load"),
    status: "complete",
    body: [
      { label: "Total Connected Load", value: l.totalConnectedKw, unit: "kW" },
      { label: "Peak Demand", value: l.peakDemandKw, unit: "kW" },
      { label: "Daily Energy", value: l.dailyEnergyKwh, unit: "kWh" },
      { label: "Essential Energy", value: l.essentialEnergyKwh, unit: "kWh" },
    ],
  };
}

function buildEnergySection(input: ReportInput): ReportSection {
  const e = input.energy;
  if (!e) {
    return {
      key: "energy",
      title: SECTION_TITLES.energy,
      order: SECTION_ORDER.indexOf("energy"),
      status: "missing",
      body: [],
    };
  }
  return {
    key: "energy",
    title: SECTION_TITLES.energy,
    order: SECTION_ORDER.indexOf("energy"),
    status: "complete",
    body: [
      { label: "PV Generation", value: e.pvGenerationKwh, unit: "kWh" },
      { label: "Self-Consumed", value: e.selfConsumedKwh, unit: "kWh" },
      { label: "Grid Import", value: e.gridImportKwh, unit: "kWh" },
      { label: "Grid Export", value: e.gridExportKwh, unit: "kWh" },
      {
        label: "Self-Consumption Rate",
        value: e.selfConsumptionRate,
      },
      { label: "Self-Sufficiency Rate", value: e.selfSufficiencyRate },
    ],
  };
}

function buildSolarSection(input: ReportInput): ReportSection {
  const s = input.solar;
  if (!s) {
    return {
      key: "solar",
      title: SECTION_TITLES.solar,
      order: SECTION_ORDER.indexOf("solar"),
      status: "missing",
      body: [],
    };
  }
  return {
    key: "solar",
    title: SECTION_TITLES.solar,
    order: SECTION_ORDER.indexOf("solar"),
    status: "complete",
    body: [
      { label: "Design Array", value: s.designArrayKwp, unit: "kWp" },
      { label: "Total Panels", value: s.totalPanels, unit: "pcs" },
      { label: "Series Panels", value: s.seriesPanels },
      { label: "Parallel Strings", value: s.parallelStrings },
      { label: "Array Voc", value: s.arrayVoc, unit: "V" },
    ],
  };
}

function buildBatterySection(input: ReportInput): ReportSection {
  const b = input.battery;
  if (!b) {
    return {
      key: "battery",
      title: SECTION_TITLES.battery,
      order: SECTION_ORDER.indexOf("battery"),
      status: "missing",
      body: [],
    };
  }
  return {
    key: "battery",
    title: SECTION_TITLES.battery,
    order: SECTION_ORDER.indexOf("battery"),
    status: "complete",
    body: [
      { label: "Bank Voltage", value: b.bankVoltage, unit: "V" },
      { label: "Bank Capacity", value: b.bankCapacityAh, unit: "Ah" },
      { label: "Installed Energy", value: b.installedKwh, unit: "kWh" },
      { label: "Total Cells", value: b.totalCells, unit: "pcs" },
      { label: "Series Cells", value: b.seriesCells },
      { label: "Parallel Strings", value: b.parallelStrings },
    ],
  };
}

function buildInverterSection(input: ReportInput): ReportSection {
  const inv = input.inverter;
  if (!inv) {
    return {
      key: "inverter",
      title: SECTION_TITLES.inverter,
      order: SECTION_ORDER.indexOf("inverter"),
      status: "missing",
      body: [],
    };
  }
  return {
    key: "inverter",
    title: SECTION_TITLES.inverter,
    order: SECTION_ORDER.indexOf("inverter"),
    status: "complete",
    body: [
      { label: "Recommended Rating", value: inv.recommendedVa, unit: "VA" },
      { label: "DC Input Current", value: inv.dcInputCurrentA, unit: "A" },
      { label: "Output Voltage", value: inv.outputVoltage, unit: "V" },
      { label: "Output Frequency", value: inv.outputFrequency, unit: "Hz" },
    ],
  };
}

function buildControllerSection(input: ReportInput): ReportSection {
  const c = input.chargeController;
  if (!c) {
    return {
      key: "charge-controller",
      title: SECTION_TITLES["charge-controller"],
      order: SECTION_ORDER.indexOf("charge-controller"),
      status: "missing",
      body: [],
    };
  }
  const body: ReportEntry[] = [
    { label: "Technology", value: c.technology.toUpperCase() },
    { label: "Recommended Current", value: c.recommendedCurrentA, unit: "A" },
  ];
  if (c.maxPvInputVoltage !== undefined) {
    body.push({
      label: "Max PV Input Voltage",
      value: c.maxPvInputVoltage,
      unit: "V",
    });
  }
  return {
    key: "charge-controller",
    title: SECTION_TITLES["charge-controller"],
    order: SECTION_ORDER.indexOf("charge-controller"),
    status: "complete",
    body,
  };
}

function buildCableSection(input: ReportInput): ReportSection {
  const cables = input.cables;
  if (!cables || cables.length === 0) {
    return {
      key: "cable",
      title: SECTION_TITLES.cable,
      order: SECTION_ORDER.indexOf("cable"),
      status: "missing",
      body: [],
    };
  }
  const body: ReportEntry[] = [];
  for (const c of cables) {
    body.push({
      label: `${c.role} — Area`,
      value: c.selectedAreaMm2,
      unit: "mm²",
    });
    body.push({
      label: `${c.role} — Length`,
      value: c.lengthM,
      unit: "m",
    });
    body.push({
      label: `${c.role} — Voltage Drop`,
      value: c.actualDropPercent,
      unit: "%",
    });
  }
  return {
    key: "cable",
    title: SECTION_TITLES.cable,
    order: SECTION_ORDER.indexOf("cable"),
    status: "complete",
    body,
  };
}

function buildProtectionSection(input: ReportInput): ReportSection {
  const prot = input.protections;
  if (!prot || prot.length === 0) {
    return {
      key: "protection",
      title: SECTION_TITLES.protection,
      order: SECTION_ORDER.indexOf("protection"),
      status: "missing",
      body: [],
    };
  }
  const body: ReportEntry[] = [];
  for (const p of prot) {
    body.push({
      label: `${p.role} — Device`,
      value: p.technology,
    });
    body.push({
      label: `${p.role} — Rating`,
      value: p.selectedRatingA,
      unit: "A",
    });
    body.push({
      label: `${p.role} — Voltage`,
      value: p.minimumVoltageRatingV,
      unit: "V",
    });
  }
  return {
    key: "protection",
    title: SECTION_TITLES.protection,
    order: SECTION_ORDER.indexOf("protection"),
    status: "complete",
    body,
  };
}

function buildValidationSection(input: ReportInput): ReportSection {
  const v = input.validation;
  if (!v) {
    return {
      key: "validation",
      title: SECTION_TITLES.validation,
      order: SECTION_ORDER.indexOf("validation"),
      status: "missing",
      body: [],
    };
  }
  return {
    key: "validation",
    title: SECTION_TITLES.validation,
    order: SECTION_ORDER.indexOf("validation"),
    status: v.overallStatus === "invalid" ? "invalid" : "complete",
    body: [
      { label: "Overall Status", value: v.overallStatus.toUpperCase() },
      { label: "Errors", value: v.errorCount },
      { label: "Warnings", value: v.warningCount },
      { label: "Info", value: v.infoCount },
    ],
  };
}

function buildBomSection(input: ReportInput): ReportSection {
  const b = input.bom;
  if (!b) {
    return {
      key: "bom",
      title: SECTION_TITLES.bom,
      order: SECTION_ORDER.indexOf("bom"),
      status: "missing",
      body: [],
    };
  }
  return {
    key: "bom",
    title: SECTION_TITLES.bom,
    order: SECTION_ORDER.indexOf("bom"),
    status: "complete",
    body: [
      { label: "Distinct Line Items", value: b.itemCount },
      { label: "Total Quantity", value: b.totalQuantity },
      { label: "Categories", value: b.categories.join(", ") },
    ],
  };
}

function buildCostingSection(input: ReportInput): ReportSection {
  const c = input.costing;
  if (!c) {
    return {
      key: "costing",
      title: SECTION_TITLES.costing,
      order: SECTION_ORDER.indexOf("costing"),
      status: "missing",
      body: [],
    };
  }
  return {
    key: "costing",
    title: SECTION_TITLES.costing,
    order: SECTION_ORDER.indexOf("costing"),
    status: "complete",
    body: [
      {
        label: "Material Subtotal",
        value: c.materialSubtotal,
        unit: c.currency,
      },
      {
        label: "Overheads",
        value: c.overheadsSubtotal,
        unit: c.currency,
      },
      { label: "Grand Total", value: c.grandTotal, unit: c.currency },
    ],
  };
}

function buildAssumptionsSection(input: ReportInput): ReportSection {
  const a = input.assumptions;
  if (!a || a.length === 0) {
    return {
      key: "assumptions",
      title: SECTION_TITLES.assumptions,
      order: SECTION_ORDER.indexOf("assumptions"),
      status: "missing",
      body: [],
    };
  }
  const body: ReportEntry[] = a.map((x) => ({
    label: x.key,
    value: x.value + (x.source ? ` (${x.source})` : ""),
  }));
  return {
    key: "assumptions",
    title: SECTION_TITLES.assumptions,
    order: SECTION_ORDER.indexOf("assumptions"),
    status: "complete",
    body,
  };
}

function buildTraceabilitySection(input: ReportInput): ReportSection {
  const t = input.trace;
  if (!t || t.length === 0) {
    return {
      key: "traceability",
      title: SECTION_TITLES.traceability,
      order: SECTION_ORDER.indexOf("traceability"),
      status: "missing",
      body: [],
    };
  }
  const body: ReportEntry[] = t.map((entry: TraceEntry) => ({
    label: entry.engine,
    value: `v${entry.version} @ ${entry.producedAtIso}`,
  }));
  return {
    key: "traceability",
    title: SECTION_TITLES.traceability,
    order: SECTION_ORDER.indexOf("traceability"),
    status: "complete",
    body,
  };
}

// ---------------------------------------------------------------------
// Summary
// ---------------------------------------------------------------------

function buildSummary(input: ReportInput): ReportSummary {
  return {
    ...(input.load ? { dailyEnergyKwh: input.load.dailyEnergyKwh } : {}),
    ...(input.solar ? { arrayKwp: input.solar.designArrayKwp } : {}),
    ...(input.battery
      ? { batteryInstalledKwh: input.battery.installedKwh }
      : {}),
    ...(input.inverter ? { inverterVa: input.inverter.recommendedVa } : {}),
    ...(input.costing
      ? {
          grandTotal: input.costing.grandTotal,
          currency: input.costing.currency,
        }
      : {}),
  };
}

// ---------------------------------------------------------------------
// Orchestration
// ---------------------------------------------------------------------

export function calculateInternal(input: ReportInput): ReportResult {
  const warnings: string[] = [];

  // Presence warnings
  if (!input.load) warnings.push(WARN_NO_LOAD);
  if (!input.energy) warnings.push(WARN_NO_ENERGY);
  if (!input.solar) warnings.push(WARN_NO_SOLAR);
  if (!input.battery) warnings.push(WARN_NO_BATTERY);
  if (!input.inverter) warnings.push(WARN_NO_INVERTER);
  if (!input.chargeController) warnings.push(WARN_NO_CONTROLLER);
  if (!input.cables || input.cables.length === 0) warnings.push(WARN_NO_CABLES);
  if (!input.protections || input.protections.length === 0) {
    warnings.push(WARN_NO_PROTECTION);
  }
  if (!input.bom) warnings.push(WARN_NO_BOM);
  if (!input.costing) warnings.push(WARN_NO_COSTING);
  if (!input.validation) warnings.push(WARN_NO_VALIDATION);
  if (!input.trace || input.trace.length === 0) warnings.push(WARN_NO_TRACE);
  if (!input.assumptions || input.assumptions.length === 0) {
    warnings.push(WARN_NO_ASSUMPTIONS);
  }

  // Validation status hints
  if (input.validation) {
    if (input.validation.overallStatus === "invalid") {
      warnings.push(WARN_VALIDATION_INVALID);
    } else if (input.validation.overallStatus === "warning") {
      warnings.push(WARN_VALIDATION_WARNING);
    }
  }

  // Summary
  const summary = buildSummary(input);

  // Sections — assemble in canonical order
  const sections: ReportSection[] = [
    buildCoverSection(input),
    buildSummarySection(input, summary),
    buildLoadSection(input),
    buildEnergySection(input),
    buildSolarSection(input),
    buildBatterySection(input),
    buildInverterSection(input),
    buildControllerSection(input),
    buildCableSection(input),
    buildProtectionSection(input),
    buildValidationSection(input),
    buildBomSection(input),
    buildCostingSection(input),
    buildAssumptionsSection(input),
    buildTraceabilitySection(input),
  ].sort((a, b) => a.order - b.order);

  // Missing core sections
  const missingCoreCount = CORE_SECTIONS.filter((key) => {
    const s = sections.find((x) => x.key === (key as ReportSectionKey));
    return !s || s.status === "missing";
  }).length;

  if (missingCoreCount > 0) {
    warnings.push(WARN_MISSING_CORE_SECTIONS(missingCoreCount));
  }

  // Overall status
  let overallStatus: ReportResult["overallStatus"];
  if (input.validation?.overallStatus === "invalid") {
    overallStatus = "invalid";
  } else if (missingCoreCount > 0) {
    overallStatus = "partial";
  } else {
    overallStatus = "complete";
  }

  return {
    title: `SolarAudit Report — ${input.metadata.projectName}`,
    metadata: input.metadata,
    summary,
    sections,
    sectionCount: sections.length,
    overallStatus,
    warnings,
    errors: [],
    isValid: true,
  };
}
