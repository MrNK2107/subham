import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { takePrefill } from "@/ui/wizard/prefill";
import { Home } from "./Home";

const push = vi.fn();
vi.mock("next/navigation", () => ({ useRouter: () => ({ push }) }));

const respond = (body: unknown, status = 200) =>
  vi.fn().mockResolvedValue(
    new Response(JSON.stringify(body), {
      status,
      headers: { "content-type": "application/json" },
    }),
  );

beforeEach(() => {
  push.mockReset();
  vi.unstubAllGlobals();
});

describe("Home", () => {
  it("hands the AI's reading of a description to the wizard", async () => {
    vi.stubGlobal("fetch", respond({ brief: { type: "birthday", city: "Salem" } }));
    const user = userEvent.setup();
    render(<Home />);
    await user.type(screen.getByLabelText("Describe your celebration"), "Birthday in Salem");
    await user.click(screen.getByRole("button", { name: "Fill it in for me" }));
    expect(push).toHaveBeenCalledWith("/plan/new");
    expect(takePrefill()).toEqual({ type: "birthday", city: "Salem" });
  });

  it("asks for a description before calling the AI", async () => {
    const fetcher = vi.fn();
    vi.stubGlobal("fetch", fetcher);
    const user = userEvent.setup();
    render(<Home />);
    await user.click(screen.getByRole("button", { name: "Fill it in for me" }));
    expect(screen.getByRole("alert")).toHaveTextContent("Please fill this in.");
    expect(fetcher).not.toHaveBeenCalled();
  });

  it("shows the server's message when quick-fill is unavailable", async () => {
    vi.stubGlobal("fetch", respond({ error: "Quick-fill needs AI" }, 503));
    const user = userEvent.setup();
    render(<Home />);
    await user.type(screen.getByLabelText("Describe your celebration"), "A wedding");
    await user.click(screen.getByRole("button", { name: "Fill it in for me" }));
    expect(await screen.findByRole("alert")).toHaveTextContent("Quick-fill needs AI");
    expect(push).not.toHaveBeenCalled();
  });

  it("lists the six features", () => {
    render(<Home />);
    expect(screen.getAllByRole("heading", { level: 3 }).length).toBeGreaterThanOrEqual(6);
  });
});
