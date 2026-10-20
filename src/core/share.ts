import { formatINR } from "./money";
import type { Plan } from "./types";

export interface ShareLabels {
  budget: string;
  spent: string;
  next: string;
  vendorsLeft: string;
}

/** A short plan summary to paste into a family WhatsApp group. */
export function whatsappText(plan: Plan, labels: ShareLabels): string {
  const spent = plan.budget.reduce((acc, l) => acc + l.spent, 0);
  const open = plan.tasks.filter((t) => !t.done).slice(0, 5);
  const vendorsLeft = plan.vendors.filter((v) => v.status !== "booked").map((v) => v.category);

  return [
    `*${plan.brief.title}* · ${plan.brief.date} · ${plan.brief.city}`,
    `${labels.budget}: ${formatINR(plan.brief.budget)} · ${labels.spent}: ${formatINR(spent)}`,
    "",
    `${labels.next}:`,
    ...open.map((t) => `☐ ${t.title} (${t.due})`),
    "",
    `${labels.vendorsLeft}: ${vendorsLeft.join(", ") || "—"}`,
  ].join("\n");
}

export function whatsappUrl(text: string): string {
  return `https://wa.me/?text=${encodeURIComponent(text)}`;
}
