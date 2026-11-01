import { pickProvider } from "@/ai/provider";
import { reply } from "@/server/guard";

export const dynamic = "force-dynamic";

/** Liveness check for the host, and which AI backend is active. */
export function GET() {
  return reply({ ok: true, provider: pickProvider()?.name ?? null });
}
