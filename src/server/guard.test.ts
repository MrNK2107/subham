import { describe, expect, it } from "vitest";
import { z } from "zod";
import { fail, readBody, reply } from "./guard";

const schema = z.object({ name: z.string().min(1) });
const post = (
  body: string,
  headers: Record<string, string> = { "content-type": "application/json" },
) => new Request("http://x/api", { method: "POST", body, headers });

describe("readBody", () => {
  it("parses a valid JSON body", async () => {
    const result = await readBody(post('{"name":"Meera"}'), schema);
    expect(result).toEqual({ ok: true, data: { name: "Meera" } });
  });

  it("rejects a non-JSON content type with 415", async () => {
    const result = await readBody(post("name=x", { "content-type": "text/plain" }), schema);
    expect(!result.ok && result.res.status).toBe(415);
  });

  it("rejects bodies over the size limit with 413", async () => {
    const result = await readBody(post(JSON.stringify({ name: "x".repeat(200) })), schema, 100);
    expect(!result.ok && result.res.status).toBe(413);
  });

  it("rejects malformed JSON with 400", async () => {
    const result = await readBody(post("{nope"), schema);
    expect(!result.ok && result.res.status).toBe(400);
  });

  it("names the invalid field without leaking internals", async () => {
    const result = await readBody(post('{"name":""}'), schema);
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.res.status).toBe(400);
      expect((await result.res.json()).error).toMatch(/^name:/);
    }
  });
});

describe("reply / fail", () => {
  it("never lets responses be cached", () => {
    expect(reply({ a: 1 }).headers.get("cache-control")).toBe("no-store");
    expect(fail(500, "x").headers.get("cache-control")).toBe("no-store");
  });
});
