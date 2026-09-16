
/**
 * SolarAudit — Costing Engine: Validation
 *
 * Collects ALL errors.
 * Never throws.
 * Returns string[] (empty == valid).
 */

import type { CostingInput } from "./types";

import {
  ERROR_NO_ITEMS,
  errorInvalidQuantity,
  errorInvalidUnitCost,
  ERROR_INVALID_CURRENCY,
  ERROR_INVALID_WASTE_FACTOR,
  ERROR_INVALID_DISCOUNT_PERCENT,
  ERROR_INVALID_TAX_PERCENT,
  errorInvalidOverhead,
} from "./errors";

import {
  CURRENCY_PATTERN,
  MIN_WASTE_FACTOR,
  MAX_WASTE_FACTOR,
  MIN_PERCENT,
  MAX_PERCENT,
} from "./constants";

export function validateInput(
  input: CostingInput,
): string[] {
  const errors: string[] = [];

  // -----------------------------------------------------------------------
  // Items
  // -----------------------------------------------------------------------

  if (!input.items || input.items.length === 0) {
    errors.push(ERROR_NO_ITEMS);
  }

  input.items?.forEach((item, idx) => {
    if (
      !Number.isFinite(item.quantity) ||
      item.quantity <= 0
    ) {
      errors.push(
        errorInvalidQuantity(
          idx,
          item.description,
        ),
      );
    }

    if (
      !Number.isFinite(item.unitCost) ||
      item.unitCost < 0
    ) {
      errors.push(
        errorInvalidUnitCost(
          idx,
          item.description,
        ),
      );
    }
  });

  // -----------------------------------------------------------------------
  // Currency
  // -----------------------------------------------------------------------

  if (
    !input.currency ||
    !CURRENCY_PATTERN.test(input.currency)
  ) {
    errors.push(ERROR_INVALID_CURRENCY);
  }

  // -----------------------------------------------------------------------
  // Waste factor
  // -----------------------------------------------------------------------

  if (
    input.wasteFactor !== undefined &&
    (
      !Number.isFinite(input.wasteFactor) ||
      input.wasteFactor < MIN_WASTE_FACTOR ||
      input.wasteFactor > MAX_WASTE_FACTOR
    )
  ) {
    errors.push(ERROR_INVALID_WASTE_FACTOR);
  }

  // -----------------------------------------------------------------------
  // Discount
  // -----------------------------------------------------------------------

  if (
    input.discountPercent !== undefined &&
    (
      !Number.isFinite(input.discountPercent) ||
      input.discountPercent < MIN_PERCENT ||
      input.discountPercent > MAX_PERCENT
    )
  ) {
    errors.push(ERROR_INVALID_DISCOUNT_PERCENT);
  }

  // -----------------------------------------------------------------------
  // Tax
  // -----------------------------------------------------------------------

  if (
    input.taxPercent !== undefined &&
    (
      !Number.isFinite(input.taxPercent) ||
      input.taxPercent < MIN_PERCENT ||
      input.taxPercent > MAX_PERCENT
    )
  ) {
    errors.push(ERROR_INVALID_TAX_PERCENT);
  }

  // -----------------------------------------------------------------------
  // Overheads
  // -----------------------------------------------------------------------

  const oh = input.overheads;

  if (oh) {
    validateOverhead(
      oh.contingencyPercent,
      "contingencyPercent",
      errors,
    );

    validateOverhead(
      oh.installationPercent,
      "installationPercent",
      errors,
    );

    validateOverhead(
      oh.transportPercent,
      "transportPercent",
      errors,
    );

    validateOverhead(
      oh.engineeringPercent,
      "engineeringPercent",
      errors,
    );
  }

  return errors;
}

// -------------------------------------------------------------------------
// Overhead validation helper
// -------------------------------------------------------------------------

function validateOverhead(
  value: number | undefined,
  field: string,
  errors: string[],
): void {
  if (
    value !== undefined &&
    (
      !Number.isFinite(value) ||
      value < MIN_PERCENT ||
      value > MAX_PERCENT
    )
  ) {
    errors.push(
      errorInvalidOverhead(field),
    );
  }
}
