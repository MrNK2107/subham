import { describe, expect, it } from "vitest";
import { googleCalendarUrl, toIcs } from "./ics";
import { assemblePlan } from "./assemble";
import { templateBlueprint } from "./templates";
import { TODAY, weddingBrief } from "@/test/fixtures";

const plan = assemblePlan(weddingBrief, templateBlueprint(weddingBrief), {
  id: "p1",
  today: TODAY,
  now: new Date("2026-10-20T10:00:00Z"),
});

describe("toIcs", () => {
  const ics = toIcs(plan);

  it("is a calendar with one event per function and task, using CRLF", () => {
    expect(ics.startsWith("BEGIN:VCALENDAR\r\n")).toBe(true);
    expect(ics.trimEnd().endsWith("END:VCALENDAR")).toBe(true);
    expect(ics.match(/BEGIN:VEVENT/g)).toHaveLength(plan.functions.length + plan.tasks.length);
    expect(ics).not.toMatch(/[^\r]\n/);
  });

  it("converts function start times from IST to UTC", () => {
    const fn = plan.functions.find((f) => f.name === "Reception")!;
    const [h, m] = fn.start.split(":").map(Number);
    const utc = new Date(Date.UTC(2000, 0, 1, h!, m! - 330));
    const hh = String(utc.getUTCHours()).padStart(2, "0");
    const mm = String(utc.getUTCMinutes()).padStart(2, "0");
    expect(ics).toContain(`DTSTART:${fn.date.replaceAll("-", "")}T${hh}${mm}00Z`);
  });

  it("escapes special characters and folds long lines to 75 octets", () => {
    const title = "மண்டபம், அலங்காரம்; ".repeat(4).trim();
    const out = toIcs({ ...plan, tasks: [{ ...plan.tasks[0]!, title }] });
    expect(out).toContain("\\,");
    expect(out).toContain("\\;");
    for (const line of out.split("\r\n")) {
      expect(new TextEncoder().encode(line).length).toBeLessThanOrEqual(75);
    }
  });
});

describe("googleCalendarUrl", () => {
  it("builds an all-day event link", () => {
    const url = new URL(googleCalendarUrl("Book venue", "2026-12-01"));
    expect(url.hostname).toBe("calendar.google.com");
    expect(url.searchParams.get("text")).toBe("Book venue");
    expect(url.searchParams.get("dates")).toBe("20261201/20261202");
  });
});
