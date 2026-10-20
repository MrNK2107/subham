import { describe, expect, it, vi } from "vitest";
import { createAssistant } from "./assistant";
import { AiUnavailable, type Engine } from "./provider";
import { assemblePlan } from "@/core/assemble";
import { templateBlueprint } from "@/core/templates";
import { TODAY, weddingBrief } from "@/test/fixtures";

const plan = assemblePlan(weddingBrief, templateBlueprint(weddingBrief), {
  id: "p1",
  today: TODAY,
  now: new Date(),
});

function engine(over: Partial<Engine>): Engine {
  return {
    name: "ollama",
    json: vi.fn(async () => ({})),
    tools: vi.fn(async () => ({ text: "", calls: [] })),
    ...over,
  };
}

describe("createAssistant.blueprint", () => {
  it("returns the cleaned blueprint", async () => {
    const bp = templateBlueprint(weddingBrief);
    const ai = createAssistant(engine({ json: async () => bp }));
    expect((await ai.blueprint(weddingBrief, TODAY)).budget.length).toBe(bp.budget.length);
  });

  it("treats an unusable answer as unavailable", async () => {
    const ai = createAssistant(engine({ json: async () => ({ budget: [] }) }));
    await expect(ai.blueprint(weddingBrief, TODAY)).rejects.toBeInstanceOf(AiUnavailable);
  });
});

describe("createAssistant.extractBrief", () => {
  it("keeps each field that validates and drops the rest", async () => {
    const ai = createAssistant(
      engine({
        json: async () => ({
          type: "birthday",
          city: "Madurai",
          guests: -3,
          budget: 80000,
          food: "pizza",
        }),
      }),
    );
    expect(await ai.extractBrief("…", TODAY)).toEqual({
      type: "birthday",
      city: "Madurai",
      budget: 80000,
    });
  });
});

describe("createAssistant.converse", () => {
  it("returns the reply with validated changes", async () => {
    const ai = createAssistant(
      engine({
        tools: async () => ({
          text: "Moving a little to catering.",
          calls: [
            { name: "moveBudget", args: { from: "b1", to: "b2", amount: 1000 } },
            { name: "hack", args: {} },
          ],
        }),
      }),
    );
    const out = await ai.converse(plan, [{ role: "user", text: "rebalance please" }]);
    expect(out.reply).toBe("Moving a little to catering.");
    expect(out.changes).toEqual([{ op: "moveBudget", from: "b1", to: "b2", amount: 1000 }]);
  });

  it("writes a short reply when the model only proposes changes", async () => {
    const ai = createAssistant(
      engine({
        tools: async () => ({ text: "", calls: [{ name: "toggleTask", args: { id: "t1" } }] }),
      }),
    );
    const out = await ai.converse(plan, [{ role: "user", text: "mark the first task done" }]);
    expect(out.reply.length).toBeGreaterThan(0);
  });

  it("strips markdown emphasis from replies", async () => {
    const ai = createAssistant(
      engine({ tools: async () => ({ text: "Book the **venue** first.", calls: [] }) }),
    );
    expect((await ai.converse(plan, [{ role: "user", text: "?" }])).reply).toBe(
      "Book the venue first.",
    );
  });
});

describe("createAssistant.ideas", () => {
  const idea = {
    kind: "decor",
    title: "Kolam entrance",
    description: "Rice-flour kolam at the gate",
  };

  it("prefers grounded ideas with sources", async () => {
    const ai = createAssistant(
      engine({
        grounded: async () => ({
          text: `Here you go: [${JSON.stringify(idea)}]`,
          sources: [{ url: "https://example.org", title: "Example" }],
        }),
      }),
    );
    const out = await ai.ideas(weddingBrief);
    expect(out.ideas).toEqual([idea]);
    expect(out.sources).toHaveLength(1);
  });

  it("falls back to structured ideas when grounding fails", async () => {
    const ai = createAssistant(
      engine({
        grounded: async () => {
          throw new AiUnavailable("quota");
        },
        json: async () => ({ ideas: [idea] }),
      }),
    );
    expect(await ai.ideas(weddingBrief)).toEqual({ ideas: [idea], sources: [] });
  });
});
