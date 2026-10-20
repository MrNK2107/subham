import { describe, expect, it } from "vitest";
import { formatINR, parseAmount } from "./money";

describe("parseAmount", () => {
  it.each([
    ["2.5 lakh", 250_000],
    ["2.5 lakhs", 250_000],
    ["3L", 300_000],
    ["25k", 25_000],
    ["₹3,00,000", 300_000],
    ["1 crore", 10_000_000],
    ["1.2 cr", 12_000_000],
    ["150000", 150_000],
    ["Rs. 80,000", 80_000],
  ])("reads %s as %d", (input, expected) => {
    expect(parseAmount(input)).toBe(expected);
  });

  it.each(["", "abc", "lakh", "-5000", "2..5 lakh"])("rejects %j", (input) => {
    expect(parseAmount(input)).toBeNull();
  });
});

describe("formatINR", () => {
  it("uses Indian digit grouping", () => {
    expect(formatINR(250_000)).toBe("₹2,50,000");
    expect(formatINR(10_000_000)).toBe("₹1,00,00,000");
    expect(formatINR(999)).toBe("₹999");
  });
});
