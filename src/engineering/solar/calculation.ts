
/**
 * SolarAudit — Solar Engine: Calculation
 *
 * Pure math. Assumes input is valid.
 *
 * Sizing model:
 *
 *   1. PV energy requirement = dailyEnergyKwh / systemEfficiency
 *   2. Required array power   = PV energy requirement / peakSunHours
 *   3. Design array power    = required × (1 + designMargin)
 *   4. Panels required       = ceil(designArrayKw / panelRatedKw)
 *
 * Array configuration:
 *
 *   - Select a series length L.
 *   - Calculate required parallel strings.
 *   - Respect optional Voc/Vmp limits when possible.
 *   - Prefer fewer parallel strings.
 *   - Prefer lower panel oversizing.
 *   - Prefer longer series strings when otherwise equivalent.
 *
 * Electrical outputs:
 *
 *   Array Vmp = series × panel Vmp
 *   Array Voc = series × panel Voc
 *   Array Imp = parallel × panel Imp
 *   Array Isc = parallel × panel Isc
 */

import type {
  SolarInput,
  SolarResult,
} from "./types";

import {
  LOW_PSH_THRESHOLD,
  HIGH_SERIES_STRING_THRESHOLD,
  ROUND_DECIMALS,
} from "./constants";

import {
  ERROR_PSH_ZERO,
  WARN_LOW_PSH,
  WARN_LONG_SERIES_STRING,
  WARN_VOC_EXCEEDS_LIMIT,
  WARN_VMP_BELOW_MINIMUM,
} from "./errors";

// -----------------------------------------------------------------------------
// Utilities
// -----------------------------------------------------------------------------

function round(
  value: number,
  decimals = ROUND_DECIMALS,
): number {
  const factor = 10 ** decimals;

  return (
    Math.round(value * factor) /
    factor
  );
}

function emptyResult(
  errors: string[],
): SolarResult {
  return {
    requiredArrayKwp: 0,
    designArrayKwp: 0,

    totalPanels: 0,

    seriesPanels: 0,
    parallelStrings: 0,

    actualArrayKwp: 0,

    arrayVmp: 0,
    arrayImp: 0,

    arrayVoc: 0,
    arrayIsc: 0,

    warnings: [],
    errors,

    isValid: false,
  };
}

// -----------------------------------------------------------------------------
// Calculation
// -----------------------------------------------------------------------------

export function calculateInternal(
  input: SolarInput,
): SolarResult {
  const warnings: string[] = [];

  // ===========================================================================
  // 1. PV SIZING
  // ===========================================================================

  if (input.peakSunHours <= 0) {
    return emptyResult([
      ERROR_PSH_ZERO,
    ]);
  }

  const pvEnergyRequiredKwh =
    input.dailyEnergyKwh /
    input.systemEfficiency;

  const requiredArrayKw =
    pvEnergyRequiredKwh /
    input.peakSunHours;

  const designArrayKw =
    requiredArrayKw *
    (1 + input.designMargin);

  const panelKw =
    input.panel.ratedPowerWatts /
    1000;

  const panelsNeeded = Math.max(
    1,
    Math.ceil(
      designArrayKw /
        panelKw,
    ),
  );

  // ===========================================================================
  // 2. CONFIGURATION LIMITS
  // ===========================================================================

  const maxSeries =
    input.maxSeriesPanels ??
    panelsNeeded;

  const maxParallel =
    input.maxParallelStrings ??
    panelsNeeded;

  const seriesLimit =
    Math.min(
      maxSeries,
      panelsNeeded,
    );

  // ===========================================================================
  // 3. FIND ELECTRICALLY VALID CONFIGURATION
  // ===========================================================================
  //
  // Ranking:
  //
  //   1. Fewer parallel strings
  //   2. Lower panel oversizing
  //   3. Longer series string
  //
  // This favors configurations that reduce parallel conductors while
  // avoiding unnecessary panel oversizing.
  // ===========================================================================

  let bestSeries = 0;
  let bestParallel = 0;
  let bestTotal = 0;

  let bestParallelScore =
    Number.POSITIVE_INFINITY;

  let bestOversize =
    Number.POSITIVE_INFINITY;

  let bestSeriesScore = 0;

  for (
    let series = 1;
    series <= seriesLimit;
    series++
  ) {
    const parallel =
      Math.ceil(
        panelsNeeded /
          series,
      );

    if (
      parallel >
      maxParallel
    ) {
      continue;
    }

    const stringVoc =
      series *
      input.panel.voc;

    const stringVmp =
      series *
      input.panel.vmp;

    // ---------------------------------------------------------------
    // Optional Voc limit
    // ---------------------------------------------------------------

    if (
      input.maxArrayVoc !==
        undefined &&
      stringVoc >
        input.maxArrayVoc
    ) {
      continue;
    }

    // ---------------------------------------------------------------
    // Optional Vmp minimum
    // ---------------------------------------------------------------

    if (
      input.minArrayVmp !==
        undefined &&
      stringVmp <
        input.minArrayVmp
    ) {
      continue;
    }

    const total =
      series *
      parallel;

    const oversize =
      total -
      panelsNeeded;

    // ---------------------------------------------------------------
    // Ranking
    // ---------------------------------------------------------------

    const isBetter =
      parallel <
        bestParallelScore ||
      (
        parallel ===
          bestParallelScore &&
        oversize <
          bestOversize
      ) ||
      (
        parallel ===
          bestParallelScore &&
        oversize ===
          bestOversize &&
        series >
          bestSeriesScore
      );

    if (isBetter) {
      bestSeries = series;
      bestParallel = parallel;
      bestTotal = total;

      bestParallelScore =
        parallel;

      bestOversize =
        oversize;

      bestSeriesScore =
        series;
    }
  }

  // ===========================================================================
  // 4. FALLBACK CONFIGURATION
  // ===========================================================================
  //
  // No configuration satisfied the optional electrical limits.
  //
  // We still produce the mathematically closest configuration so the caller
  // receives useful sizing information. The resulting electrical values are
  // checked and warnings are generated below.
  // ===========================================================================

  if (bestTotal === 0) {
    let fallbackSeries = 1;
    let fallbackParallel =
      Number.POSITIVE_INFINITY;

    let fallbackTotal =
      Number.POSITIVE_INFINITY;

    let fallbackOversize =
      Number.POSITIVE_INFINITY;

    for (
      let series = 1;
      series <= seriesLimit;
      series++
    ) {
      const parallel =
        Math.ceil(
          panelsNeeded /
            series,
        );

      if (
        parallel >
        maxParallel
      ) {
        continue;
      }

      const total =
        series *
        parallel;

      const oversize =
        total -
        panelsNeeded;

      const isBetter =
        parallel <
          fallbackParallel ||
        (
          parallel ===
            fallbackParallel &&
          oversize <
            fallbackOversize
        ) ||
        (
          parallel ===
            fallbackParallel &&
          oversize ===
            fallbackOversize &&
          series >
            fallbackSeries
        );

      if (isBetter) {
        fallbackSeries =
          series;

        fallbackParallel =
          parallel;

        fallbackTotal =
          total;

        fallbackOversize =
          oversize;
      }
    }

    if (
      fallbackTotal ===
      Number.POSITIVE_INFINITY
    ) {
      return emptyResult([
        "No valid PV array configuration could be constructed within the configured series and parallel limits.",
      ]);
    }

    bestSeries =
      fallbackSeries;

    bestParallel =
      fallbackParallel;

    bestTotal =
      fallbackTotal;
  }

  // ===========================================================================
  // 5. ACTUAL ARRAY POWER
  // ===========================================================================

  const actualArrayKw =
    bestTotal *
    panelKw;

  // ===========================================================================
  // 6. ARRAY ELECTRICAL VALUES
  // ===========================================================================

  const arrayVmp =
    bestSeries *
    input.panel.vmp;

  const arrayImp =
    bestParallel *
    input.panel.imp;

  const arrayVoc =
    bestSeries *
    input.panel.voc;

  const arrayIsc =
    bestParallel *
    input.panel.isc;

  // ===========================================================================
  // 7. WARNINGS
  // ===========================================================================

  if (
    input.peakSunHours <
    LOW_PSH_THRESHOLD
  ) {
    warnings.push(
      WARN_LOW_PSH(
        input.peakSunHours,
      ),
    );
  }

  if (
    bestSeries >
    HIGH_SERIES_STRING_THRESHOLD
  ) {
    warnings.push(
      WARN_LONG_SERIES_STRING(
        bestSeries,
      ),
    );
  }

  if (
    input.maxArrayVoc !==
      undefined &&
    arrayVoc >
      input.maxArrayVoc
  ) {
    warnings.push(
      WARN_VOC_EXCEEDS_LIMIT(
        round(arrayVoc),
      ),
    );
  }

  if (
    input.minArrayVmp !==
      undefined &&
    arrayVmp <
      input.minArrayVmp
  ) {
    warnings.push(
      WARN_VMP_BELOW_MINIMUM(
        round(arrayVmp),
      ),
    );
  }

  // ===========================================================================
  // 8. RESULT
  // ===========================================================================

  return {
    requiredArrayKwp:
      round(requiredArrayKw),

    designArrayKwp:
      round(designArrayKw),

    totalPanels:
      bestTotal,

    seriesPanels:
      bestSeries,

    parallelStrings:
      bestParallel,

    actualArrayKwp:
      round(actualArrayKw),

    arrayVmp:
      round(arrayVmp),

    arrayImp:
      round(arrayImp),

    arrayVoc:
      round(arrayVoc),

    arrayIsc:
      round(arrayIsc),

    warnings,

    errors: [],

    isValid: true,
  };
}
