/**
 * MejaHub - Order Calculation Engine
 * Tax (PB1), Service Charge, Discount, and Total Calculations
 */

export interface OrderLineItem {
  unitPrice: number;
  quantity: number;
  modifierTotal: number; // Sum of modifier prices per unit
}

export interface DiscountConfig {
  type: "percentage" | "fixed";
  value: number; // percentage (0-100) or fixed amount
}

export interface OrderCalculation {
  subtotal: number;
  discountAmount: number;
  taxableAmount: number;
  taxAmount: number;
  serviceAmount: number;
  totalAmount: number;
}

/**
 * Calculate item subtotal: (unitPrice + modifierTotal) * quantity
 */
export function calculateItemSubtotal(item: OrderLineItem): number {
  return (item.unitPrice + item.modifierTotal) * item.quantity;
}

/**
 * Calculate full order totals.
 *
 * Formula (Indonesian F&B standard):
 *   subtotal      = Σ item subtotals
 *   discount      = based on config (percentage or fixed)
 *   taxableAmount = subtotal - discount
 *   tax (PB1)     = taxableAmount * taxRate / 100
 *   service       = taxableAmount * serviceRate / 100
 *   total         = taxableAmount + tax + service
 */
export function calculateOrderTotal(
  items: OrderLineItem[],
  taxRate: number, // e.g., 10 for 10%
  serviceRate: number, // e.g., 5 for 5%
  discount?: DiscountConfig
): OrderCalculation {
  // 1. Subtotal
  const subtotal = items.reduce(
    (sum, item) => sum + calculateItemSubtotal(item),
    0
  );

  // 2. Discount
  let discountAmount = 0;
  if (discount) {
    if (discount.type === "percentage") {
      discountAmount = Math.round(subtotal * (discount.value / 100));
    } else {
      discountAmount = Math.min(discount.value, subtotal); // Cannot exceed subtotal
    }
  }

  // 3. Taxable amount (after discount)
  const taxableAmount = subtotal - discountAmount;

  // 4. Tax (PB1 - Restaurant Tax)
  const taxAmount = Math.round(taxableAmount * (taxRate / 100));

  // 5. Service Charge
  const serviceAmount = Math.round(taxableAmount * (serviceRate / 100));

  // 6. Grand Total
  const totalAmount = taxableAmount + taxAmount + serviceAmount;

  return {
    subtotal,
    discountAmount,
    taxableAmount,
    taxAmount,
    serviceAmount,
    totalAmount,
  };
}

/**
 * Calculate change for cash payment
 */
export function calculateChange(
  totalAmount: number,
  receivedAmount: number
): number {
  return Math.max(0, receivedAmount - totalAmount);
}

/**
 * Validate split bill amounts equal total
 */
export function validateSplitBill(
  totalAmount: number,
  payments: { amount: number }[]
): { valid: boolean; remaining: number } {
  const paid = payments.reduce((sum, p) => sum + p.amount, 0);
  const remaining = Math.round((totalAmount - paid) * 100) / 100;
  return {
    valid: remaining <= 0,
    remaining: Math.max(0, remaining),
  };
}

/**
 * Calculate suggested cash denominations for quick payment
 */
export function suggestCashDenominations(totalAmount: number): number[] {
  const denominations = [
    1000, 2000, 5000, 10000, 20000, 50000, 100000, 200000, 500000,
  ];

  const suggestions: number[] = [];

  // Exact amount
  suggestions.push(totalAmount);

  // Next round-ups
  for (const denom of denominations) {
    const rounded = Math.ceil(totalAmount / denom) * denom;
    if (rounded > totalAmount && !suggestions.includes(rounded)) {
      suggestions.push(rounded);
    }
  }

  return suggestions.slice(0, 5).sort((a, b) => a - b);
}
