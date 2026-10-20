import { describe, expect, it } from "vitest";
import { tierOf } from "./cities";

describe("tierOf", () => {
  it("recognises metros regardless of case and spacing", () => {
    expect(tierOf("chennai")).toBe("metro");
    expect(tierOf("  Bengaluru ")).toBe("metro");
    expect(tierOf("Bangalore")).toBe("metro");
  });
  it("recognises tier-2 cities", () => {
    expect(tierOf("Coimbatore")).toBe("tier2");
    expect(tierOf("Vijayawada")).toBe("tier2");
  });
  it("treats unknown towns as tier-3", () => {
    expect(tierOf("Karaikudi")).toBe("tier3");
  });
});
