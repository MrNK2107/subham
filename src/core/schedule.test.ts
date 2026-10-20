import { describe, expect, it } from "vitest";
import { addDays, daysUntil, dueDate } from "./schedule";

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
