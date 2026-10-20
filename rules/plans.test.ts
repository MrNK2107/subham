import {
  assertFails,
  assertSucceeds,
  initializeTestEnvironment,
  type RulesTestEnvironment,
} from "@firebase/rules-unit-testing";
import { doc, getDoc, setDoc, updateDoc, deleteDoc } from "firebase/firestore";
import { readFileSync } from "node:fs";
import { afterAll, beforeAll, beforeEach, describe, it } from "vitest";
import { assemblePlan } from "@/core/assemble";
import { templateBlueprint } from "@/core/templates";
import { toRecord } from "@/store/cloud";
import { TODAY, weddingBrief } from "@/test/fixtures";

let env: RulesTestEnvironment;

const plan = assemblePlan(weddingBrief, templateBlueprint(weddingBrief), {
  id: "p1",
  today: TODAY,
  now: new Date("2026-10-20T10:00:00Z"),
});
const record = toRecord("owner", plan, ["aunt@example.com"], ["cousin@example.com"]);
const data = record.data;

const as = (uid: string, email?: string) =>
  env.authenticatedContext(uid, email ? { email, email_verified: true } : {}).firestore();

beforeAll(async () => {
  env = await initializeTestEnvironment({
    projectId: "demo-subham",
    firestore: { rules: readFileSync("firestore.rules", "utf8") },
  });
});

afterAll(async () => {
  await env?.cleanup();
});

beforeEach(async () => {
  await env.clearFirestore();
  await env.withSecurityRulesDisabled(async (ctx) => {
    await setDoc(doc(ctx.firestore(), "plans/p1"), record);
  });
});

describe("plans/{planId}", () => {
  it("lets the owner read, update and delete", async () => {
    const db = as("owner");
    await assertSucceeds(getDoc(doc(db, "plans/p1")));
    await assertSucceeds(updateDoc(doc(db, "plans/p1"), { updatedAt: "2026-10-21T00:00:00Z" }));
    await assertSucceeds(deleteDoc(doc(db, "plans/p1")));
  });

  it("lets a signed-in person create their own plan", async () => {
    const db = as("someone");
    const mine = { ...record, ownerId: "someone", data: { ...data, id: "p2" } };
    await assertSucceeds(setDoc(doc(db, "plans/p2"), mine));
  });

  it("refuses creating a plan in someone else's name", async () => {
    const db = as("someone");
    await assertFails(setDoc(doc(db, "plans/p3"), { ...record, data: { ...data, id: "p3" } }));
  });

  it("lets an editor change the plan but not who it is shared with", async () => {
    const db = as("aunt", "aunt@example.com");
    await assertSucceeds(updateDoc(doc(db, "plans/p1"), { updatedAt: "2026-10-22T00:00:00Z" }));
    await assertFails(updateDoc(doc(db, "plans/p1"), { editors: ["aunt@example.com", "x@y.z"] }));
    await assertFails(deleteDoc(doc(db, "plans/p1")));
  });

  it("lets a viewer read but not write", async () => {
    const db = as("cousin", "cousin@example.com");
    await assertSucceeds(getDoc(doc(db, "plans/p1")));
    await assertFails(updateDoc(doc(db, "plans/p1"), { updatedAt: "x" }));
  });

  it("denies strangers and signed-out visitors", async () => {
    await assertFails(getDoc(doc(as("stranger", "stranger@example.com"), "plans/p1")));
    await assertFails(getDoc(doc(env.unauthenticatedContext().firestore(), "plans/p1")));
  });

  it("rejects malformed documents", async () => {
    const db = as("owner");
    await assertFails(updateDoc(doc(db, "plans/p1"), { extra: true }));
    await assertFails(
      updateDoc(doc(db, "plans/p1"), { data: { ...data, brief: { ...data.brief, guests: 0 } } }),
    );
    await assertFails(updateDoc(doc(db, "plans/p1"), { data: { ...data, id: "other" } }));
  });

  it("keeps every other collection closed", async () => {
    await assertFails(setDoc(doc(as("owner"), "users/owner"), { a: 1 }));
  });
});
