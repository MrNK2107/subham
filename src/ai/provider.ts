import { createAssistant } from "./assistant";
import type { AiProvider } from "./contracts";
import { geminiFromEnv } from "./gemini";
import { mockProvider } from "./mock";
import { ollamaEngine } from "./ollama";

export * from "./contracts";

type Env = Record<string, string | undefined>;

/**
 * Picks the AI backend: AI_PROVIDER wins; otherwise Gemini when a key is set, then a local Ollama
 * server. Returns null when none is configured (the app then uses its built-in templates).
 */
export function pickProvider(env: Env = process.env): AiProvider | null {
  const choice =
    env.AI_PROVIDER || (env.GEMINI_API_KEY ? "gemini" : env.OLLAMA_URL ? "ollama" : "");
  if (choice === "mock") return mockProvider;
  if (choice === "gemini" && env.GEMINI_API_KEY) return createAssistant(geminiFromEnv(env));
  if (choice === "ollama") {
    return createAssistant(
      ollamaEngine({
        url: env.OLLAMA_URL || "http://localhost:11434",
        model: env.OLLAMA_MODEL || "gemma4:latest",
      }),
    );
  }
  return null;
}
