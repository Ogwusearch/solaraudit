
/**
 * SolarAudit — Costing Engine: Error & Warning Messages
 *
 * Centralized validation errors and engineering warnings.
 * No calculation logic belongs in this file.
 */

export const ERROR_NO_ITEMS =
  "At least one cost line item is required.";

export const errorInvalidQuantity = (
  idx: number,
  desc: string,
): string =>
  `Item[${idx}] '${desc}': quantity must be greater than 0.`;

export const errorInvalidUnitCost = (
  idx: number,
  desc: string,
): string =>
  `Item[${idx}] '${desc}': unitCost must be >= 0.`;

export const ERROR_INVALID_CURRENCY =
  "currency must be a 3-letter ISO 4217 code (e.g. NGN, USD, EUR).";

export const ERROR_INVALID_WASTE_FACTOR =
  "wasteFactor must be between 0 and 1.";

export const ERROR_INVALID_DISCOUNT_PERCENT =
  "discountPercent must be between 0 and 100.";

export const ERROR_INVALID_TAX_PERCENT =
  "taxPercent must be between 0 and 100.";

export const errorInvalidOverhead = (
  name: string,
): string =>
  `${name} must be between 0 and 100 percent.`;

/* -------------------------------------------------------------------------- */
/* Warnings                                                                   */
/* -------------------------------------------------------------------------- */

export const WARN_HIGH_WASTE = (
  value: number,
): string =>
  `Waste factor is high (${value * 100}%). Verify material take-off.`;

export const WARN_HIGH_CONTINGENCY = (
  value: number,
): string =>
  `Contingency is high (${value}%). Consider refining the design.`;

export const WARN_HIGH_DISCOUNT = (
  value: number,
): string =>
  `Discount is high (${value}%). Verify margin remains viable.`;

export const WARN_NO_TAX =
  "Tax rate is zero. Verify this is intentional for the project jurisdiction.";

export const WARN_HIGH_TAX = (
  value: number,
): string =>
  `Tax rate is high (${value}%). Confirm against local tax rules.`;

export const WARN_ZERO_TOTAL =
  "Grand total is zero. Verify all line items and percentages.";

export const WARN_EMPTY_CATEGORY = (
  category: string,
): string =>
  `Category '${category}' has zero total cost.`;
