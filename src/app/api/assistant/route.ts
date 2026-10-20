import { AiUnavailable, pickProvider } from "@/ai/provider";
import { applyChange } from "@/core/changes";
import { fail, readBody, reply, tooMany } from "@/server/guard";
import { AssistantRequest } from "@/server/schemas";
import { createThrottle, ipOf } from "@/server/throttle";

export const maxDuration = 60;

const throttle = createThrottle({ limit: 20, windowMs: 60_000 });

/** Chat with the planning assistant. Proposed changes are checked here and applied only by the person. */
export async function POST(req: Request) {
  const allowed = throttle.hit(ipOf(req));
  if (!allowed.ok) return tooMany(allowed.retryAfter);

  const body = await readBody(req, AssistantRequest, 400_000);
  if (!body.ok) return body.res;
  const { plan, messages } = body.data;

  const ai = pickProvider();
  if (!ai) return fail(503, "The assistant needs AI, which isn't set up here.");
  try {
    const { reply: text, changes } = await ai.converse(plan, messages);
    // Only offer changes that actually apply to this plan.
    const valid = changes.filter((change) => {
      try {
        applyChange(plan, change);
        return true;
      } catch {
        return false;
      }
    });
    return reply({ reply: text, changes: valid });
  } catch (error) {
    if (!(error instanceof AiUnavailable)) throw error;
    return fail(503, error.message);
  }
}
