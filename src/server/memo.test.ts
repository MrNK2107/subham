import { describe, expect, it } from "vitest";
import { createMemo } from "./memo";

describe("createMemo", () => {
  it("returns stored values until they expire", () => {
    let t = 0;
    const memo = createMemo<number>({ ttlMs: 100, max: 10, now: () => t });
    memo.set("k", 1);
    t = 99;
    expect(memo.get("k")).toBe(1);
    t = 100;
    expect(memo.get("k")).toBeUndefined();
  });

  it("evicts the oldest entry past the size limit", () => {
    const memo = createMemo<number>({ ttlMs: 1_000, max: 2 });
    memo.set("a", 1);
    memo.set("b", 2);
    memo.set("c", 3);
    expect(memo.get("a")).toBeUndefined();
    expect(memo.get("c")).toBe(3);
  });
});
