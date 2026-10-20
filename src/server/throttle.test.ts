import { describe, expect, it } from "vitest";
import { createThrottle, ipOf } from "./throttle";

describe("createThrottle", () => {
  it("allows up to the limit, then blocks with a retry time", () => {
    let t = 0;
    const throttle = createThrottle({ limit: 2, windowMs: 10_000, now: () => t });
    expect(throttle.hit("a").ok).toBe(true);
    expect(throttle.hit("a").ok).toBe(true);
    const blocked = throttle.hit("a");
    expect(blocked).toEqual({ ok: false, retryAfter: 10 });
    t = 4_000;
    expect(throttle.hit("a")).toEqual({ ok: false, retryAfter: 6 });
  });

  it("resets after the window", () => {
    let t = 0;
    const throttle = createThrottle({ limit: 1, windowMs: 1_000, now: () => t });
    throttle.hit("a");
    t = 1_000;
    expect(throttle.hit("a").ok).toBe(true);
  });

  it("counts clients separately", () => {
    const throttle = createThrottle({ limit: 1, windowMs: 1_000 });
    throttle.hit("a");
    expect(throttle.hit("b").ok).toBe(true);
  });
});

describe("createThrottle scale", () => {
  it("multiplies the limit, e.g. for end-to-end test runs from one address", () => {
    const throttle = createThrottle({ limit: 1, windowMs: 1_000, scale: 3 });
    expect([throttle.hit("a").ok, throttle.hit("a").ok, throttle.hit("a").ok]).toEqual([
      true,
      true,
      true,
    ]);
    expect(throttle.hit("a").ok).toBe(false);
  });
});

describe("ipOf", () => {
  it("takes the first forwarded address", () => {
    const req = new Request("http://x", { headers: { "x-forwarded-for": "1.2.3.4, 10.0.0.1" } });
    expect(ipOf(req)).toBe("1.2.3.4");
  });
  it("falls back when no address is known", () => {
    expect(ipOf(new Request("http://x"))).toBe("unknown");
  });
});
