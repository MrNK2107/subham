import type { z } from "zod";
import { ChangeSchema, type Change } from "@/core/types";
import type { RawCall, ToolDeclaration } from "./contracts";
import { forModel } from "./json-schema";

const DESCRIPTIONS: Record<Change["op"], string> = {
  moveBudget:
    "Move money between two budget lines (use their ids). The plan's total stays the same; only unspent money can move.",
  logSpend: "Record an amount already paid against a budget line.",
  addTask: "Add a to-do to the timeline, due on or before the last function (YYYY-MM-DD).",
  toggleTask: "Mark a timeline task done, or not done if it already is.",
  setVendorStatus:
    "Update a vendor's booking status (todo, contacted, booked) and optionally the quoted price in rupees.",
  addVendor:
    "Add a vendor category to the checklist, with questions to ask before paying an advance.",
  addIdea: "Add a personalised idea (theme, decor, food, activity or gift) to the plan.",
};

/** One tool per change type, with parameters generated from the same zod schemas the app uses. */
export function toolDeclarations(): ToolDeclaration[] {
  return ChangeSchema.options.map((option) => {
    const name = option.shape.op.value;
    return {
      name,
      description: DESCRIPTIONS[name],
      parameters: forModel((option as z.ZodObject).omit({ op: true })),
    };
  });
}

/** The model's tool calls as validated changes; unknown tools and bad arguments are dropped. */
export function parseCalls(calls: RawCall[]): Change[] {
  return calls.flatMap((call) => {
    let args = call.args;
    if (typeof args === "string") {
      try {
        args = JSON.parse(args);
      } catch {
        return [];
      }
    }
    if (typeof args !== "object" || args === null) args = {};
    const parsed = ChangeSchema.safeParse({ ...args, op: call.name });
    return parsed.success ? [parsed.data] : [];
  });
}
