import { describe, expect, it } from "vitest";
import { addDays, daysUntil, dueDate, trustedToday } from "./schedule";

describe("schedule", () => {
  it("counts back from the event date", () => {
    expect(dueDate("2027-02-14", "2026-10-20", 30)).toBe("2027-01-15");
  });

  it("never schedules a task in the past", () => {
    expect(dueDate("2026-10-25", "2026-10-20", 90)).toBe("2026-10-20");
  });

  it("handles an event happening today", () => {
    expect(dueDate("2026-10-20", "2026-10-20", 10)).toBe("2026-10-20");
  });

  it("adds days across month and year boundaries", () => {
    expect(addDays("2026-12-30", 3)).toBe("2027-01-02");
    expect(addDays("2027-03-01", -1)).toBe("2027-02-28");
  });

  it("counts days until a date", () => {
    expect(daysUntil("2026-10-27", "2026-10-20")).toBe(7);
    expect(daysUntil("2026-10-19", "2026-10-20")).toBe(-1);
  });
});

describe("trustedToday", () => {
  const now = new Date("2026-10-20T20:00:00Z"); // 21 Oct, 01:30 in India

  it("accepts the browser's date when it is within a day of India's date", () => {
    expect(trustedToday("2026-10-20", now)).toBe("2026-10-20");
    expect(trustedToday("2026-10-22", now)).toBe("2026-10-22");
  });

  it("ignores missing or far-off dates", () => {
    expect(trustedToday(undefined, now)).toBe("2026-10-21");
    expect(trustedToday("2020-01-01", now)).toBe("2026-10-21");
  });
});
