import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { assemblePlan } from "@/core/assemble";
import { templateBlueprint } from "@/core/templates";
import { TODAY, weddingBrief } from "@/test/fixtures";
import { ShareFamily } from "./ShareFamily";

// A plain function rather than a vi.fn(): in this file Vitest reported the spy's rejections as
// test errors even though the component catches them.
const calls: unknown[][] = [];
let shareImpl: () => Promise<void> = async () => {};

vi.mock("@/store/firebase", () => ({ firebaseEnabled: true }));
vi.mock("@/store/cloud", () => {
  class ShareError extends Error {
    constructor(readonly reason: "signed-out" | "failed") {
      super(reason);
    }
  }
  return {
    sharePlan: (...args: unknown[]) => {
      calls.push(args);
      return shareImpl();
    },
    ShareError,
  };
});

const plan = assemblePlan(weddingBrief, templateBlueprint(weddingBrief), {
  id: "p1",
  today: TODAY,
  now: new Date("2026-10-20T10:00:00Z"),
});

async function fill(email: string, role?: "viewer") {
  const user = userEvent.setup();
  render(<ShareFamily plan={plan} />);
  await user.click(screen.getByText("Share with family"));
  if (email) await user.type(screen.getByLabelText("Their Google email"), email);
  if (role) await user.selectOptions(screen.getByLabelText("They can"), role);
  await user.click(screen.getByRole("button", { name: "Share" }));
  return user;
}

beforeEach(() => {
  calls.length = 0;
  shareImpl = async () => {};
});

describe("ShareFamily", () => {
  it("rejects an address that isn't an email without calling the cloud", async () => {
    await fill("amma-at-home");
    expect(screen.getByRole("status")).toHaveTextContent("Please fill this in.");
    expect(calls).toHaveLength(0);
  });

  it("shares with the chosen role and clears the field", async () => {
    await fill("amma@example.com", "viewer");
    expect(await screen.findByText(/Shared with amma@example.com/)).toBeInTheDocument();
    expect(calls).toEqual([[plan, "amma@example.com", "viewer"]]);
    expect(screen.getByLabelText("Their Google email")).toHaveValue("");
  });

  it("asks a signed-out person to sign in first", async () => {
    const { ShareError } = await import("@/store/cloud");
    shareImpl = async () => {
      throw new ShareError("signed-out");
    };
    await fill("amma@example.com");
    expect(await screen.findByText(/Sign in with Google first/)).toBeInTheDocument();
  });

  it("shows a generic error when sharing fails for another reason", async () => {
    shareImpl = async () => {
      throw new Error("boom");
    };
    await fill("amma@example.com");
    expect(await screen.findByText("Something went wrong. Please try again.")).toBeInTheDocument();
  });
});
