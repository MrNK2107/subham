import { describe, expect, it, vi } from "vitest";
import { geminiEngine } from "./gemini";
import { ollamaEngine } from "./ollama";
import { AiUnavailable, pickProvider } from "./provider";

const req = { system: "s", prompt: "p", schema: { type: "object" }, temperature: 0.2 };

describe("geminiEngine", () => {
  it("moves to the next model when one is overloaded", async () => {
    const generate = vi
      .fn()
      .mockRejectedValueOnce(Object.assign(new Error("busy"), { status: 503 }))
      .mockResolvedValueOnce({ text: '{"ok":true}' });
    const engine = geminiEngine(generate, ["a", "b"]);
    expect(await engine.json(req)).toEqual({ ok: true });
    expect(generate.mock.calls.map((c) => c[0].model)).toEqual(["a", "b"]);
  });

  it("does not retry other models on a bad request", async () => {
    const generate = vi.fn().mockRejectedValue(Object.assign(new Error("bad"), { status: 400 }));
    await expect(geminiEngine(generate, ["a", "b"]).json(req)).rejects.toBeInstanceOf(
      AiUnavailable,
    );
    expect(generate).toHaveBeenCalledTimes(1);
  });

  it("returns function calls and grounding sources", async () => {
    const generate = vi.fn().mockResolvedValue({
      text: "ok",
      functionCalls: [{ name: "toggleTask", args: { id: "t1" } }],
      candidates: [
        {
          groundingMetadata: {
            groundingChunks: [
              { web: { uri: "https://a.in/x", title: "A" } },
              { web: { uri: "https://a.in/x", title: "A" } },
              { web: { uri: "javascript:alert(1)", title: "bad" } },
            ],
          },
        },
      ],
    });
    const engine = geminiEngine(generate, ["a"]);
    expect(await engine.tools({ system: "s", history: [], tools: [], temperature: 0 })).toEqual({
      text: "ok",
      calls: [{ name: "toggleTask", args: { id: "t1" } }],
    });
    expect((await engine.grounded!({ prompt: "p" })).sources).toEqual([
      { url: "https://a.in/x", title: "A" },
    ]);
  });
});

describe("ollamaEngine", () => {
  const ok = (message: object) =>
    vi.fn().mockResolvedValue(new Response(JSON.stringify({ message }), { status: 200 }));

  it("parses structured JSON content", async () => {
    const fetcher = ok({ content: '{"a":1}' });
    const engine = ollamaEngine({ url: "http://o", model: "gemma4:latest", fetcher });
    expect(await engine.json(req)).toEqual({ a: 1 });
    const body = JSON.parse(fetcher.mock.calls[0]![1].body);
    expect(body).toMatchObject({
      model: "gemma4:latest",
      stream: false,
      format: { type: "object" },
    });
  });

  it("returns tool calls", async () => {
    const engine = ollamaEngine({
      url: "http://o",
      model: "m",
      fetcher: ok({
        content: "Done",
        tool_calls: [{ function: { name: "toggleTask", arguments: { id: "t2" } } }],
      }),
    });
    expect(await engine.tools({ system: "s", history: [], tools: [], temperature: 0 })).toEqual({
      text: "Done",
      calls: [{ name: "toggleTask", args: { id: "t2" } }],
    });
  });

  it("reports an unreachable server or prose answer as unavailable", async () => {
    const down = ollamaEngine({
      url: "http://o",
      model: "m",
      fetcher: vi.fn().mockRejectedValue(new TypeError("fetch failed")),
    });
    await expect(down.json(req)).rejects.toBeInstanceOf(AiUnavailable);
    const prose = ollamaEngine({
      url: "http://o",
      model: "m",
      fetcher: ok({ content: "Sure! Here is a plan" }),
    });
    await expect(prose.json(req)).rejects.toBeInstanceOf(AiUnavailable);
  });
});

describe("pickProvider", () => {
  it("chooses by AI_PROVIDER, then by available credentials", () => {
    expect(pickProvider({ AI_PROVIDER: "mock" })?.name).toBe("mock");
    expect(pickProvider({ GEMINI_API_KEY: "k" })?.name).toBe("gemini");
    expect(pickProvider({ OLLAMA_URL: "http://localhost:11434" })?.name).toBe("ollama");
    expect(pickProvider({ AI_PROVIDER: "ollama" })?.name).toBe("ollama");
    expect(pickProvider({})).toBeNull();
  });
});
