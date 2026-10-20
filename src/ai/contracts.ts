import { z } from "zod";
import type { Blueprint, Brief, Change, IdeaDraft, Plan } from "@/core/types";

export const TurnSchema = z.object({
  role: z.enum(["user", "assistant"]),
  text: z.string().trim().min(1).max(2000),
});
export type Turn = z.infer<typeof TurnSchema>;

export interface Source {
  url: string;
  title: string;
}

export type ProviderName = "gemini" | "ollama" | "mock";

/** What the app asks of an AI model, whichever model it is. */
export interface AiProvider {
  name: ProviderName;
  blueprint(brief: Brief, today: string): Promise<Blueprint>;
  extractBrief(text: string, today: string): Promise<Partial<Brief>>;
  converse(plan: Plan, history: Turn[]): Promise<{ reply: string; changes: Change[] }>;
  ideas(brief: Brief): Promise<{ ideas: IdeaDraft[]; sources: Source[] }>;
}

export interface ToolDeclaration {
  name: string;
  description: string;
  parameters: Record<string, unknown>;
}

export interface RawCall {
  name?: string;
  args?: unknown;
}

/** The few primitive calls each model backend implements; everything else is shared. */
export interface Engine {
  name: Exclude<ProviderName, "mock">;
  json(req: {
    system: string;
    prompt: string;
    schema: Record<string, unknown>;
    temperature: number;
  }): Promise<unknown>;
  tools(req: {
    system: string;
    history: Turn[];
    tools: ToolDeclaration[];
    temperature: number;
  }): Promise<{ text: string; calls: RawCall[] }>;
  /** Web-grounded generation, when the backend supports it. */
  grounded?(req: { prompt: string }): Promise<{ text: string; sources: Source[] }>;
}

/** No model could answer. The message is safe to show to the person. */
export class AiUnavailable extends Error {
  override name = "AiUnavailable";
}

export function parseJsonText(text: string | undefined): unknown {
  try {
    return JSON.parse(text ?? "");
  } catch {
    throw new AiUnavailable("The AI planner sent back something unreadable. Please try again.");
  }
}
