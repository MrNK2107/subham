import type { Metadata } from "next";
import { Wizard } from "@/ui/wizard/Wizard";

export const metadata: Metadata = { title: "New celebration" };

export default function Page() {
  return <Wizard />;
}
