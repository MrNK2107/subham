// @vitest-environment node
import { describe, expect, it } from "vitest";
import { assemblePlan } from "@/core/assemble";
import { applyChange } from "@/core/changes";
import { pickProvider } from "./provider";
import { birthdayBrief, TODAY, weddingBrief } from "@/test/fixtures";

/**
 * Talks to a real model. Opt in with LIVE_AI=1 plus provider settings, e.g.
 *   LIVE_AI=1 AI_PROVIDER=ollama OLLAMA_URL=http://localhost:11434 npx vitest run src/ai/live
 */
const live = process.env.LIVE_AI === "1";

describe.skipIf(!live)("live model", () => {
  const ai = pickProvider()!;

  it(
    "drafts a Tamil wedding plan that assembles into a valid plan",
    { timeout: 300_000 },
    async () => {
      const brief = { ...weddingBrief, language: "ta" as const };
      const bp = await ai.blueprint(brief, TODAY);
      const plan = assemblePlan(brief, bp, { id: "live", today: TODAY, now: new Date() });
      expect(plan.budget.reduce((a, l) => a + l.allocated, 0)).toBe(brief.budget);
      console.log(JSON.stringify(bp, null, 1).slice(0, 1500));
    },
  );

  it("reads a Telugu-English description", { timeout: 120_000 }, async () => {
    const brief = await ai.extractBrief(
      "Na kuthuru Sahasra 1st birthday, Vijayawada lo, 80 mandi guests, budget 1.5 lakh, December 12",
      TODAY,
    );
    console.log(brief);
    expect(brief.budget).toBe(150_000);
  });

  it("proposes an applicable change", { timeout: 180_000 }, async () => {
    const plan = assemblePlan(
      birthdayBrief,
      (await import("@/core/templates")).templateBlueprint(birthdayBrief),
      {
        id: "live",
        today: TODAY,
        now: new Date(),
      },
    );
    const out = await ai.converse(plan, [
      { role: "user", text: "Move 5000 rupees from the venue budget to food & cake please" },
    ]);
    console.log(out);
    expect(out.reply.length).toBeGreaterThan(0);
    for (const change of out.changes) applyChange(plan, change);
  });
});
