// @vitest-environment node
import { beforeEach, describe, expect, it, vi } from "vitest";
import { AiUnavailable, type AiProvider } from "@/ai/contracts";
import { assemblePlan } from "@/core/assemble";
import { templateBlueprint } from "@/core/templates";
import { birthdayBrief, TODAY, weddingBrief } from "@/test/fixtures";

const provider = {
  name: "ollama",
  blueprint: vi.fn(),
  extractBrief: vi.fn(),
  converse: vi.fn(),
  ideas: vi.fn(),
} satisfies AiProvider;
let current: AiProvider | null = provider;

vi.mock("@/ai/provider", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/ai/provider")>()),
  pickProvider: () => current,
}));

const post = (body: unknown, ip = "1.1.1.1") =>
  new Request("http://localhost/api", {
    method: "POST",
    headers: { "content-type": "application/json", "x-forwarded-for": ip },
    body: JSON.stringify(body),
  });

let ipCounter = 0;
const freshIp = () => `10.0.0.${++ipCounter}`;

beforeEach(() => {
  vi.clearAllMocks();
  current = provider;
});

describe("POST /api/plan", async () => {
  const { POST } = await import("./plan/route");

  it("drafts with the AI provider", async () => {
    provider.blueprint.mockResolvedValue(templateBlueprint(weddingBrief));
    const res = await POST(post({ brief: weddingBrief, today: TODAY }, freshIp()));
    const body = await res.json();
    expect(res.status).toBe(200);
    expect(body.source).toBe("ollama");
    expect(
      body.plan.budget.reduce((a: number, l: { allocated: number }) => a + l.allocated, 0),
    ).toBe(weddingBrief.budget);
  });

  it("falls back to a template with a notice when the AI is unavailable", async () => {
    provider.blueprint.mockRejectedValue(new AiUnavailable("down"));
    const res = await POST(post({ brief: { ...weddingBrief, title: "Fallback" } }, freshIp()));
    const body = await res.json();
    expect(res.status).toBe(200);
    expect(body.source).toBe("template");
    expect(body.notice).toMatch(/down/);
    expect(body.plan.tasks.length).toBeGreaterThan(0);
  });

  it("uses a template when no provider is configured", async () => {
    current = null;
    const body = await (await POST(post({ brief: birthdayBrief }, freshIp()))).json();
    expect(body.source).toBe("template");
  });

  it("serves an identical request from cache", async () => {
    provider.blueprint.mockResolvedValue(templateBlueprint(birthdayBrief));
    const brief = { ...birthdayBrief, title: "Cached party" };
    await POST(post({ brief, today: TODAY }, freshIp()));
    await POST(post({ brief, today: TODAY }, freshIp()));
    expect(provider.blueprint).toHaveBeenCalledTimes(1);
  });

  it("rejects an invalid brief", async () => {
    const res = await POST(post({ brief: { ...weddingBrief, guests: 0 } }, freshIp()));
    expect(res.status).toBe(400);
    expect((await res.json()).error).toMatch(/guests/);
  });

  it("rate limits a busy client", async () => {
    provider.blueprint.mockResolvedValue(templateBlueprint(birthdayBrief));
    const ip = freshIp();
    let last: Response | undefined;
    for (let i = 0; i < 8; i++) last = await POST(post({ brief: birthdayBrief }, ip));
    expect(last!.status).toBe(429);
    expect(last!.headers.get("retry-after")).toBeTruthy();
  });
});

describe("POST /api/brief", async () => {
  const { POST } = await import("./brief/route");

  it("returns extracted fields", async () => {
    provider.extractBrief.mockResolvedValue({ type: "birthday", budget: 80000 });
    const res = await POST(post({ text: "Birthday for 50 people, 80k", today: TODAY }, freshIp()));
    expect(await res.json()).toEqual({ brief: { type: "birthday", budget: 80000 } });
  });

  it("explains when quick-fill isn't available", async () => {
    current = null;
    const res = await POST(post({ text: "a wedding" }, freshIp()));
    expect(res.status).toBe(503);
  });
});

describe("POST /api/assistant", async () => {
  const { POST } = await import("./assistant/route");
  const plan = assemblePlan(weddingBrief, templateBlueprint(weddingBrief), {
    id: "p1",
    today: TODAY,
    now: new Date(),
  });

  it("returns only the changes that can apply to the plan", async () => {
    provider.converse.mockResolvedValue({
      reply: "Done",
      changes: [
        { op: "toggleTask", id: "t1" },
        { op: "toggleTask", id: "nope" },
      ],
    });
    const res = await POST(post({ plan, messages: [{ role: "user", text: "hi" }] }, freshIp()));
    expect(await res.json()).toEqual({ reply: "Done", changes: [{ op: "toggleTask", id: "t1" }] });
  });

  it("returns 503 with a readable message when the AI fails", async () => {
    provider.converse.mockRejectedValue(new AiUnavailable("Model is resting"));
    const res = await POST(post({ plan, messages: [{ role: "user", text: "hi" }] }, freshIp()));
    expect(res.status).toBe(503);
    expect((await res.json()).error).toBe("Model is resting");
  });
});

describe("POST /api/ideas", async () => {
  const { POST } = await import("./ideas/route");

  it("returns ideas with sources", async () => {
    const ideas = [{ kind: "food", title: "Pongal", description: "Sakkarai pongal counter" }];
    provider.ideas.mockResolvedValue({ ideas, sources: [] });
    const res = await POST(post({ brief: { ...weddingBrief, title: "Ideas A" } }, freshIp()));
    expect(await res.json()).toEqual({ ideas, sources: [], source: "ollama" });
  });

  it("falls back to starter ideas when the AI fails", async () => {
    provider.ideas.mockRejectedValue(new AiUnavailable("busy"));
    const res = await POST(post({ brief: { ...weddingBrief, title: "Ideas B" } }, freshIp()));
    const body = await res.json();
    expect(body.source).toBe("template");
    expect(body.ideas.length).toBeGreaterThan(0);
  });
});

describe("GET /api/health", async () => {
  const { GET } = await import("./health/route");
  it("reports the active provider", async () => {
    expect(await GET().json()).toEqual({ ok: true, provider: "ollama" });
  });
});
