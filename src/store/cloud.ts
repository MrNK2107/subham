import type { User } from "firebase/auth";
import { PlanSchema, type Plan } from "@/core/types";
import { getFirebase } from "./firebase";
import { loadPlans, savePlan, setSyncTarget } from "./local";

export type Role = "editor" | "viewer";

/**
 * Firestore layout: plans/{planId} = { ownerId, editors: [emails], viewers: [emails], data, updatedAt }.
 * Rules let the owner and editors write `data`, viewers read, and only the owner change sharing.
 */
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
    await fs.updateDoc(ref, { data: plan, updatedAt: plan.updatedAt });
  } else {
    await fs.setDoc(ref, {
      ownerId: uid,
      editors: [],
      viewers: [],
      data: plan,
      updatedAt: plan.updatedAt,
    });
  }
}

export async function removePlan(id: string): Promise<void> {
  const { db, fs } = await firestore();
  await fs.deleteDoc(fs.doc(db, "plans", id));
}

/** Plans this person owns or that family members shared with them. */
export async function pullPlans(user: User): Promise<Plan[]> {
  const { db, fs } = await firestore();
  const plans = fs.collection(db, "plans");
  const queries = [fs.query(plans, fs.where("ownerId", "==", user.uid))];
  if (user.email) {
    queries.push(fs.query(plans, fs.where("editors", "array-contains", user.email)));
    queries.push(fs.query(plans, fs.where("viewers", "array-contains", user.email)));
  }
  const snaps = await Promise.all(queries.map((q) => fs.getDocs(q)));
  return snaps.flatMap((s) =>
    s.docs.flatMap((d) => {
      const plan = PlanSchema.safeParse(d.data().data);
      return plan.success ? [plan.data] : [];
    }),
  );
}

export async function sharePlan(id: string, email: string, role: Role): Promise<void> {
  const { db, fs } = await firestore();
  await fs.updateDoc(fs.doc(db, "plans", id), {
    [role === "editor" ? "editors" : "viewers"]: fs.arrayUnion(email.trim().toLowerCase()),
  });
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
