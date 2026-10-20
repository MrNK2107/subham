import type { Metadata } from "next";
import { Dashboard } from "@/ui/dashboard/Dashboard";

export const metadata: Metadata = { title: "Your plan", robots: { index: false } };

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <Dashboard id={id} />;
}
