import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { BulbStrand } from "./BulbStrand";

const litCount = (container: HTMLElement) =>
  [...container.querySelectorAll("span")].filter((s) =>
    s.className.split(" ").some((c) => /(^|_)on(_|$)/.test(c)),
  ).length;

describe("BulbStrand", () => {
  it("is a meter with its value in words", () => {
    render(<BulbStrand value={3} max={12} label="Tasks done" valueText="3 of 12" />);
    const meter = screen.getByRole("meter", { name: "Tasks done" });
    expect(meter).toHaveAttribute("aria-valuetext", "3 of 12");
  });

  it("lights at least one bulb as soon as there is any progress", () => {
    const { container } = render(
      <BulbStrand value={4} max={250} bulbs={16} label="Guests" valueText="4 of 250" />,
    );
    expect(litCount(container)).toBe(1);
  });

  it("stays dark at zero", () => {
    const { container } = render(<BulbStrand value={0} max={10} label="x" valueText="0" />);
    expect(litCount(container)).toBe(0);
  });
});
