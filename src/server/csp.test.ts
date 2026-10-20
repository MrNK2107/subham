import { describe, expect, it } from "vitest";
import { buildPolicy } from "./csp";

describe("buildPolicy", () => {
  const prod = buildPolicy("abc", { dev: false });

  it("allows scripts only by nonce in production", () => {
    expect(prod).toContain("'nonce-abc'");
    expect(prod).toContain("'strict-dynamic'");
    expect(prod).not.toContain("unsafe-inline");
    expect(prod).not.toContain("unsafe-eval");
  });

  it("blocks framing and plugins", () => {
    expect(prod).toContain("frame-ancestors 'none'");
    expect(prod).toContain("object-src 'none'");
  });

  it("relaxes eval only in development", () => {
    expect(buildPolicy("abc", { dev: true })).toContain("'unsafe-eval'");
  });

  it("allows the Firebase auth domain to be framed for sign-in", () => {
    expect(buildPolicy("n", { dev: false, authDomain: "x.firebaseapp.com" })).toContain(
      "https://x.firebaseapp.com",
    );
  });
});
