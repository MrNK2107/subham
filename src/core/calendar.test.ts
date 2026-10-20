import { describe, expect, it } from "vitest";
import { dateRisks } from "./calendar";

const kinds = (date: string, opts?: Parameters<typeof dateRisks>[1]) =>
  dateRisks(date, opts).map((r) => `${r.kind}:${r.key}`);

describe("dateRisks", () => {
  it("flags the south-west monsoon in July", () => {
    expect(kinds("2026-07-15")).toContain("monsoon:southwest");
  });

  it("flags the north-east monsoon for Chennai in November but not for Delhi", () => {
    expect(kinds("2026-11-20", { city: "Chennai" })).toContain("monsoon:northeast");
    expect(kinds("2026-11-20", { city: "Delhi" })).not.toContain("monsoon:northeast");
  });

  it("flags a clash with Diwali 2026, including the day before", () => {
    expect(kinds("2026-11-08")).toContain("festival:diwali");
    expect(kinds("2026-11-07")).toContain("festival:diwali");
  });

  it("does not treat a festival as a clash for a festival celebration", () => {
    expect(kinds("2026-11-08", { type: "festival" })).not.toContain("festival:diwali");
  });

  it("flags peak wedding season and commonly avoided periods", () => {
    expect(kinds("2027-02-14")).toContain("peak:wedding-season");
    expect(kinds("2026-10-01")).toContain("avoided:pitru-paksha");
  });

  it("returns nothing for a quiet date", () => {
    expect(dateRisks("2026-04-22")).toEqual([]);
  });
});
