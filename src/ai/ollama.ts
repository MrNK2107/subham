import { AiUnavailable, parseJsonText, type Engine } from "./contracts";

interface OllamaOptions {
  url: string;
  model: string;
  fetcher?: typeof fetch;
  timeoutMs?: number;
}

interface OllamaMessage {
  content?: string;
  tool_calls?: { function?: { name?: string; arguments?: unknown } }[];
}

/**
 * Local backend for development and offline testing: any Ollama model (gemma4 by default) through
 * its /api/chat endpoint, with JSON-schema constrained output and tool calling.
 */
export function ollamaEngine({
  url,
  model,
  fetcher = fetch,
  timeoutMs = 240_000,
}: OllamaOptions): Engine {
  async function chat(body: Record<string, unknown>): Promise<OllamaMessage> {
    let res: Response;
    try {
      res = await fetcher(`${url.replace(/\/$/, "")}/api/chat`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ model, stream: false, think: false, ...body }),
        signal: AbortSignal.timeout(timeoutMs),
      });
    } catch (error) {
      console.error("Ollama request failed:", (error as Error)?.message);
      throw new AiUnavailable("The local AI model isn't reachable. Is Ollama running?");
    }
    if (!res.ok) throw new AiUnavailable("The local AI model returned an error.");
    const data = (await res.json()) as { message?: OllamaMessage };
    return data.message ?? {};
  }

  return {
    name: "ollama",
    async json({ system, prompt, schema, temperature }) {
      const message = await chat({
        messages: [
          { role: "system", content: system },
          { role: "user", content: prompt },
        ],
        format: schema,
        options: { temperature },
      });
      return parseJsonText(message.content);
    },
    async tools({ system, history, tools, temperature }) {
      const message = await chat({
        messages: [
          { role: "system", content: system },
          ...history.map((t) => ({ role: t.role, content: t.text })),
        ],
        tools: tools.map((t) => ({ type: "function", function: t })),
        options: { temperature },
      });
      return {
        text: message.content ?? "",
        calls: (message.tool_calls ?? []).map((c) => ({
          name: c.function?.name,
          args: c.function?.arguments,
        })),
      };
    },
  };
}
