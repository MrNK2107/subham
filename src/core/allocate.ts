export interface Weight {
  key: string;
  weight: number;
}

/**
 * Splits `total` rupees across keys in proportion to their weights, in whole rupees that add up
 * to exactly `total` (largest-remainder method). Weights need not sum to 100; invalid weights are
 * skipped. Duplicate keys are merged.
 */
export function allocate(total: number, weights: Weight[]): Map<string, number> {
  if (!Number.isInteger(total) || total <= 0)
    throw new Error("Total must be a positive whole number");

  const merged = new Map<string, number>();
  for (const { key, weight } of weights) {
    if (!Number.isFinite(weight) || weight <= 0) continue;
    merged.set(key, (merged.get(key) ?? 0) + weight);
  }
  if (merged.size === 0) throw new Error("Nothing to allocate to");

  const sum = [...merged.values()].reduce((a, b) => a + b, 0);
  const shares = [...merged].map(([key, weight]) => {
    const exact = (total * weight) / sum;
    return { key, floor: Math.floor(exact), remainder: exact - Math.floor(exact) };
  });

  let left = total - shares.reduce((acc, s) => acc + s.floor, 0);
  const byRemainder = [...shares].sort((a, b) => b.remainder - a.remainder);
  for (const share of byRemainder) {
    if (left === 0) break;
    share.floor += 1;
    left -= 1;
  }
  return new Map(shares.map((s) => [s.key, s.floor]));
}
