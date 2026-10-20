import { expect, test } from "@playwright/test";

test("pages send a nonce-based CSP and hardening headers", async ({ request }) => {
  const res = await request.get("/");
  const headers = res.headers();
  const csp = headers["content-security-policy"] ?? "";
  expect(csp).toMatch(/script-src 'self' 'nonce-[A-Za-z0-9+/=]+' 'strict-dynamic'/);
  expect(csp).not.toContain("unsafe-inline");
  expect(csp).not.toContain("unsafe-eval");
  expect(csp).toContain("frame-ancestors 'none'");
  expect(headers["x-frame-options"]).toBe("DENY");
  expect(headers["x-content-type-options"]).toBe("nosniff");
  expect(headers["strict-transport-security"]).toContain("max-age=");
  expect(headers["x-powered-by"]).toBeUndefined();
});

test("each request gets a fresh nonce", async ({ request }) => {
  const nonce = async () =>
    /'nonce-([^']+)'/.exec(
      (await request.get("/")).headers()["content-security-policy"] ?? "",
    )?.[1];
  expect(await nonce()).not.toBe(await nonce());
});

test("the page runs with no CSP violations", async ({ page }) => {
  const violations: string[] = [];
  page.on("console", (msg) => {
    if (/Content Security Policy|Refused to/i.test(msg.text())) violations.push(msg.text());
  });
  await page.goto("/");
  await page.goto("/plan/new");
  expect(violations).toEqual([]);
});

test("API rejects non-JSON, oversized and invalid requests", async ({ request }) => {
  expect(
    (
      await request.post("/api/plan", { data: "x", headers: { "content-type": "text/plain" } })
    ).status(),
  ).toBe(415);
  expect((await request.post("/api/brief", { data: { text: "x".repeat(70_000) } })).status()).toBe(
    413,
  );
  const invalid = await request.post("/api/plan", { data: { brief: { type: "party" } } });
  expect(invalid.status()).toBe(400);
  expect(await invalid.json()).toEqual({ error: expect.stringMatching(/^brief\./) });
});

test("health check reports the AI backend", async ({ request }) => {
  expect(await (await request.get("/api/health")).json()).toEqual({ ok: true, provider: "mock" });
});
