import { z } from "zod";
import { TurnSchema } from "@/ai/contracts";
import { BriefSchema, PlanSchema } from "@/core/types";

const today = z.iso.date().optional();

export const PlanRequest = z.object({ brief: BriefSchema, today });
export const BriefRequest = z.object({ text: z.string().trim().min(3).max(600), today });
export const AssistantRequest = z.object({
  plan: PlanSchema,
  messages: z.array(TurnSchema).min(1).max(20),
});
export const IdeasRequest = z.object({ brief: BriefSchema });
