/**
 * Precise currency & mathematical arithmetic helpers.
 * Prevents JavaScript floating-point inaccuracies (e.g. 0.1 + 0.2 = 0.30000000000000004)
 * by computing with integer cents.
 */

/**
 * Converts a dollar amount to cents (integer)
 */
export function toCents(dollars: number | string): number {
  if (typeof dollars === 'string') {
    const cleanStr = dollars.replace(/[^0-9.-]/g, '');
    const num = parseFloat(cleanStr);
    if (isNaN(num)) return 0;
    return Math.round(num * 100);
  }
  if (isNaN(dollars)) return 0;
  return Math.round(dollars * 100);
}

/**
 * Converts cents (integer) back to dollar number
 */
export function fromCents(cents: number): number {
  return cents / 100;
}

/**
 * Sums an array of items by their prices in cents to guarantee exact precision
 */
export function calculateTotal(items: Array<{ price: number }>): number {
  const totalCents = items.reduce((acc, item) => {
    return acc + toCents(item.price);
  }, 0);
  return fromCents(totalCents);
}

/**
 * Formats a number or string into a clean currency string: "$28.50"
 */
export function formatCurrency(amount: number | string): string {
  const num = typeof amount === 'string' ? parseFloat(amount) || 0 : amount;
  return `$${num.toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

/**
 * Formats just the number portion: "28.50"
 */
export function formatAmountNumber(amount: number | string): string {
  const num = typeof amount === 'string' ? parseFloat(amount) || 0 : amount;
  return num.toFixed(2);
}

/**
 * Cleans user input in real-time when typing in a price field.
 * Allows valid numbers with up to 2 decimal places.
 */
export function sanitizePriceInput(input: string): string {
  // Remove any character that is not a digit or decimal point
  let cleaned = input.replace(/[^0-9.]/g, '');
  
  // Allow only one decimal point
  const parts = cleaned.split('.');
  if (parts.length > 2) {
    cleaned = `${parts[0]}.${parts.slice(1).join('')}`;
  }
  
  // Limit to 2 decimal places if decimal exists
  if (parts.length === 2 && parts[1].length > 2) {
    cleaned = `${parts[0]}.${parts[1].slice(0, 2)}`;
  }
  
  return cleaned;
}
