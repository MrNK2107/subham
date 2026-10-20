import type { Metadata } from "next";
import { PlanList } from "@/ui/plans/PlanList";

export const metadata: Metadata = { title: "My plans", robots: { index: false } };

export default function Page() {
  return <PlanList />;
}
