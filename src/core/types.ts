import { z } from "zod";

/** Languages the UI is fully translated into. */
export const UI_LANGS = ["en", "hi", "ta", "te"] as const;
export type UiLang = (typeof UI_LANGS)[number];

/** Languages the AI writes plans and replies in, with their names and BCP-47 tags. */
export const AI_LANGS = {
  en: { name: "English", native: "English", bcp47: "en-IN" },
  hi: { name: "Hindi", native: "हिन्दी", bcp47: "hi-IN" },
  ta: { name: "Tamil", native: "தமிழ்", bcp47: "ta-IN" },
  te: { name: "Telugu", native: "తెలుగు", bcp47: "te-IN" },
  kn: { name: "Kannada", native: "ಕನ್ನಡ", bcp47: "kn-IN" },
  ml: { name: "Malayalam", native: "മലയാളം", bcp47: "ml-IN" },
  bn: { name: "Bengali", native: "বাংলা", bcp47: "bn-IN" },
  mr: { name: "Marathi", native: "मराठी", bcp47: "mr-IN" },
  gu: { name: "Gujarati", native: "ગુજરાતી", bcp47: "gu-IN" },
  pa: { name: "Punjabi", native: "ਪੰਜਾਬੀ", bcp47: "pa-IN" },
} as const;
export type AiLang = keyof typeof AI_LANGS;
const AI_LANG_CODES = Object.keys(AI_LANGS) as [AiLang, ...AiLang[]];

export const EVENT_TYPES = ["wedding", "birthday", "community", "festival"] as const;
export const EventTypeSchema = z.enum(EVENT_TYPES);
export type EventType = z.infer<typeof EventTypeSchema>;

export const TIERS = ["metro", "tier2", "tier3"] as const;
export type Tier = (typeof TIERS)[number];

export const FOODS = ["veg", "jain", "mixed"] as const;
export const IDEA_KINDS = ["theme", "decor", "food", "activity", "gift"] as const;
export const VENDOR_STATUSES = ["todo", "contacted", "booked"] as const;

const isoDate = z.iso.date();
const hhmm = z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/, "Use 24-hour HH:MM");
const text = (max: number) => z.string().trim().min(1).max(max);
const id = z.string().min(1).max(64);

export const BriefSchema = z.object({
  type: EventTypeSchema,
  title: text(80),
  city: text(60),
  tier: z.enum(TIERS),
  date: isoDate,
  guests: z.int().min(1).max(5000),
  budget: z.int().min(5_000).max(100_000_000),
  food: z.enum(FOODS),
  vibe: z.string().trim().max(80),
  functions: z.array(text(40)).min(1).max(8),
  language: z.enum(AI_LANG_CODES),
});
export type Brief = z.infer<typeof BriefSchema>;

// ---- What the AI returns: intent, not final numbers or dates ----

export const BlueprintFunctionSchema = z.object({
  name: text(40),
  /** Days relative to the main event date (negative = before). */
  dayOffset: z.int().min(-30).max(2),
  start: hhmm,
});
export const BlueprintBudgetSchema = z.object({
  fn: text(40),
  category: text(40),
  percent: z.number().positive().max(100),
});
export const BlueprintTaskSchema = z.object({
  title: text(120),
  daysBefore: z.int().min(0).max(540),
  fn: text(40).optional(),
});
export const BlueprintRunSchema = z.object({ fn: text(40), time: hhmm, activity: text(120) });
export const BlueprintVendorSchema = z.object({
  category: text(40),
  fn: text(40).optional(),
  questions: z.array(text(200)).max(5),
});
export const IdeaDraftSchema = z.object({
  kind: z.enum(IDEA_KINDS),
  title: text(80),
  description: text(400),
});
export type IdeaDraft = z.infer<typeof IdeaDraftSchema>;

export const BlueprintSchema = z.object({
  functions: z.array(BlueprintFunctionSchema).max(8),
  budget: z.array(BlueprintBudgetSchema).min(1).max(40),
  tasks: z.array(BlueprintTaskSchema).max(30),
  runSheet: z.array(BlueprintRunSchema).max(40),
  vendors: z.array(BlueprintVendorSchema).max(15),
  ideas: z.array(IdeaDraftSchema).max(10),
});
export type Blueprint = z.infer<typeof BlueprintSchema>;

// ---- The plan the person works with ----

export const FunctionSchema = z.object({ id, name: text(40), date: isoDate, start: hhmm });
export const BudgetLineSchema = z.object({
  id,
  fnId: id,
  category: text(40),
  allocated: z.int().min(0),
  spent: z.int().min(0),
});
export const TaskSchema = z.object({
  id,
  title: text(120),
  due: isoDate,
  done: z.boolean(),
  fnId: id.optional(),
});
export const RunItemSchema = z.object({ id, fnId: id, time: hhmm, activity: text(120) });
export const VendorSchema = z.object({
  id,
  category: text(40),
  fnId: id.optional(),
  status: z.enum(VENDOR_STATUSES),
  quote: z.int().min(0).optional(),
  questions: z.array(text(200)).max(5),
});
export const GuestSchema = z.object({
  id,
  name: text(80),
  side: z.enum(["bride", "groom", "host"]),
  rsvp: z.enum(["pending", "yes", "no"]),
  diet: z.enum(["veg", "jain", "nonveg"]),
  count: z.int().min(1).max(20),
});
export const IdeaSchema = IdeaDraftSchema.extend({ id });

export const PlanSchema = z.object({
  id,
  brief: BriefSchema,
  functions: z.array(FunctionSchema).min(1).max(8),
  budget: z.array(BudgetLineSchema).min(1).max(60),
  tasks: z.array(TaskSchema).max(80),
  runSheet: z.array(RunItemSchema).max(60),
  vendors: z.array(VendorSchema).max(30),
  guests: z.array(GuestSchema).max(1000),
  ideas: z.array(IdeaSchema).max(40),
  createdAt: z.string(),
  updatedAt: z.string(),
});
export type Plan = z.infer<typeof PlanSchema>;
export type PlanFunction = z.infer<typeof FunctionSchema>;
export type BudgetLine = z.infer<typeof BudgetLineSchema>;
export type Task = z.infer<typeof TaskSchema>;
export type Vendor = z.infer<typeof VendorSchema>;
export type Guest = z.infer<typeof GuestSchema>;
export type Idea = z.infer<typeof IdeaSchema>;

// ---- Changes the assistant may propose (and the UI may apply) ----

const amount = z.int().positive().max(100_000_000);
export const ChangeSchema = z.discriminatedUnion("op", [
  z.object({ op: z.literal("moveBudget"), from: id, to: id, amount }),
  z.object({ op: z.literal("logSpend"), line: id, amount }),
  z.object({ op: z.literal("addTask"), title: text(120), due: isoDate, fnId: id.optional() }),
  z.object({ op: z.literal("toggleTask"), id }),
  z.object({
    op: z.literal("setVendorStatus"),
    id,
    status: z.enum(VENDOR_STATUSES),
    quote: z.int().min(0).optional(),
  }),
  z.object({
    op: z.literal("addVendor"),
    category: text(40),
    questions: z.array(text(200)).max(5),
  }),
  z.object({
    op: z.literal("addIdea"),
    kind: z.enum(IDEA_KINDS),
    title: text(80),
    description: text(400),
  }),
]);
export type Change = z.infer<typeof ChangeSchema>;
