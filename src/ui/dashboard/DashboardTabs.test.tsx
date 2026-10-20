import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { assemblePlan } from "@/core/assemble";
import { templateBlueprint } from "@/core/templates";
import { getPlan, savePlan } from "@/store/local";
import { TODAY, weddingBrief } from "@/test/fixtures";
import { Dashboard } from "./Dashboard";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn() }),
  usePathname: () => "/",
}));

const plan = assemblePlan(weddingBrief, templateBlueprint(weddingBrief), {
  id: "p1",
  today: TODAY,
  now: new Date("2026-10-20T10:00:00Z"),
});

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

async function openTab(name: string) {
  const user = userEvent.setup();
  render(<Dashboard id="p1" />);
  await user.click(screen.getByRole("tab", { name }));
  return { user, panel: screen.getByRole("tabpanel", { name }) };
}

beforeEach(() => {
  localStorage.clear();
  savePlan(plan, { mirror: false });
  vi.unstubAllGlobals();
});

describe("Timeline tab", () => {
  it("lists tasks with Google Calendar links and a run sheet per function", async () => {
    const { panel } = await openTab("Timeline");
    const first = plan.tasks[0]!;
    const link = within(panel).getByRole("link", {
      name: `Add “${first.title}” to Google Calendar`,
    });
    expect(link).toHaveAttribute("target", "_blank");
    expect(link.getAttribute("rel")).toContain("noopener");
    expect(within(panel).getByRole("heading", { name: "Run sheet" })).toBeInTheDocument();
    for (const f of plan.functions) {
      expect(
        within(panel).getByRole("heading", { level: 3, name: new RegExp(f.name) }),
      ).toBeVisible();
    }
  });

  it("ticks a task off and saves it", async () => {
    const { user, panel } = await openTab("Timeline");
    const first = plan.tasks[0]!;
    await user.click(within(panel).getByRole("checkbox", { name: first.title }));
    expect(getPlan("p1")!.tasks.find((t) => t.id === first.id)!.done).toBe(true);
  });

  it("validates the add-task form before adding", async () => {
    const { user, panel } = await openTab("Timeline");
    const add = within(panel).getByRole("button", { name: "Add task" });
    await user.click(add);
    expect(within(panel).getByRole("alert")).toHaveTextContent("Please fill this in.");
    await user.type(within(panel).getByLabelText("Task"), "Book nadaswaram");
    await user.click(add);
    expect(within(panel).getByRole("alert")).toHaveTextContent(/Task due date/);
  });

  it("adds a task with a valid due date", async () => {
    const { user, panel } = await openTab("Timeline");
    await user.type(within(panel).getByLabelText("Task"), "Book nadaswaram");
    await user.type(within(panel).getByLabelText("Due date"), "2026-12-01");
    await user.click(within(panel).getByRole("button", { name: "Add task" }));
    expect(getPlan("p1")!.tasks.some((t) => t.title === "Book nadaswaram")).toBe(true);
    expect(within(panel).getByLabelText("Task")).toHaveValue("");
  });
});

describe("Vendors tab", () => {
  it("changes a vendor's status", async () => {
    const { user, panel } = await openTab("Vendors");
    const v = plan.vendors[0]!;
    await user.selectOptions(
      within(panel).getByLabelText("Status", { selector: `#status-${v.id}` }),
      "booked",
    );
    expect(getPlan("p1")!.vendors[0]!.status).toBe("booked");
    expect(within(panel).getByText(`1 of ${plan.vendors.length} booked`)).toBeInTheDocument();
  });

  it("saves a quote when the field loses focus", async () => {
    const { user, panel } = await openTab("Vendors");
    const v = plan.vendors[0]!;
    const quote = panel.querySelector<HTMLInputElement>(`#quote-${v.id}`)!;
    await user.type(quote, "85000");
    await user.tab();
    expect(getPlan("p1")!.vendors[0]!.quote).toBe(85000);
  });

  it("adds a vendor only when a type is given", async () => {
    const { user, panel } = await openTab("Vendors");
    const button = within(panel).getByRole("button", { name: "Add vendor" });
    expect(button).toBeDisabled();
    await user.type(within(panel).getByLabelText("Vendor type"), "Mehendi artist");
    await user.click(button);
    expect(getPlan("p1")!.vendors.at(-1)!.category).toBe("Mehendi artist");
    expect(within(panel).getByLabelText("Vendor type")).toHaveValue("");
  });
});

describe("Ideas tab", () => {
  it("fetches fresh ideas with sources and saves one to the plan", async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      json({
        ideas: [{ kind: "food", title: "Filter coffee bar", description: "Brass tumblers." }],
        sources: [{ url: "https://example.com/coffee", title: "Coffee guide" }],
      }),
    );
    vi.stubGlobal("fetch", fetchMock);
    const { user, panel } = await openTab("Ideas");
    await user.click(within(panel).getByRole("button", { name: /Get fresh ideas for Chennai/ }));
    expect(await within(panel).findByRole("heading", { name: "New suggestions" })).toBeVisible();
    expect(fetchMock).toHaveBeenCalledWith("/api/ideas", expect.anything());
    expect(within(panel).getByRole("link", { name: "Coffee guide" })).toHaveAttribute(
      "href",
      "https://example.com/coffee",
    );
    await user.click(within(panel).getByRole("button", { name: "Save to plan" }));
    expect(getPlan("p1")!.ideas.some((i) => i.title === "Filter coffee bar")).toBe(true);
    expect(within(panel).getByText(/Saved/)).toBeInTheDocument();
  });

  it("shows the server's error message when ideas fail", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(json({ error: "Too many requests." }, 429)));
    const { user, panel } = await openTab("Ideas");
    await user.click(within(panel).getByRole("button", { name: /Get fresh ideas/ }));
    expect(await within(panel).findByRole("alert")).toHaveTextContent("Too many requests.");
  });

  it("shows a network message when the request cannot be sent", async () => {
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new TypeError("offline")));
    const { user, panel } = await openTab("Ideas");
    await user.click(within(panel).getByRole("button", { name: /Get fresh ideas/ }));
    expect(await within(panel).findByRole("alert")).toHaveTextContent(/couldn't reach the server/);
  });
});
