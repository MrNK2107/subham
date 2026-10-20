import type { Brief } from "@/core/types";

export const TODAY = "2026-10-20";

export const weddingBrief: Brief = {
  type: "wedding",
  title: "Priya & Arjun's wedding",
  city: "Chennai",
  tier: "metro",
  date: "2027-02-14",
  guests: 300,
  budget: 1_500_000,
  food: "veg",
  vibe: "traditional with a modern touch",
  functions: ["Haldi", "Mehendi", "Sangeet", "Wedding Ceremony", "Reception"],
  language: "en",
};

export const birthdayBrief: Brief = {
  type: "birthday",
  title: "Aarav turns 5",
  city: "Vijayawada",
  tier: "tier2",
  date: "2026-11-28",
  guests: 40,
  budget: 60_000,
  food: "mixed",
  vibe: "superheroes",
  functions: ["Birthday Party"],
  language: "te",
};
