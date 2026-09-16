/**
 * SolarAudit — Cable Engine: Calculation
 *
 * Pure math. Assumes input is valid.
 */

import type { CableInput, CableResult } from "./types";
import {
  RESISTIVITY_20C,
  ALPHA_20C,
  STANDARD_AREAS_MM2,
  BASE_AMPACITY_COPPER,
  ALUMINIUM_AMPACITY_FACTOR,
  TEMP_DERATING_PVC,
  GROUPING_DERATING,
  CIRCUIT_FACTOR,
  DEFAULT_AMBIENT_TEMP_C,
  DEFAULT_CONDUCTOR_TEMP_C,
  DEFAULT_GROUPING_COUNT,
  DEFAULT_DESIGN_MARGIN,
  HIGH_AMBIENT_THRESHOLD_C,
  HIGH_DROP_THRESHOLD_PERCENT,
  LONG_RUN_THRESHOLD_M,
  HIGH_GROUPING_THRESHOLD,
  ROUND_DECIMALS,
} from "./constants";

import {
  ERROR_NO_STANDARD_AREA,
  WARN_HIGH_AMBIENT,
  WARN_HIGH_DROP,
  WARN_LONG_RUN,
  WARN_HIGH_GROUPING,
  WARN_VOLTAGE_DROP_DOMINANT,
  WARN_ALUMINIUM_TERMINATION,
  WARN_MARGIN_LARGE,
} from "./errors";

function round(
  value: number,
  decimals = ROUND_DECIMALS,
): number {
  const factor = 10 ** decimals;
  return Math.round(value * factor) / factor;
}

function interpolate(
  table: Array<[number, number]>,
  x: number,
): number {
  if (x <= table[0]![0]) {
    return table[0]![1];
  }

  const last = table[table.length - 1]!;

  if (x >= last[0]) {
    return last[1];
  }

  for (let i = 0; i < table.length - 1; i++) {
    const [x0, y0] = table[i]!;
    const [x1, y1] = table[i + 1]!;

    if (x >= x0 && x <= x1) {
      return (
        y0 +
        ((y1 - y0) * (x - x0)) /
          (x1 - x0)
      );
    }
  }

  return 1;
}

function nextStandardArea(
  mm2: number,
): number | null {
  for (const area of STANDARD_AREAS_MM2) {
    if (area >= mm2) {
      return area;
    }
  }

  return null;
}

function baseAmpacity(
  material: string,
  areaMm2: number,
): number | null {
  const copper =
    BASE_AMPACITY_COPPER[areaMm2];

  if (copper === undefined) {
    return null;
  }

  return material === "aluminium"
    ? copper * ALUMINIUM_AMPACITY_FACTOR
    : copper;
}

export function calculateInternal(
  input: CableInput,
): CableResult {
  const warnings: string[] = [];
  const errors: string[] = [];

  // -------------------------------------------------------------------------
  // Defaults
  // -------------------------------------------------------------------------

  const designMargin =
    input.designMargin ??
    DEFAULT_DESIGN_MARGIN;

  const ambientTempC =
    input.ambientTemperatureC ??
    DEFAULT_AMBIENT_TEMP_C;

  const conductorTempC =
    input.conductorTempC ??
    DEFAULT_CONDUCTOR_TEMP_C;

  const groupingCount =
    input.groupingCount ??
    DEFAULT_GROUPING_COUNT;

  // -------------------------------------------------------------------------
  // Design current
  // -------------------------------------------------------------------------

  const designCurrentA =
    input.currentA *
    (1 + designMargin);

  // -------------------------------------------------------------------------
  // Maximum allowable voltage drop
  // -------------------------------------------------------------------------

  const maxVoltageDropV =
    input.systemVoltage *
    (input.allowableDropPercent / 100);

  // -------------------------------------------------------------------------
  // Conductor resistance at operating temperature
  // -------------------------------------------------------------------------

  const rho20 =
    RESISTIVITY_20C[input.material]!;

  const alpha =
    ALPHA_20C[input.material]!;

  const rhoT =
    rho20 *
    (1 + alpha * (conductorTempC - 20));

  // -------------------------------------------------------------------------
  // Circuit factor
  // -------------------------------------------------------------------------

  const K =
    CIRCUIT_FACTOR[input.circuitType]!;

  // -------------------------------------------------------------------------
  // Voltage-drop conductor area
  // -------------------------------------------------------------------------

  const calculatedAreaMm2 =
    (
      K *
      designCurrentA *
      input.lengthM *
      rhoT
    ) /
    maxVoltageDropV;

  // -------------------------------------------------------------------------
  // Ampacity calculation
  // -------------------------------------------------------------------------

  const temperatureFactor =
    interpolate(
      TEMP_DERATING_PVC,
      ambientTempC,
    );

  const groupingFactor =
    interpolate(
      GROUPING_DERATING,
      groupingCount,
    );

  let ampacityAreaMm2 = 0;

  for (
    const area of STANDARD_AREAS_MM2
  ) {
    const base =
      baseAmpacity(
        input.material,
        area,
      );

    if (base === null) {
      continue;
    }

    const derated =
      base *
      temperatureFactor *
      groupingFactor;

    if (
      derated >=
      designCurrentA
    ) {
      ampacityAreaMm2 = area;
      break;
    }
  }

  if (ampacityAreaMm2 === 0) {
    errors.push(ERROR_NO_STANDARD_AREA);

    ampacityAreaMm2 =
      STANDARD_AREAS_MM2[
        STANDARD_AREAS_MM2.length - 1
      ]!;
  }

  // -------------------------------------------------------------------------
  // Final required conductor area
  // -------------------------------------------------------------------------

  const requiredAreaMm2 =
    Math.max(
      calculatedAreaMm2,
      ampacityAreaMm2,
    );

  // -------------------------------------------------------------------------
  // Select next standard conductor size
  // -------------------------------------------------------------------------

  const selectedMatch =
    nextStandardArea(
      requiredAreaMm2,
    );

  /*
   * IMPORTANT FIX:
   *
   * If the required area is larger than
   * the largest standard conductor,
   * use the largest standard size for
   * the actual result instead of returning
   * a non-standard conductor area.
   */

  const selectedAreaMm2 =
    selectedMatch ??
    STANDARD_AREAS_MM2[
      STANDARD_AREAS_MM2.length - 1
    ]!;

  if (
    selectedMatch === null &&
    !errors.includes(
      ERROR_NO_STANDARD_AREA,
    )
  ) {
    errors.push(
      ERROR_NO_STANDARD_AREA,
    );
  }

  // -------------------------------------------------------------------------
  // Actual voltage drop using selected conductor
  // -------------------------------------------------------------------------

  const resistanceOhmPerKm =
    (rhoT / selectedAreaMm2) *
    1000;

  const actualVoltageDropV =
    (
      K *
      designCurrentA *
      input.lengthM *
      rhoT
    ) /
    selectedAreaMm2;

  const actualDropPercent =
    (
      actualVoltageDropV /
      input.systemVoltage
    ) *
    100;

  // -------------------------------------------------------------------------
  // Selected conductor ampacity
  // -------------------------------------------------------------------------

  const baseSelected =
    baseAmpacity(
      input.material,
      selectedAreaMm2,
    ) ?? 0;

  const deratedAmpacityA =
    baseSelected *
    temperatureFactor *
    groupingFactor;

  // -------------------------------------------------------------------------
  // COMPATIBILITY CHECKS
  // -------------------------------------------------------------------------

  const ampacityCompatible =
    deratedAmpacityA >=
    designCurrentA;

  const voltageDropCompatible =
    actualDropPercent <=
    input.allowableDropPercent;

  // -------------------------------------------------------------------------
  // Warnings
  // -------------------------------------------------------------------------

  if (
    ambientTempC >=
    HIGH_AMBIENT_THRESHOLD_C
  ) {
    warnings.push(
      WARN_HIGH_AMBIENT(
        ambientTempC,
      ),
    );
  }

  if (
    input.allowableDropPercent >=
    HIGH_DROP_THRESHOLD_PERCENT
  ) {
    warnings.push(
      WARN_HIGH_DROP(
        input.allowableDropPercent,
      ),
    );
  }

  if (
    input.lengthM >=
    LONG_RUN_THRESHOLD_M
  ) {
    warnings.push(
      WARN_LONG_RUN(
        input.lengthM,
      ),
    );
  }

  if (
    groupingCount >=
    HIGH_GROUPING_THRESHOLD
  ) {
    warnings.push(
      WARN_HIGH_GROUPING(
        groupingCount,
      ),
    );
  }

  if (
    calculatedAreaMm2 >
    ampacityAreaMm2
  ) {
    warnings.push(
      WARN_VOLTAGE_DROP_DOMINANT,
    );
  }

  if (
    input.material ===
    "aluminium"
  ) {
    warnings.push(
      WARN_ALUMINIUM_TERMINATION,
    );
  }

  if (
    designMargin > 0.5
  ) {
    warnings.push(
      WARN_MARGIN_LARGE,
    );
  }

  // -------------------------------------------------------------------------
  // Final validity
  // -------------------------------------------------------------------------

  const isValid =
    errors.length === 0 &&
    ampacityCompatible &&
    voltageDropCompatible;

  // -------------------------------------------------------------------------
  // Result
  // -------------------------------------------------------------------------

  return {
    designCurrentA:
      round(designCurrentA),

    maxVoltageDropV:
      round(maxVoltageDropV),

    calculatedAreaMm2:
      round(calculatedAreaMm2),

    ampacityAreaMm2:
      round(ampacityAreaMm2),

    requiredAreaMm2:
      round(requiredAreaMm2),

    selectedAreaMm2:
      round(selectedAreaMm2),

    actualVoltageDropV:
      round(actualVoltageDropV),

    actualDropPercent:
      round(actualDropPercent),

    resistanceOhmPerKm:
      round(resistanceOhmPerKm),

    temperatureFactor:
      round(temperatureFactor),

    groupingFactor:
      round(groupingFactor),

    deratedAmpacityA:
      round(deratedAmpacityA),

    // FIX #1
    ampacityCompatible,

    // FIX #2
    voltageDropCompatible,

    warnings,
    errors,
    isValid,
  };
}