import { tierOf } from "@/core/cities";
import { parseAmount } from "@/core/money";
import { presetFunctions } from "@/core/presets";
import {
  BriefSchema,
  type AiLang,
  type Brief,
  type EventType,
  type Tier,
  type UiLang,
} from "@/core/types";
import type { MessageKey } from "@/i18n/en";

/** The wizard's form state: text inputs stay strings until the brief is built. */
export interface Draft {
  type: EventType | null;
  functions: string[];
  title: string;
  city: string;
  tier: Tier;
  /** Whether the person chose the tier; otherwise it follows the city. */
  tierChosen: boolean;
  date: string;
  guests: string;
  budget: string;
  food: Brief["food"];
  vibe: string;
  language: AiLang;
}

export type DraftField = keyof Draft;
export type DraftErrors = Partial<Record<DraftField, MessageKey>>;

export function emptyDraft(lang: UiLang): Draft {
  return {
    type: null,
    functions: [],
    title: "",
    city: "",
    tier: "tier3",
    tierChosen: false,
    date: "",
    guests: "",
    budget: "",
    food: "veg",
    vibe: "",
    language: lang,
  };
}

export function withType(draft: Draft, type: EventType, lang: UiLang): Draft {
  return { ...draft, type, functions: presetFunctions(type, lang) };
}

export function withCity(draft: Draft, city: string): Draft {
  return { ...draft, city, tier: draft.tierChosen ? draft.tier : tierOf(city) };
}

const guestsOf = (value: string) => (/^\d+$/.test(value.trim()) ? Number(value) : NaN);

/** Errors for one wizard step, as message keys. */
export function validateStep(draft: Draft, step: 1 | 2 | 3, today: string): DraftErrors {
  const errors: DraftErrors = {};
  if (step === 1 && !draft.type) errors.type = "error.required";
  if (step === 2 && draft.functions.length === 0) errors.functions = "error.functions";
  if (step === 3) {
    if (!draft.title.trim()) errors.title = "error.required";
    if (!draft.city.trim()) errors.city = "error.required";
    if (!/^\d{4}-\d{2}-\d{2}$/.test(draft.date) || draft.date < today) errors.date = "error.date";
    const guests = guestsOf(draft.guests);
    if (!(guests >= 1 && guests <= 5000)) errors.guests = "error.guests";
    const budget = parseAmount(draft.budget);
    if (budget === null || budget < 5_000 || budget > 100_000_000) errors.budget = "error.budget";
  }
  return errors;
}

/** The validated brief for the API. Call only after every step validates. */
export function toBrief(draft: Draft): Brief {
  return BriefSchema.parse({
    type: draft.type,
    title: draft.title.trim(),
    city: draft.city.trim(),
    tier: draft.tierChosen ? draft.tier : tierOf(draft.city),
    date: draft.date,
    guests: guestsOf(draft.guests),
    budget: parseAmount(draft.budget),
    food: draft.food,
    vibe: draft.vibe.trim(),
    functions: draft.functions,
    language: draft.language,
  });
}

/** A draft prefilled from what the AI understood of a one-line description. */
export function fromPatch(patch: Partial<Brief>, lang: UiLang): Draft {
  let draft = emptyDraft(lang);
  if (patch.type) draft = withType(draft, patch.type, lang);
  if (patch.city) draft = withCity(draft, patch.city);
  return {
    ...draft,
    title: patch.title ?? "",
    date: patch.date ?? "",
    guests: patch.guests ? String(patch.guests) : "",
    budget: patch.budget ? String(patch.budget) : "",
    food: patch.food ?? draft.food,
    vibe: patch.vibe ?? "",
    language: patch.language ?? lang,
  };
}
