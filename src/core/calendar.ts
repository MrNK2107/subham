import type { EventType } from "./types";

export type RiskKind = "monsoon" | "festival" | "peak" | "avoided";

/** A reason to think twice about a date. `key` names the message shown to the person. */
export interface Risk {
  kind: RiskKind;
  key: string;
}

interface Window {
  key: string;
  from: string;
  to: string;
}

const day = (iso: string, offset: number) => {
  const d = new Date(`${iso}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + offset);
  return d.toISOString().slice(0, 10);
};

/** A festival affects the day before and after too: vendors are booked out and roads are busy. */
const around = (key: string, date: string, after = 1): Window => ({
  key,
  from: day(date, -1),
  to: day(date, after),
});

// Dates follow published 2026–2027 calendars; lunar dates can shift a day by region.
const FESTIVALS: Window[] = [
  around("pongal", "2026-01-14", 2),
  around("holi", "2026-03-04"),
  around("eid", "2026-03-20"),
  around("eid", "2026-05-27"),
  around("onam", "2026-08-26"),
  around("ganesh", "2026-09-14"),
  { key: "navratri", from: "2026-10-11", to: "2026-10-21" },
  around("diwali", "2026-11-08", 2),
  around("christmas", "2026-12-25"),
  around("pongal", "2027-01-14", 2),
  around("eid", "2027-03-10"),
  around("holi", "2027-03-22"),
  around("eid", "2027-05-17"),
  around("ganesh", "2027-09-04"),
  around("onam", "2027-09-12"),
  { key: "navratri", from: "2027-09-30", to: "2027-10-10" },
  around("diwali", "2027-10-29", 2),
  around("christmas", "2027-12-25"),
];

// Periods many families avoid for weddings and new beginnings (approximate; check a local panchang).
const AVOIDED: Window[] = [
  { key: "kharmas", from: "2025-12-16", to: "2026-01-14" },
  { key: "kharmas", from: "2026-03-14", to: "2026-04-13" },
  { key: "pitru-paksha", from: "2026-09-26", to: "2026-10-10" },
  { key: "kharmas", from: "2026-12-16", to: "2027-01-14" },
  { key: "kharmas", from: "2027-03-15", to: "2027-04-14" },
  { key: "pitru-paksha", from: "2027-09-16", to: "2027-09-30" },
  { key: "kharmas", from: "2027-12-16", to: "2028-01-14" },
];

// Places where the north-east monsoon brings heavy rain from October to December.
const NORTHEAST_MONSOON = new Set([
  "chennai",
  "madras",
  "puducherry",
  "pondicherry",
  "cuddalore",
  "nagapattinam",
  "nellore",
  "kanchipuram",
  "chengalpattu",
  "tiruvallur",
  "thoothukudi",
  "tirunelveli",
  "kanyakumari",
]);

const within = (date: string, w: Window) => date >= w.from && date <= w.to;

/**
 * Things worth knowing about a date in India: monsoon rain, festival clashes, peak-season prices
 * and commonly avoided periods. Informational only; families decide.
 */
export function dateRisks(date: string, opts: { city?: string; type?: EventType } = {}): Risk[] {
  const month = Number(date.slice(5, 7));
  const risks: Risk[] = [];

  if (month >= 6 && month <= 9) risks.push({ kind: "monsoon", key: "southwest" });
  if (month >= 10 && month <= 12 && NORTHEAST_MONSOON.has(opts.city?.trim().toLowerCase() ?? "")) {
    risks.push({ kind: "monsoon", key: "northeast" });
  }

  if (opts.type !== "festival") {
    const seen = new Set<string>();
    for (const w of FESTIVALS) {
      if (within(date, w) && !seen.has(w.key)) {
        seen.add(w.key);
        risks.push({ kind: "festival", key: w.key });
      }
    }
  }

  if (month >= 11 || month <= 2) risks.push({ kind: "peak", key: "wedding-season" });

  for (const w of AVOIDED) {
    if (within(date, w)) risks.push({ kind: "avoided", key: w.key });
  }
  return risks;
}
