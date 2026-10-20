import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { takePrefill } from "@/ui/wizard/prefill";
import { Home } from "./Home";

const push = vi.fn();
vi.mock("next/navigation", () => ({ useRouter: () => ({ push }) }));
// WebGL isn't available in jsdom; the scene is decorative and covered by end-to-end tests.
vi.mock("@/ui/scene/StreetLights", () => ({ default: () => <div data-testid="scene" /> }));

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
    await user.click(screen.getByRole("button", { name: "Light it up" }));
    expect(push).toHaveBeenCalledWith("/plan/new");
    expect(takePrefill()).toEqual({ type: "birthday", city: "Salem" });
  });

  it("asks for a description before calling the AI", async () => {
    const fetcher = vi.fn();
    vi.stubGlobal("fetch", fetcher);
    const user = userEvent.setup();
    render(<Home />);
    await user.click(screen.getByRole("button", { name: "Light it up" }));
    expect(screen.getByRole("alert")).toHaveTextContent("Please fill this in.");
    expect(fetcher).not.toHaveBeenCalled();
  });

  it("shows the server's message when quick-fill is unavailable", async () => {
    vi.stubGlobal("fetch", respond({ error: "Quick-fill needs AI" }, 503));
    const user = userEvent.setup();
    render(<Home />);
    await user.type(screen.getByLabelText("Describe your celebration"), "A wedding");
    await user.click(screen.getByRole("button", { name: "Light it up" }));
    expect(await screen.findByRole("alert")).toHaveTextContent("Quick-fill needs AI");
    expect(push).not.toHaveBeenCalled();
  });

  it("lists the six features", () => {
    render(<Home />);
    expect(screen.getAllByRole("heading", { level: 3 }).length).toBeGreaterThanOrEqual(6);
  });

  it("mounts the decorative scene only once the page is idle", async () => {
    render(<Home />);
    expect(screen.queryByTestId("scene")).toBeNull();
    expect(await screen.findByTestId("scene")).toBeInTheDocument();
  });

  it("keeps the static backdrop for Data Saver users", async () => {
    vi.stubGlobal("navigator", { ...navigator, connection: { saveData: true } });
    render(<Home />);
    await new Promise((r) => setTimeout(r, 400));
    expect(screen.queryByTestId("scene")).toBeNull();
  });
});
