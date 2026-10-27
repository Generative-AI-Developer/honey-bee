// All amounts are integer paisa (Rs 1 = 100 paisa). Never use floats for money.

export const PAISA_PER_RUPEE = 100;

export function rupees(amount: number): number {
  return Math.round(amount * PAISA_PER_RUPEE);
}

export function toRupees(paisa: number): number {
  return paisa / PAISA_PER_RUPEE;
}

const formatter = new Intl.NumberFormat("en-PK", { maximumFractionDigits: 0 });

/** Formats paisa as "Rs 3,200". Shop prices are whole rupees, so decimals are dropped. */
export function formatPrice(paisa: number): string {
  const sign = paisa < 0 ? "−" : "";
  return `${sign}Rs ${formatter.format(Math.round(Math.abs(paisa) / PAISA_PER_RUPEE))}`;
}

/** Percentage saved between the original and current price, rounded down. */
export function percentOff(price: number, compareAt?: number | null): number | null {
  if (!compareAt || compareAt <= price) return null;
  return Math.floor(((compareAt - price) / compareAt) * 100);
}
