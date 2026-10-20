import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { Header } from "./Header";
import { SkipLink } from "./SkipLink";

vi.mock("next/navigation", () => ({ usePathname: () => "/plans" }));

describe("Header", () => {
  it("marks the current page and offers a new plan", () => {
    render(<Header />);
    expect(screen.getByRole("link", { name: "My plans" })).toHaveAttribute("aria-current", "page");
    expect(screen.getByRole("link", { name: "New plan" })).toHaveAttribute("href", "/plan/new");
  });

  it("switches the interface language from the header", async () => {
    const user = userEvent.setup();
    render(
      <>
        <SkipLink />
        <Header />
      </>,
    );
    await user.selectOptions(screen.getByLabelText("Language"), "te");
    expect(screen.getByRole("link", { name: "నా ప్లాన్‌లు" })).toBeInTheDocument();
    expect(document.documentElement.lang).toBe("te");
    await user.selectOptions(screen.getByLabelText(/భాష|Language/), "en");
  });

  it("hides sign-in when Firebase isn't configured", () => {
    render(<Header />);
    expect(screen.queryByRole("button", { name: /sign in/i })).not.toBeInTheDocument();
  });
});
