import { addDays } from "./schedule";
import type { Plan } from "./types";

const IST_OFFSET_MINUTES = 330;
const compact = (iso: string) => iso.replaceAll("-", "");

const escapeText = (text: string) =>
  text.replace(/\\/g, "\\\\").replace(/;/g, "\\;").replace(/,/g, "\\,").replace(/\r?\n/g, "\\n");

/** RFC 5545: lines longer than 75 octets continue on the next line after a space. */
function fold(line: string): string {
  const encoder = new TextEncoder();
  const parts: string[] = [];
  let current = "";
  let size = 0;
  for (const char of line) {
    const bytes = encoder.encode(char).length;
    const limit = parts.length === 0 ? 75 : 74; // continuation lines start with a space
    if (size + bytes > limit) {
      parts.push(current);
      current = "";
      size = 0;
    }
    current += char;
    size += bytes;
  }
  parts.push(current);
  return parts.join("\r\n ");
}

/** An IST wall-clock time as a UTC timestamp, e.g. 2027-02-14 19:00 → 20270214T133000Z. */
function istToUtc(date: string, time: string): string {
  const [h, m] = time.split(":").map(Number) as [number, number];
  const [y, mo, d] = date.split("-").map(Number) as [number, number, number];
  const utc = new Date(Date.UTC(y, mo - 1, d, h, m - IST_OFFSET_MINUTES));
  return utc
    .toISOString()
    .replace(/[-:]/g, "")
    .replace(/\.\d{3}/, "");
}

/** The plan's functions (timed, two hours) and tasks (all-day) as an iCalendar file. */
export function toIcs(plan: Plan): string {
  const stamp = istToUtc(plan.updatedAt.slice(0, 10), "05:30");
  const events = [
    ...plan.functions.map((f) => [
      `UID:${f.id}-${plan.id}@subham`,
      `DTSTAMP:${stamp}`,
      `DTSTART:${istToUtc(f.date, f.start)}`,
      "DURATION:PT2H",
      `SUMMARY:${escapeText(`${f.name} · ${plan.brief.title}`)}`,
      `LOCATION:${escapeText(plan.brief.city)}`,
    ]),
    ...plan.tasks.map((t) => [
      `UID:${t.id}-${plan.id}@subham`,
      `DTSTAMP:${stamp}`,
      `DTSTART;VALUE=DATE:${compact(t.due)}`,
      `DTEND;VALUE=DATE:${compact(addDays(t.due, 1))}`,
      `SUMMARY:${escapeText(t.title)}`,
    ]),
  ];

  const lines = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Subham//Celebration Planner//EN",
    "CALSCALE:GREGORIAN",
    ...events.flatMap((e) => ["BEGIN:VEVENT", ...e, "END:VEVENT"]),
    "END:VCALENDAR",
  ];
  return lines.map(fold).join("\r\n") + "\r\n";
}

/** A one-click "add to Google Calendar" link for an all-day item. */
export function googleCalendarUrl(title: string, date: string, details = ""): string {
  const params = new URLSearchParams({
    action: "TEMPLATE",
    text: title,
    dates: `${compact(date)}/${compact(addDays(date, 1))}`,
    details,
  });
  return `https://calendar.google.com/calendar/render?${params}`;
}
