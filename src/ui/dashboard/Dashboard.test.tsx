import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { assemblePlan } from "@/core/assemble";
import { formatINR } from "@/core/money";
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

beforeEach(() => {
  savePlan(plan, { mirror: false });
  vi.unstubAllGlobals();
});

describe("Dashboard", () => {
  it("shows the plan title and a WhatsApp share link", () => {
    render(<Dashboard id="p1" />);
    expect(screen.getByRole("heading", { level: 1, name: weddingBrief.title })).toBeInTheDocument();
    const share = screen.getByRole("link", { name: /whatsapp/i });
    expect(share.getAttribute("href")).toMatch(/^https:\/\/wa\.me\/\?text=/);
  });

  it("supports arrow-key navigation between tabs", async () => {
    const user = userEvent.setup();
    render(<Dashboard id="p1" />);
    const overview = screen.getByRole("tab", { name: "Overview" });
    await user.click(overview);
    await user.keyboard("{ArrowRight}");
    const budget = screen.getByRole("tab", { name: "Budget" });
    expect(budget).toHaveFocus();
    expect(budget).toHaveAttribute("aria-selected", "true");
    expect(screen.getByRole("tabpanel", { name: "Budget" })).toBeVisible();
  });

  it("states overspending in words after logging a payment", async () => {
    const user = userEvent.setup();
    render(<Dashboard id="p1" />);
    await user.click(screen.getByRole("tab", { name: "Budget" }));
    const line = plan.budget[0]!;
    await user.selectOptions(screen.getByLabelText("Budget line"), line.id);
    await user.type(screen.getByLabelText("Amount paid"), String(line.allocated + 1000));
    await user.click(screen.getByRole("button", { name: "Add payment" }));
    expect(screen.getByText(`Over by ${formatINR(1000)}`)).toBeInTheDocument();
    expect(getPlan("p1")!.budget[0]!.spent).toBe(line.allocated + 1000);
  });

  it("updates headcounts when a guest is added", async () => {
    const user = userEvent.setup();
    render(<Dashboard id="p1" />);
    await user.click(screen.getByRole("tab", { name: "Guests" }));
    await user.type(screen.getByLabelText("Name"), "Reddy family");
    await user.clear(screen.getByLabelText("People"));
    await user.type(screen.getByLabelText("People"), "4");
    await user.selectOptions(screen.getByLabelText("RSVP"), "yes");
    await user.click(screen.getByRole("button", { name: "Add guest" }));
    expect(screen.getByText(/4 confirmed/)).toBeInTheDocument();
    expect(screen.getByRole("cell", { name: "Reddy family" })).toBeInTheDocument();
  });

  it("applies an assistant proposal only after approval", async () => {
    const [from, to] = plan.budget;
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        new Response(
          JSON.stringify({
            reply: "Shift a little to catering.",
            changes: [{ op: "moveBudget", from: from!.id, to: to!.id, amount: 5000 }],
          }),
          { status: 200, headers: { "content-type": "application/json" } },
        ),
      ),
    );
    const user = userEvent.setup();
    render(<Dashboard id="p1" />);
    await user.click(screen.getByRole("button", { name: "Ask the assistant" }));
    await user.type(screen.getByLabelText("Message to the assistant"), "rebalance");
    await user.click(screen.getByRole("button", { name: "Send" }));

    const proposal = await screen.findByRole("group", { name: "Proposed changes" });
    expect(within(proposal).getByText(/Move ₹5,000 from/)).toBeInTheDocument();
    expect(getPlan("p1")!.budget[0]!.allocated).toBe(from!.allocated);

    await user.click(within(proposal).getByRole("button", { name: "Apply" }));
    expect(getPlan("p1")!.budget[0]!.allocated).toBe(from!.allocated - 5000);
    expect(within(proposal).getByText(/Applied/)).toBeInTheDocument();
  });

  it("explains when the plan isn't on this device", () => {
    render(<Dashboard id="missing" />);
    expect(screen.getByText(/couldn't find this plan/i)).toBeInTheDocument();
  });
});
