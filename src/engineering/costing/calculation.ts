/**
 * SolarAudit — Costing Engine: Calculation
 *
 * Pure math. Assumes input is valid.
 *
 * Model:
 *
 *   extended_i        = quantity_i × unitCost_i
 *   materialSubtotal  = Σ extended_i
 *   wasteCost         = materialSubtotal × wasteFactor
 *   adjustedMaterials = materialSubtotal + wasteCost
 *
 *   installation      = adjustedMaterials × installationPercent / 100
 *   transport         = adjustedMaterials × transportPercent / 100
 *   engineering       = adjustedMaterials × engineeringPercent / 100
 *   overheadsSubtotal = installation + transport + engineering
 *
 *   contingencyBase   = adjustedMaterials + overheadsSubtotal
 *   contingencyCost   = contingencyBase × contingencyPercent / 100
 *   preDiscountTotal  = contingencyBase + contingencyCost
 *
 *   discountAmount    = preDiscountTotal × discountPercent / 100
 *   subtotalAfter     = preDiscountTotal − discountAmount
 *
 *   taxAmount         = subtotalAfter × taxPercent / 100
 *   grandTotal        = subtotalAfter + taxAmount
 */

import type {
  CostCategory,
  CostCategoryBreakdown,
  CostingInput,
  CostingResult,
} from "./types";

import {
  DEFAULT_WASTE_FACTOR,
  HIGH_WASTE_THRESHOLD,
  HIGH_CONTINGENCY_THRESHOLD,
  HIGH_DISCOUNT_THRESHOLD,
  LOW_TAX_THRESHOLD,
  HIGH_TAX_THRESHOLD,
  ROUND_DECIMALS,
  ROUND_DECIMALS_QTY,
} from "./constants";

import {
  WARN_HIGH_WASTE,
  WARN_HIGH_CONTINGENCY,
  WARN_HIGH_DISCOUNT,
  WARN_NO_TAX,
  WARN_HIGH_TAX,
  WARN_ZERO_TOTAL,
} from "./errors";

function round(
  value: number,
  decimals = ROUND_DECIMALS,
): number {
  const factor = 10 ** decimals;

  return Math.round(value * factor) / factor;
}

export function calculateInternal(
  input: CostingInput,
): CostingResult {
  const warnings: string[] = [];

  const wasteFactor =
    input.wasteFactor ?? DEFAULT_WASTE_FACTOR;

  const discountPercent =
    input.discountPercent ?? 0;

  const taxPercent =
    input.taxPercent ?? 0;

  const oh =
    input.overheads ?? {};

  // -----------------------------------------------------------------------
  // 1. Extend line items & build category breakdown
  // -----------------------------------------------------------------------

  const byCategory =
    new Map<
      CostCategory,
      CostCategoryBreakdown
    >();

  let materialSubtotal = 0;

  for (const item of input.items) {
    const extended =
      item.quantity * item.unitCost;

    materialSubtotal += extended;

    const existing =
      byCategory.get(item.category);

    if (existing) {
      byCategory.set(item.category, {
        category: item.category,

        quantity: round(
          existing.quantity +
            item.quantity,
          ROUND_DECIMALS_QTY,
        ),

        extendedCost: round(
          existing.extendedCost +
            extended,
        ),
      });
    } else {
      byCategory.set(item.category, {
        category: item.category,

        quantity: round(
          item.quantity,
          ROUND_DECIMALS_QTY,
        ),

        extendedCost:
          round(extended),
      });
    }
  }

  const categoryBreakdown =
    Array.from(byCategory.values())
      .sort(
        (a, b) =>
          b.extendedCost -
          a.extendedCost,
      );

  // -----------------------------------------------------------------------
  // 2. Waste
  // -----------------------------------------------------------------------

  const wasteCost =
    materialSubtotal *
    wasteFactor;

  const adjustedMaterials =
    materialSubtotal +
    wasteCost;

  // -----------------------------------------------------------------------
  // 3. Overheads
  // -----------------------------------------------------------------------

  const installationPercent =
    oh.installationPercent ?? 0;

  const transportPercent =
    oh.transportPercent ?? 0;

  const engineeringPercent =
    oh.engineeringPercent ?? 0;

  const contingencyPercent =
    oh.contingencyPercent ?? 0;

  const installationCost =
    adjustedMaterials *
    (installationPercent / 100);

  const transportCost =
    adjustedMaterials *
    (transportPercent / 100);

  const engineeringCost =
    adjustedMaterials *
    (engineeringPercent / 100);

  const overheadsSubtotal =
    installationCost +
    transportCost +
    engineeringCost;

  // -----------------------------------------------------------------------
  // 4. Contingency
  // -----------------------------------------------------------------------

  const contingencyBase =
    adjustedMaterials +
    overheadsSubtotal;

  const contingencyCost =
    contingencyBase *
    (contingencyPercent / 100);

  const preDiscountTotal =
    contingencyBase +
    contingencyCost;

  // -----------------------------------------------------------------------
  // 5. Discount
  // -----------------------------------------------------------------------

  const discountAmount =
    preDiscountTotal *
    (discountPercent / 100);

  const subtotalAfterDiscount =
    preDiscountTotal -
    discountAmount;

  // -----------------------------------------------------------------------
  // 6. Tax
  // -----------------------------------------------------------------------

  const taxAmount =
    subtotalAfterDiscount *
    (taxPercent / 100);

  const grandTotal =
    subtotalAfterDiscount +
    taxAmount;

  // -----------------------------------------------------------------------
  // 7. Warnings
  // -----------------------------------------------------------------------

  if (
    wasteFactor >
    HIGH_WASTE_THRESHOLD
  ) {
    warnings.push(
      WARN_HIGH_WASTE(wasteFactor),
    );
  }

  if (
    contingencyPercent >
    HIGH_CONTINGENCY_THRESHOLD
  ) {
    warnings.push(
      WARN_HIGH_CONTINGENCY(
        contingencyPercent,
      ),
    );
  }

  if (
    discountPercent >
    HIGH_DISCOUNT_THRESHOLD
  ) {
    warnings.push(
      WARN_HIGH_DISCOUNT(
        discountPercent,
      ),
    );
  }

  if (
    taxPercent <=
    LOW_TAX_THRESHOLD
  ) {
    warnings.push(
      WARN_NO_TAX,
    );
  } else if (
    taxPercent >
    HIGH_TAX_THRESHOLD
  ) {
    warnings.push(
      WARN_HIGH_TAX(taxPercent),
    );
  }

  if (grandTotal <= 0) {
    warnings.push(
      WARN_ZERO_TOTAL,
    );
  }

  // -----------------------------------------------------------------------
  // 8. Result
  // -----------------------------------------------------------------------

  return {
    materialSubtotal:
      round(materialSubtotal),

    wasteCost:
      round(wasteCost),

    adjustedMaterials:
      round(adjustedMaterials),

    installationCost:
      round(installationCost),

    transportCost:
      round(transportCost),

    engineeringCost:
      round(engineeringCost),

    overheadsSubtotal:
      round(overheadsSubtotal),

    contingencyCost:
      round(contingencyCost),

    preDiscountTotal:
      round(preDiscountTotal),

    discountAmount:
      round(discountAmount),

    subtotalAfterDiscount:
      round(subtotalAfterDiscount),

    taxAmount:
      round(taxAmount),

    grandTotal:
      round(grandTotal),

    categoryBreakdown,

    currency:
      input.currency,

    warnings,

    errors: [],

    isValid: true,
  };
}