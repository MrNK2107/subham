import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { assemblePlan } from "@/core/assemble";
import { templateBlueprint } from "@/core/templates";
import { savePlan } from "@/store/local";
import { birthdayBrief, TODAY } from "@/test/fixtures";
import { PlanList } from "./PlanList";

describe("PlanList", () => {
  it("invites the person to plan when there are no plans", () => {
    render(<PlanList />);
    expect(screen.getByRole("link", { name: "Plan a celebration" })).toBeInTheDocument();
  });

  it("links to each saved plan", () => {
    const plan = assemblePlan(birthdayBrief, templateBlueprint(birthdayBrief), {
      id: "b1",
      today: TODAY,
      now: new Date(),
    });
    savePlan(plan, { mirror: false });
    render(<PlanList />);
    expect(screen.getByRole("link", { name: birthdayBrief.title })).toHaveAttribute(
      "href",
      "/plan/b1",
    );
  });
});
