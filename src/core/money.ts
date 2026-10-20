const UNITS: Record<string, number> = {
  k: 1_000,
  thousand: 1_000,
  l: 100_000,
  lac: 100_000,
  lacs: 100_000,
  lakh: 100_000,
  lakhs: 100_000,
  cr: 10_000_000,
  crore: 10_000_000,
  crores: 10_000_000,
};

/**
 * Reads amounts the way people in India type them: "2.5 lakh", "25k", "₹3,00,000", "1 cr".
 * Returns whole rupees, or null when the text isn't an amount.
 */
export function parseAmount(input: string): number | null {
  const cleaned = input
    .toLowerCase()
    .replace(/₹|\brs\.?|\binr\b|,/g, "")
    .trim();
  const match = /^(\d+(?:\.\d+)?)\s*([a-z]+)?$/.exec(cleaned);
  if (!match) return null;
  const unit = match[2] ? UNITS[match[2]] : 1;
  if (!unit) return null;
  return Math.round(Number(match[1]) * unit);
}

const inr = new Intl.NumberFormat("en-IN", {
  style: "currency",
  currency: "INR",
  maximumFractionDigits: 0,
});

/** "₹2,50,000" — Indian digit grouping, no paise. */
export function formatINR(amount: number): string {
  return inr.format(amount);
}
