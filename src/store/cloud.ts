import type { User } from "firebase/auth";
import { PlanSchema, type Plan } from "@/core/types";
import { getFirebase } from "./firebase";
import { loadPlans, savePlan, setSyncTarget } from "./local";

export type Role = "editor" | "viewer";

/**
 * Firestore layout: plans/{planId} = { ownerId, editors: [emails], viewers: [emails], data, updatedAt }.
 * Rules let the owner and editors write `data`, viewers read, and only the owner change sharing.
 */
export interface PlanRecord {
  ownerId: string;
  editors: string[];
  viewers: string[];
  data: Plan;
  updatedAt: string;
}

/** The Firestore document for a plan. JSON round-trip drops undefined fields, which Firestore rejects. */
export function toRecord(
  ownerId: string,
  plan: Plan,
  editors: string[] = [],
  viewers: string[] = [],
): PlanRecord {
  return {
    ownerId,
    editors,
    viewers,
    data: JSON.parse(JSON.stringify(plan)),
    updatedAt: plan.updatedAt,
  };
}

async function firestore() {
  const fb = await getFirebase();
  if (!fb) throw new Error("Firebase isn't configured");
  return { db: fb.db, fs: await import("firebase/firestore") };
}

export async function pushPlan(uid: string, plan: Plan): Promise<void> {
  const { db, fs } = await firestore();
  const ref = fs.doc(db, "plans", plan.id);
  const snap = await fs.getDoc(ref);
  if (snap.exists()) {
    const { data, updatedAt } = toRecord(uid, plan);
    await fs.updateDoc(ref, { data, updatedAt });
  } else {
    await fs.setDoc(ref, toRecord(uid, plan));
  }
}

export async function removePlan(id: string): Promise<void> {
  const { db, fs } = await firestore();
  await fs.deleteDoc(fs.doc(db, "plans", id));
}

type FirestoreModule = typeof import("firebase/firestore");

/**
 * The queries sync runs: plans owned by this person, and plans shared with their email as editor or
 * viewer. Emails are stored lowercase, matching the rules' `email.lower()`.
 */
export function planQueries(
  fs: FirestoreModule,
  db: import("firebase/firestore").Firestore,
  uid: string,
  email: string | null,
) {
  const plans = fs.collection(db, "plans");
  const queries = [fs.query(plans, fs.where("ownerId", "==", uid))];
  if (email) {
    const lower = email.toLowerCase();
    queries.push(fs.query(plans, fs.where("editors", "array-contains", lower)));
    queries.push(fs.query(plans, fs.where("viewers", "array-contains", lower)));
  }
  return queries;
}

/** Plans this person owns or that family shared with them. One failed query doesn't block the rest. */
export async function pullPlans(user: User): Promise<Plan[]> {
  const { db, fs } = await firestore();
  const results = await Promise.allSettled(
    planQueries(fs, db, user.uid, user.email).map((q) => fs.getDocs(q)),
  );
  return results.flatMap((r) => {
    if (r.status === "rejected") {
      console.warn("A plan query failed", r.reason);
      return [];
    }
    return r.value.docs.flatMap((d) => {
      const plan = PlanSchema.safeParse(d.data().data);
      return plan.success ? [plan.data] : [];
    });
  });
}

/** Why sharing failed, so the person sees the right message. */
export class ShareError extends Error {
  constructor(readonly reason: "signed-out" | "failed") {
    super(reason);
  }
}

/**
 * Shares a plan by email. Saves the latest version to the cloud first, so the document exists and
 * belongs to this person before the sharing list changes (only owners may change it).
 */
export async function sharePlan(plan: Plan, email: string, role: Role): Promise<void> {
  const fb = await getFirebase();
  const user = fb?.auth.currentUser;
  if (!fb || !user) throw new ShareError("signed-out");
  try {
    await pushPlan(user.uid, plan);
    const fs = await import("firebase/firestore");
    await fs.updateDoc(fs.doc(fb.db, "plans", plan.id), {
      [role === "editor" ? "editors" : "viewers"]: fs.arrayUnion(email.trim().toLowerCase()),
    });
  } catch {
    throw new ShareError("failed");
  }
}

/** After sign-in: merge cloud and device plans (newest wins) and mirror future saves. */
export async function startSync(user: User): Promise<void> {
  const remote = await pullPlans(user);
  const local = new Map(loadPlans().map((p) => [p.id, p]));
  for (const plan of remote) {
    const mine = local.get(plan.id);
    if (!mine || mine.updatedAt < plan.updatedAt) savePlan(plan, { mirror: false });
  }
  const remoteIds = new Map(remote.map((p) => [p.id, p.updatedAt]));
  const report = (e: unknown) => console.warn("Cloud sync failed", e);
  for (const plan of local.values()) {
    const cloud = remoteIds.get(plan.id);
    if (!cloud || cloud < plan.updatedAt) pushPlan(user.uid, plan).catch(report);
  }
  setSyncTarget({
    save: (plan) => void pushPlan(user.uid, plan).catch(report),
    remove: (id) => void removePlan(id).catch(report),
  });
}

export function stopSync(): void {
  setSyncTarget(null);
}
