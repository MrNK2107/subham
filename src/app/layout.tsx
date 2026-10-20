import type { Metadata, Viewport } from "next";
import {
  Fraunces,
  Noto_Sans,
  Noto_Sans_Devanagari,
  Noto_Sans_Tamil,
  Noto_Sans_Telugu,
} from "next/font/google";
import { headers } from "next/headers";
import type { ReactNode } from "react";
import { Header } from "@/ui/shell/Header";
import { SkipLink } from "@/ui/shell/SkipLink";
import { SITE_URL } from "@/ui/site";
import "./globals.css";

// Fonts are self-hosted at build time. Unicode ranges mean each script downloads only when used.
const serif = Fraunces({ subsets: ["latin"], variable: "--font-serif", display: "swap" });
const sans = Noto_Sans({ subsets: ["latin"], variable: "--font-sans", display: "swap" });
const deva = Noto_Sans_Devanagari({
  subsets: ["devanagari"],
  weight: ["400", "600"],
  variable: "--font-deva",
  display: "swap",
  preload: false,
});
const tamil = Noto_Sans_Tamil({
  subsets: ["tamil"],
  weight: ["400", "600"],
  variable: "--font-tamil",
  display: "swap",
  preload: false,
});
const telugu = Noto_Sans_Telugu({
  subsets: ["telugu"],
  weight: ["400", "600"],
  variable: "--font-telugu",
  display: "swap",
  preload: false,
});

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: { default: "Subham · AI celebration planner for India", template: "%s · Subham" },
  description:
    "Plan weddings, birthdays, community events and festivals in English, Hindi, Tamil, Telugu and more: budgets, timelines, vendor checklists, guest lists and personalised ideas, with an AI assistant.",
  applicationName: "Subham",
  openGraph: {
    title: "Subham · AI celebration planner for India",
    description: "Budgets, timelines, vendors and ideas for every function of your celebration.",
    type: "website",
    locale: "en_IN",
  },
};

export const viewport: Viewport = { themeColor: "#9e1b32", width: "device-width", initialScale: 1 };

export default async function RootLayout({ children }: { children: ReactNode }) {
  // Reading request headers renders every page per request, so each gets its own CSP nonce.
  await headers();
  return (
    <html
      lang="en"
      className={`${serif.variable} ${sans.variable} ${deva.variable} ${tamil.variable} ${telugu.variable}`}
    >
      <body>
        <SkipLink />
        <div className="toran" aria-hidden="true" />
        <Header />
        <main id="main" tabIndex={-1}>
          {children}
        </main>
      </body>
    </html>
  );
}
