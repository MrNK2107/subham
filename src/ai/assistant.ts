import { z } from "zod";
import { cleanBlueprint } from "@/core/assemble";
import {
  BlueprintSchema,
  BriefSchema,
  IdeaDraftSchema,
  type AiLang,
  type Brief,
  type IdeaDraft,
} from "@/core/types";
import { AiUnavailable, parseJsonText, type AiProvider, type Engine } from "./contracts";
import { forModel } from "./json-schema";
import {
  BLUEPRINT_SYSTEM,
  EXTRACT_SYSTEM,
  blueprintPrompt,
  conversePrompt,
  extractPrompt,
  ideasPrompt,
} from "./prompts";
import { parseCalls, toolDeclarations } from "./tools";

const EXTRACTABLE = BriefSchema.pick({
  type: true,
  title: true,
  city: true,
  date: true,
  guests: true,
  budget: true,
  food: true,
  vibe: true,
  language: true,
});
const IdeasSchema = z.object({ ideas: z.array(IdeaDraftSchema) });

// Schemas are built once; they never change at runtime.
const BLUEPRINT_SCHEMA = forModel(BlueprintSchema);
// Every field is required but nullable: small models skip optional fields, so ask for each one.
const HINTS: Partial<Record<keyof typeof EXTRACTABLE.shape, string>> = {
  date: "Main date as YYYY-MM-DD, or null",
  city: "City or town name, or null",
  guests: "Number of guests, or null",
  budget: "Total budget in whole rupees, or null",
  title: "Short warm name for the celebration",
};
const EXTRACT_SCHEMA = forModel(
  z.object(
    Object.fromEntries(
      Object.entries(EXTRACTABLE.shape).map(([key, field]) => {
        const hint = HINTS[key as keyof typeof HINTS];
        return [key, hint ? field.nullable().describe(hint) : field.nullable()];
      }),
    ),
  ),
);
const IDEAS_SCHEMA = forModel(IdeasSchema);
const TOOLS = toolDeclarations();

/** Shown when the model proposes changes without writing any text. */
const PROPOSAL: Partial<Record<AiLang, string>> = {
  en: "Here's what I'd change. Have a look and apply what you like.",
  hi: "मेरे सुझाए बदलाव ये हैं। देखकर जो ठीक लगे, लागू करें।",
  ta: "நான் பரிந்துரைக்கும் மாற்றங்கள் இவை. பார்த்து பிடித்ததைச் செயல்படுத்துங்கள்.",
  te: "నేను సూచించే మార్పులు ఇవి. చూసి నచ్చినవి వర్తింపజేయండి.",
};

const isLatin = (text: string) => /^[\p{Script=Latin}\p{N}\p{P}\p{S}\s]*$/u.test(text);

/** Replies render as plain text, so remove Markdown emphasis a model may still add. */
const plain = (text: string) =>
  text
    .replace(/(\*\*|__)(.+?)\1/g, "$2")
    .replace(/(^|\s)\*(\S(?:.*?\S)?)\*(?=\s|[.,!?]|$)/gm, "$1$2")
    .trim();

function validIdeas(raw: unknown): IdeaDraft[] {
  return (Array.isArray(raw) ? raw : []).flatMap((item) => {
    const idea = IdeaDraftSchema.safeParse(item);
    return idea.success ? [idea.data] : [];
  });
}

/** The planner, built on any engine. Model output is always validated before it is returned. */
export function createAssistant(engine: Engine): AiProvider {
  return {
    name: engine.name,

    async blueprint(brief, today) {
      const raw = await engine.json({
        system: BLUEPRINT_SYSTEM,
        prompt: blueprintPrompt(brief, today),
        schema: BLUEPRINT_SCHEMA,
        temperature: 0.7,
      });
      const bp = cleanBlueprint(raw);
      if (!bp) throw new AiUnavailable("The AI draft came back incomplete. Please try again.");
      return bp;
    },

    async extractBrief(text, today) {
      const raw = await engine.json({
        system: EXTRACT_SYSTEM,
        prompt: extractPrompt(text, today),
        schema: EXTRACT_SCHEMA,
        temperature: 0.1,
      });
      if (typeof raw !== "object" || raw === null) return {};
      // Keep every field that is valid on its own, so one bad guess doesn't lose the rest.
      const patch: Record<string, unknown> = {};
      for (const [key, field] of Object.entries(EXTRACTABLE.shape)) {
        const value = field.safeParse((raw as Record<string, unknown>)[key]);
        if (value.success) patch[key] = value.data;
      }
      return patch as Partial<Brief>;
    },

    async converse(plan, history) {
      const today = new Date().toISOString().slice(0, 10);
      const res = await engine.tools({
        system: conversePrompt(plan, today),
        history,
        tools: TOOLS,
        temperature: 0.5,
      });
      const changes = parseCalls(res.calls);
      const last = history.at(-1)?.text ?? "";
      const lang = isLatin(last) ? "en" : plan.brief.language;
      const reply = plain(res.text) || (changes.length ? (PROPOSAL[lang] ?? PROPOSAL.en!) : "");
      if (!reply) throw new AiUnavailable("The assistant didn't have an answer. Try rephrasing.");
      return { reply, changes };
    },

    async ideas(brief) {
      if (engine.grounded) {
        try {
          // Grounding can't be combined with a response schema, so the JSON is read from text.
          const res = await engine.grounded({ prompt: ideasPrompt(brief, true) });
          const ideas = validIdeas(
            parseJsonText(res.text.slice(res.text.indexOf("["), res.text.lastIndexOf("]") + 1)),
          );
          if (ideas.length) return { ideas, sources: res.sources };
        } catch (error) {
          if (!(error instanceof AiUnavailable)) throw error;
          // Search grounding has its own quota; fall back to ungrounded structured ideas.
        }
      }
      const raw = await engine.json({
        system: BLUEPRINT_SYSTEM,
        prompt: ideasPrompt(brief, false),
        schema: IDEAS_SCHEMA,
        temperature: 0.9,
      });
      const ideas = validIdeas((raw as { ideas?: unknown } | null)?.ideas);
      if (!ideas.length) throw new AiUnavailable("No ideas came back. Please try again.");
      return { ideas, sources: [] };
    },
  };
}
