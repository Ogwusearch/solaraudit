/**
 * SolarAudit — Validation Engine: Calculation
 *
 * Runs the cross-cutting rules against a system configuration.
 * Assumes the structural validation has passed.
 *
 * Each rule is a pure function returning a RuleResult. Rules that lack
 * input data return an "info" result stating they were skipped.
 */

import type {
  ValidationInput,
  ValidationResult,
  RuleResult,
  RuleCode,
} from "./types";
import {
  VOLTAGE_MATCH_TOLERANCE_V,
  ENERGY_SURPLUS_WARN_RATIO,
  ENERGY_DEFICIT_WARN_RATIO,
  AMPACITY_SAFETY_RATIO,
  DROP_OVERSHOOT_WARN,
  PROTECTION_CURRENT_RATIO,
  PROTECTION_VOLTAGE_RATIO,
  PROTECTION_INTERRUPT_RATIO,
  PV_POWER_C_RATE_LOW,
  PV_POWER_C_RATE_HIGH,
  ROUND_DECIMALS,
} from "./constants";
import {
  WARN_NO_PV,
  WARN_NO_BATTERY,
  WARN_NO_INVERTER,
  WARN_NO_CONTROLLER,
  WARN_NO_CABLES,
  WARN_NO_PROTECTION,
} from "./errors";

function round(value: number, decimals = ROUND_DECIMALS): number {
  const factor = 10 ** decimals;
  return Math.round(value * factor) / factor;
}

// ---------------------------------------------------------------------
// Rule implementations
// ---------------------------------------------------------------------

function ruleVoltageBatteryInverterMatch(
  input: ValidationInput,
): RuleResult {
  const { battery, inverter } = input.config;
  if (!battery || !inverter) {
    return {
      code: "VOLTAGE_BATTERY_INVERTER_MATCH",
      severity: "info",
      passed: true,
      message: "Skipped: battery and inverter both required.",
    };
  }
  const delta = Math.abs(battery.bankVoltage - inverter.systemVoltage);
  const passed = delta <= VOLTAGE_MATCH_TOLERANCE_V;
  return {
    code: "VOLTAGE_BATTERY_INVERTER_MATCH",
    severity: "error",
    passed,
    message: passed
      ? `Battery bank (${battery.bankVoltage} V) matches inverter input (${inverter.systemVoltage} V).`
      : `Battery bank (${battery.bankVoltage} V) does not match inverter input (${inverter.systemVoltage} V).`,
    details: { batteryV: battery.bankVoltage, inverterV: inverter.systemVoltage, delta },
  };
}

function ruleVoltageBatteryControllerMatch(
  input: ValidationInput,
): RuleResult {
  const { battery, chargeController } = input.config;
  if (!battery || !chargeController) {
    return {
      code: "VOLTAGE_BATTERY_CONTROLLER_MATCH",
      severity: "info",
      passed: true,
      message: "Skipped: battery and charge controller both required.",
    };
  }
  const delta = Math.abs(
    battery.bankVoltage - chargeController.batteryVoltage,
  );
  const passed = delta <= VOLTAGE_MATCH_TOLERANCE_V;
  return {
    code: "VOLTAGE_BATTERY_CONTROLLER_MATCH",
    severity: "error",
    passed,
    message: passed
      ? `Battery bank (${battery.bankVoltage} V) matches controller battery setting (${chargeController.batteryVoltage} V).`
      : `Battery bank (${battery.bankVoltage} V) does not match controller battery setting (${chargeController.batteryVoltage} V).`,
    details: { batteryV: battery.bankVoltage, controllerV: chargeController.batteryVoltage, delta },
  };
}

function rulePvVocWithinController(input: ValidationInput): RuleResult {
  const { pv, chargeController } = input.config;
  if (!pv || !chargeController || chargeController.maxPvInputVoltage === undefined) {
    return {
      code: "PV_VOC_WITHIN_CONTROLLER",
      severity: "info",
      passed: true,
      message: "Skipped: PV and controller max PV voltage both required.",
    };
  }
  const passed = pv.arrayVoc <= chargeController.maxPvInputVoltage;
  return {
    code: "PV_VOC_WITHIN_CONTROLLER",
    severity: "error",
    passed,
    message: passed
      ? `PV Voc (${pv.arrayVoc} V) is within controller limit (${chargeController.maxPvInputVoltage} V).`
      : `PV Voc (${pv.arrayVoc} V) exceeds controller limit (${chargeController.maxPvInputVoltage} V).`,
    details: { voc: pv.arrayVoc, controllerMax: chargeController.maxPvInputVoltage },
  };
}

function rulePvIscWithinController(input: ValidationInput): RuleResult {
  const { pv, chargeController } = input.config;
  if (!pv || !chargeController || chargeController.maxPvInputCurrentA === undefined) {
    return {
      code: "PV_ISC_WITHIN_CONTROLLER",
      severity: "info",
      passed: true,
      message: "Skipped: PV and controller max PV current both required.",
    };
  }
  const passed = pv.arrayIsc <= chargeController.maxPvInputCurrentA;
  return {
    code: "PV_ISC_WITHIN_CONTROLLER",
    severity: "error",
    passed,
    message: passed
      ? `PV Isc (${pv.arrayIsc} A) is within controller limit (${chargeController.maxPvInputCurrentA} A).`
      : `PV Isc (${pv.arrayIsc} A) exceeds controller limit (${chargeController.maxPvInputCurrentA} A).`,
    details: { isc: pv.arrayIsc, controllerMax: chargeController.maxPvInputCurrentA },
  };
}

function ruleControllerOutputWithinBatteryChargeLimit(
  input: ValidationInput,
): RuleResult {
  const { battery, chargeController } = input.config;
  if (!battery || !chargeController) {
    return {
      code: "CONTROLLER_OUTPUT_WITHIN_BATTERY_CHARGE_LIMIT",
      severity: "info",
      passed: true,
      message: "Skipped: battery and charge controller both required.",
    };
  }
  const passed =
    chargeController.recommendedCurrentA <= battery.maxChargeCurrentA;
  return {
    code: "CONTROLLER_OUTPUT_WITHIN_BATTERY_CHARGE_LIMIT",
    severity: "error",
    passed,
    message: passed
      ? `Controller output (${chargeController.recommendedCurrentA} A) is within battery charge limit (${battery.maxChargeCurrentA} A).`
      : `Controller output (${chargeController.recommendedCurrentA} A) exceeds battery charge limit (${battery.maxChargeCurrentA} A).`,
    details: {
      controllerA: chargeController.recommendedCurrentA,
      batteryMax: battery.maxChargeCurrentA,
    },
  };
}

function rulePvEnergyMeetsDailyRequirement(
  input: ValidationInput,
): RuleResult {
  const { pv } = input.config;
  const need = input.config.dailyEnergyRequirementKwh;
  if (!pv || need <= 0) {
    return {
      code: "PV_ENERGY_MEETS_DAILY_REQUIREMENT",
      severity: "info",
      passed: true,
      message: "Skipped: PV snapshot and positive daily energy required.",
    };
  }
  const ratio = pv.dailyGenerationKwh / need;

  let severity: RuleResult["severity"] = "error";
  let passed = true;
  let message = `PV generation (${pv.dailyGenerationKwh} kWh) meets daily requirement (${need} kWh), ratio ${round(ratio, 2)}.`;

  if (ratio < ENERGY_DEFICIT_WARN_RATIO) {
    passed = false;
    message = `PV generation (${pv.dailyGenerationKwh} kWh) is below daily requirement (${need} kWh), ratio ${round(ratio, 2)}.`;
  } else if (ratio < 1.0) {
    severity = "warning";
    message = `PV generation (${pv.dailyGenerationKwh} kWh) is slightly below daily requirement (${need} kWh), ratio ${round(ratio, 2)}.`;
  } else if (ratio > ENERGY_SURPLUS_WARN_RATIO) {
    severity = "warning";
    message = `PV generation (${pv.dailyGenerationKwh} kWh) is well above daily requirement (${need} kWh), ratio ${round(ratio, 2)}. Consider battery or export.`;
  }

  return {
    code: "PV_ENERGY_MEETS_DAILY_REQUIREMENT",
    severity,
    passed,
    message,
    details: { generationKwh: pv.dailyGenerationKwh, needKwh: need, ratio: round(ratio) },
  };
}

function ruleInverterPeakWithinBatteryDischarge(
  input: ValidationInput,
): RuleResult {
  const { battery, inverter } = input.config;
  if (!battery || !inverter) {
    return {
      code: "INVERTER_PEAK_WITHIN_BATTERY_DISCHARGE",
      severity: "info",
      passed: true,
      message: "Skipped: battery and inverter both required.",
    };
  }
  const passed = inverter.dcSurgeCurrentA <= battery.maxDischargeCurrentA;
  return {
    code: "INVERTER_PEAK_WITHIN_BATTERY_DISCHARGE",
    severity: "error",
    passed,
    message: passed
      ? `Inverter surge DC current (${inverter.dcSurgeCurrentA} A) is within battery discharge limit (${battery.maxDischargeCurrentA} A).`
      : `Inverter surge DC current (${inverter.dcSurgeCurrentA} A) exceeds battery discharge limit (${battery.maxDischargeCurrentA} A).`,
    details: {
      inverterSurgeA: inverter.dcSurgeCurrentA,
      batteryMax: battery.maxDischargeCurrentA,
    },
  };
}

function rulesForCables(input: ValidationInput): RuleResult[] {
  const cables = input.config.cables;
  if (!cables || cables.length === 0) {
    return [
      {
        code: "CABLE_AMPACITY_SUFFICIENT",
        severity: "info",
        passed: true,
        message: "Skipped: no cable snapshots provided.",
      },
      {
        code: "CABLE_VOLTAGE_DROP_WITHIN_TARGET",
        severity: "info",
        passed: true,
        message: "Skipped: no cable snapshots provided.",
      },
    ];
  }

  const ampacityFailures: string[] = [];
  const dropFailures: string[] = [];

  for (const c of cables) {
    if (c.deratedAmpacityA * AMPACITY_SAFETY_RATIO < c.currentA) {
      ampacityFailures.push(
        `${c.role}: derated ${c.deratedAmpacityA} A < current ${c.currentA} A`,
      );
    }
    if (
      c.targetDropPercent !== undefined &&
      c.actualDropPercent > c.targetDropPercent * DROP_OVERSHOOT_WARN
    ) {
      dropFailures.push(
        `${c.role}: drop ${c.actualDropPercent} % > target ${c.targetDropPercent} %`,
      );
    }
  }

  return [
    {
      code: "CABLE_AMPACITY_SUFFICIENT",
      severity: "error",
      passed: ampacityFailures.length === 0,
      message:
        ampacityFailures.length === 0
          ? `All ${cables.length} cable run(s) have sufficient derated ampacity.`
          : `Cable ampacity failures: ${ampacityFailures.join("; ")}.`,
      details: { failures: ampacityFailures.length },
    },
    {
      code: "CABLE_VOLTAGE_DROP_WITHIN_TARGET",
      severity: "error",
      passed: dropFailures.length === 0,
      message:
        dropFailures.length === 0
          ? `All cable runs meet their voltage-drop targets.`
          : `Voltage-drop failures: ${dropFailures.join("; ")}.`,
      details: { failures: dropFailures.length },
    },
  ];
}

function rulesForProtection(input: ValidationInput): RuleResult[] {
  const prot = input.config.protections;
  if (!prot || prot.length === 0) {
    return [
      {
        code: "PROTECTION_CURRENT_SUFFICIENT",
        severity: "info",
        passed: true,
        message: "Skipped: no protection snapshots provided.",
      },
      {
        code: "PROTECTION_VOLTAGE_SUFFICIENT",
        severity: "info",
        passed: true,
        message: "Skipped: no protection snapshots provided.",
      },
      {
        code: "PROTECTION_INTERRUPT_SUFFICIENT",
        severity: "info",
        passed: true,
        message: "Skipped: no protection snapshots provided.",
      },
    ];
  }

  const currentFailures: string[] = [];
  const voltageFailures: string[] = [];
  const interruptFailures: string[] = [];

  for (const p of prot) {
    if (
      p.selectedRatingA * PROTECTION_CURRENT_RATIO <
      p.designCurrentA
    ) {
      currentFailures.push(
        `${p.role}: rating ${p.selectedRatingA} A < design ${p.designCurrentA} A`,
      );
    }
    if (
      p.selectedVoltageRatingV !== undefined &&
      p.selectedVoltageRatingV * PROTECTION_VOLTAGE_RATIO <
        p.minimumVoltageRatingV
    ) {
      voltageFailures.push(
        `${p.role}: rating ${p.selectedVoltageRatingV} V < min ${p.minimumVoltageRatingV} V`,
      );
    }
    if (
      p.selectedInterruptRatingKa !== undefined &&
      p.availableFaultCurrentKa !== undefined &&
      p.selectedInterruptRatingKa * PROTECTION_INTERRUPT_RATIO <
        p.availableFaultCurrentKa
    ) {
      interruptFailures.push(
        `${p.role}: interrupt ${p.selectedInterruptRatingKa} kA < fault ${p.availableFaultCurrentKa} kA`,
      );
    }
  }

  return [
    {
      code: "PROTECTION_CURRENT_SUFFICIENT",
      severity: "error",
      passed: currentFailures.length === 0,
      message:
        currentFailures.length === 0
          ? `All ${prot.length} protection device(s) have sufficient current rating.`
          : `Protection current failures: ${currentFailures.join("; ")}.`,
      details: { failures: currentFailures.length },
    },
    {
      code: "PROTECTION_VOLTAGE_SUFFICIENT",
      severity: "error",
      passed: voltageFailures.length === 0,
      message:
        voltageFailures.length === 0
          ? `All protection device(s) have sufficient voltage rating.`
          : `Protection voltage failures: ${voltageFailures.join("; ")}.`,
      details: { failures: voltageFailures.length },
    },
    {
      code: "PROTECTION_INTERRUPT_SUFFICIENT",
      severity: "error",
      passed: interruptFailures.length === 0,
      message:
        interruptFailures.length === 0
          ? `All protection device(s) have sufficient interrupt rating.`
          : `Protection interrupt failures: ${interruptFailures.join("; ")}.`,
      details: { failures: interruptFailures.length },
    },
  ];
}

function ruleSystemVoltagesConsistent(
  input: ValidationInput,
): RuleResult {
  const { battery, inverter, chargeController } = input.config;
  if (!battery || (!inverter && !chargeController)) {
    return {
      code: "SYSTEM_VOLTAGES_CONSISTENT",
      severity: "info",
      passed: true,
      message: "Skipped: system-wide voltage check requires battery and at least one DC component.",
    };
  }

  const voltages: Array<{ name: string; v: number }> = [
    { name: "battery", v: battery.bankVoltage },
  ];
  if (inverter) voltages.push({ name: "inverter", v: inverter.systemVoltage });
  if (chargeController) {
    voltages.push({ name: "controller", v: chargeController.batteryVoltage });
  }

  const min = Math.min(...voltages.map((x) => x.v));
  const max = Math.max(...voltages.map((x) => x.v));
  const passed = max - min <= VOLTAGE_MATCH_TOLERANCE_V;

  return {
    code: "SYSTEM_VOLTAGES_CONSISTENT",
    severity: "error",
    passed,
    message: passed
      ? `All DC components agree on a ${min} V system.`
      : `DC voltages disagree: ${voltages.map((x) => `${x.name}=${x.v}V`).join(", ")}.`,
    details: { min, max, delta: max - min },
  };
}

function rulePvArrayPowerMatchesBatteryCRate(
  input: ValidationInput,
): RuleResult {
  const { pv, battery } = input.config;
  if (!pv || !battery || battery.installedKwh <= 0) {
    return {
      code: "PV_ARRAY_POWER_MATCHES_BATTERY_C_RATE",
      severity: "info",
      passed: true,
      message: "Skipped: PV and battery with installed capacity both required.",
    };
  }

  const ratio = pv.arrayKwp / battery.installedKwh;

  let severity: RuleResult["severity"] = "info";
  let message = `PV-to-battery ratio is ${round(ratio, 2)} kWp/kWh.`;

  if (ratio < PV_POWER_C_RATE_LOW) {
    severity = "warning";
    message = `PV array is small relative to battery (${round(ratio, 2)} kWp/kWh). Expect slow recharge.`;
  } else if (ratio > PV_POWER_C_RATE_HIGH) {
    severity = "warning";
    message = `PV array is large relative to battery (${round(ratio, 2)} kWp/kWh). Verify charge controller can absorb peak output.`;
  }

  return {
    code: "PV_ARRAY_POWER_MATCHES_BATTERY_C_RATE",
    severity,
    passed: true,
    message,
    details: { ratio: round(ratio) },
  };
}

// ---------------------------------------------------------------------
// Engine-level orchestration
// ---------------------------------------------------------------------

export function calculateInternal(
  input: ValidationInput,
): ValidationResult {
  const skipped = new Set(input.skipRules ?? []);
  const engineWarnings: string[] = [];

  // Presence hints
  if (!input.config.pv) engineWarnings.push(WARN_NO_PV);
  if (!input.config.battery) engineWarnings.push(WARN_NO_BATTERY);
  if (!input.config.inverter) engineWarnings.push(WARN_NO_INVERTER);
  if (!input.config.chargeController) engineWarnings.push(WARN_NO_CONTROLLER);
  if (!input.config.cables || input.config.cables.length === 0) {
    engineWarnings.push(WARN_NO_CABLES);
  }
  if (!input.config.protections || input.config.protections.length === 0) {
    engineWarnings.push(WARN_NO_PROTECTION);
  }

  const allResults: RuleResult[] = [
    ruleVoltageBatteryInverterMatch(input),
    ruleVoltageBatteryControllerMatch(input),
    rulePvVocWithinController(input),
    rulePvIscWithinController(input),
    ruleControllerOutputWithinBatteryChargeLimit(input),
    rulePvEnergyMeetsDailyRequirement(input),
    ruleInverterPeakWithinBatteryDischarge(input),
    ...rulesForCables(input),
    ...rulesForProtection(input),
    ruleSystemVoltagesConsistent(input),
    rulePvArrayPowerMatchesBatteryCRate(input),
  ].filter((r) => !skipped.has(r.code as RuleCode));

  const passedRules = allResults.filter(
    (r) => r.passed && r.severity !== "info",
  );
  const failedRules = allResults.filter((r) => !r.passed);
  const warningRules = allResults.filter(
    (r) => r.passed && r.severity === "warning",
  );
  const infoRules = allResults.filter((r) => r.severity === "info");

  const errorCount = failedRules.length;
  const warningCount = warningRules.length;
  const infoCount = infoRules.length;

  const overallStatus: ValidationResult["overallStatus"] =
    errorCount > 0 ? "invalid" : warningCount > 0 ? "warning" : "valid";

  return {
    overallStatus,
    passedRules,
    failedRules,
    warningRules,
    infoRules,
    allRules: allResults,
    errorCount,
    warningCount,
    infoCount,
    warnings: engineWarnings,
    errors: [],
    isValid: true,
  };
}
