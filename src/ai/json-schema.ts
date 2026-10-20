import { z } from "zod";

/** Keywords that Gemini's and Ollama's schema subsets reject. zod re-validates the output anyway. */
const DROP = new Set([
  "$schema",
  "pattern",
  "format",
  "additionalProperties",
  "exclusiveMinimum",
  "exclusiveMaximum",
]);

/** JSON Schema for a model's structured output or tool parameters, generated from a zod schema. */
export function forModel(schema: z.ZodType): Record<string, unknown> {
  return JSON.parse(JSON.stringify(z.toJSONSchema(schema)), (key, value) =>
    DROP.has(key) ? undefined : value,
  );
}
