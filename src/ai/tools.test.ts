import { describe, expect, it } from "vitest";
import { z } from "zod";
import { parseCalls, toolDeclarations } from "./tools";
import { forModel } from "./json-schema";

describe("toolDeclarations", () => {
  it("declares one tool per change type without the op field", () => {
    const tools = toolDeclarations();
    expect(tools.map((t) => t.name)).toEqual([
      "moveBudget",
      "logSpend",
      "addTask",
      "toggleTask",
      "setVendorStatus",
      "addVendor",
      "addIdea",
    ]);
    for (const tool of tools) {
      expect(tool.description.length).toBeGreaterThan(10);
      expect(JSON.stringify(tool.parameters)).not.toContain('"op"');
    }
  });
});

describe("parseCalls", () => {
  it("keeps valid calls and drops unknown or malformed ones", () => {
    const changes = parseCalls([
      { name: "moveBudget", args: { from: "b1", to: "b2", amount: 5000 } },
      { name: "deleteEverything", args: {} },
      { name: "logSpend", args: { line: "b1", amount: -4 } },
      { name: "toggleTask", args: { id: "t3" } },
    ]);
    expect(changes).toEqual([
      { op: "moveBudget", from: "b1", to: "b2", amount: 5000 },
      { op: "toggleTask", id: "t3" },
    ]);
  });

  it("accepts arguments sent as a JSON string", () => {
    expect(parseCalls([{ name: "toggleTask", args: '{"id":"t1"}' }])).toEqual([
      { op: "toggleTask", id: "t1" },
    ]);
  });
});

describe("forModel", () => {
  it("drops schema keywords model APIs reject", () => {
    const schema = forModel(z.object({ d: z.iso.date(), n: z.number().positive() }));
    const text = JSON.stringify(schema);
    expect(text).not.toContain("$schema");
    expect(text).not.toContain("pattern");
    expect(text).not.toContain("exclusiveMinimum");
    expect(text).not.toContain("additionalProperties");
  });
});
