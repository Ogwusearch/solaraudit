/**
 * SolarAudit — Costing Engine: Types
 *
 * Pure data definitions.
 * No logic.
 * No imports from siblings.
 *
 * Costing is financial, not electrical.
 * A price change must never affect a sizing result.
 */

export type CostCategory =
  | "pv-modules"
  | "batteries"
  | "inverter"
  | "charge-controller"
  | "dc-breakers"
  | "ac-breakers"
  | "fuses"
  | "spd"
  | "cables"
  | "connectors"
  | "busbars"
  | "enclosures"
  | "mounting"
  | "earthing"
  | "monitoring"
  | "labour"
  | "transport"
  | "engineering"
  | "other";

export interface CostLineItem {
  readonly category: CostCategory;
  readonly description: string;

  /**
   * Quantity of the item.
   * Must be greater than zero.
   */
  readonly quantity: number;

  /**
   * Unit cost in the project currency.
   * Zero is allowed for supplied/free components.
   */
  readonly unitCost: number;

  /**
   * Optional measurement unit.
   * Examples: pcs, m, kg, set.
   */
  readonly unit?: string;
}

export interface OverheadConfig {
  /**
   * Percentage of adjusted materials + other overheads.
   */
  readonly contingencyPercent?: number;

  /**
   * Percentage of adjusted material subtotal.
   */
  readonly installationPercent?: number;

  /**
   * Percentage of adjusted material subtotal.
   */
  readonly transportPercent?: number;

  /**
   * Percentage of adjusted material subtotal.
   */
  readonly engineeringPercent?: number;
}

export interface CostingInput {
  /**
   * Cost line items.
   */
  readonly items: readonly CostLineItem[];

  /**
   * ISO 4217 currency code.
   * Examples: NGN, USD, EUR, GBP.
   */
  readonly currency: string;

  /**
   * Material waste factor.
   * 0.15 = 15%.
   */
  readonly wasteFactor?: number;

  /**
   * Installation, transport,
   * engineering and contingency percentages.
   */
  readonly overheads?: OverheadConfig;

  /**
   * Discount percentage.
   * 10 = 10%.
   */
  readonly discountPercent?: number;

  /**
   * Tax percentage.
   * 7.5 = 7.5%.
   */
  readonly taxPercent?: number;
}

export interface CostCategoryBreakdown {
  readonly category: CostCategory;
  readonly quantity: number;
  readonly extendedCost: number;
}

export interface CostingResult {
  /**
   * Sum of all line-item extended costs before waste.
   */
  readonly materialSubtotal: number;

  /**
   * MaterialSubtotal × wasteFactor.
   */
  readonly wasteCost: number;

  /**
   * MaterialSubtotal + wasteCost.
   */
  readonly adjustedMaterials: number;

  /**
   * AdjustedMaterials × installationPercent / 100.
   */
  readonly installationCost: number;

  /**
   * AdjustedMaterials × transportPercent / 100.
   */
  readonly transportCost: number;

  /**
   * AdjustedMaterials × engineeringPercent / 100.
   */
  readonly engineeringCost: number;

  /**
   * Installation + transport + engineering.
   */
  readonly overheadsSubtotal: number;

  /**
   * Contingency applied to adjusted materials
   * plus overheads.
   */
  readonly contingencyCost: number;

  /**
   * Contingency base + contingency cost.
   */
  readonly preDiscountTotal: number;

  /**
   * Pre-discount total × discountPercent / 100.
   */
  readonly discountAmount: number;

  /**
   * Pre-discount total - discount amount.
   */
  readonly subtotalAfterDiscount: number;

  /**
   * Subtotal after discount × taxPercent / 100.
   */
  readonly taxAmount: number;

  /**
   * Subtotal after discount + tax amount.
   */
  readonly grandTotal: number;

  /**
   * Cost grouped by category and sorted
   * by descending extended cost.
   */
  readonly categoryBreakdown:
    readonly CostCategoryBreakdown[];

  /**
   * ISO 4217 project currency.
   */
  readonly currency: string;

  readonly warnings: readonly string[];
  readonly errors: readonly string[];
  readonly isValid: boolean;
}