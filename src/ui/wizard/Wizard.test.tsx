import { act, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { Wizard } from "./Wizard";
import { savePrefill } from "./prefill";

const push = vi.fn();
vi.mock("next/navigation", () => ({ useRouter: () => ({ push }), usePathname: () => "/" }));

beforeEach(() => push.mockReset());

async function toDetails(user: ReturnType<typeof userEvent.setup>) {
  await user.click(screen.getByRole("radio", { name: /wedding/i }));
  await user.click(screen.getByRole("button", { name: "Next" }));
  await user.click(screen.getByRole("button", { name: "Next" }));
}

describe("Wizard", () => {
  it("preselects the five wedding functions", async () => {
    const user = userEvent.setup();
    render(<Wizard />);
    await user.click(screen.getByRole("radio", { name: /wedding/i }));
    await user.click(screen.getByRole("button", { name: "Next" }));
    const list = screen.getByRole("list", { name: /functions/i });
    expect(within(list).getAllByRole("listitem")).toHaveLength(5);
    expect(within(list).getByText("Sangeet")).toBeInTheDocument();
  });

  it("asks for a type before moving on", async () => {
    const user = userEvent.setup();
    render(<Wizard />);
    await user.click(screen.getByRole("button", { name: "Next" }));
    expect(screen.getByText("Please fill this in.")).toBeInTheDocument();
  });

  it("shows inline errors and moves focus to the first invalid field", async () => {
    const user = userEvent.setup();
    render(<Wizard />);
    await toDetails(user);
    await user.type(screen.getByLabelText("Name of the celebration"), "Our wedding");
    await user.click(screen.getByRole("button", { name: "Create my plan" }));
    const city = screen.getByLabelText("City or town");
    expect(city).toHaveFocus();
    expect(city).toHaveAttribute("aria-invalid", "true");
    expect(city).toHaveAccessibleDescription(/please fill this in/i);
  });

  it("reads budgets written in lakh", async () => {
    const user = userEvent.setup();
    render(<Wizard />);
    await toDetails(user);
    await user.type(screen.getByLabelText("Total budget"), "2 lakh");
    expect(screen.getByText("That's ₹2,00,000")).toBeInTheDocument();
  });

  it("guesses the city tier from the city", async () => {
    const user = userEvent.setup();
    render(<Wizard />);
    await toDetails(user);
    await user.type(screen.getByLabelText("City or town"), "Chennai");
    expect(screen.getByLabelText("City type")).toHaveValue("metro");
  });

  it("opens on the details step when prefilled from the landing page", async () => {
    savePrefill({ type: "birthday", city: "Warangal", guests: 40 });
    await act(async () => {
      render(<Wizard />);
    });
    expect(screen.getByLabelText("City or town")).toHaveValue("Warangal");
    expect(screen.getByText(/we filled in what we understood/i)).toBeInTheDocument();
  });
});
