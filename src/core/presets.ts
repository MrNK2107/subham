import type { EventType } from "./types";

/** Functions (sub-events) suggested for each event type. People can rename, add or remove them. */
export const PRESETS: Record<EventType, string[]> = {
  wedding: ["Haldi", "Mehendi", "Sangeet", "Wedding Ceremony", "Reception"],
  birthday: ["Birthday Party"],
  community: ["Setup & Decor", "Puja / Ceremony", "Community Meal", "Cultural Programme"],
  festival: ["Puja", "Celebration"],
};

/** Optional functions people often add, offered as one-tap chips in the wizard. */
export const EXTRA_FUNCTIONS: Record<EventType, string[]> = {
  wedding: ["Engagement", "Nalangu", "Pellikuthuru", "Baraat", "Cocktail Night"],
  birthday: ["Cake Cutting", "Puja", "Kids' Games"],
  community: ["Sports Day", "Blood Donation Camp", "Prize Distribution"],
  festival: ["Rangoli Contest", "Bhajan Sandhya", "Fireworks"],
};

export interface FunctionDefaults {
  /** Days relative to the main date. */
  dayOffset: number;
  start: string;
  /** Relative share of the function budget. */
  weight: number;
}

const KNOWN: Record<string, FunctionDefaults> = {
  engagement: { dayOffset: -30, start: "18:00", weight: 10 },
  haldi: { dayOffset: -2, start: "09:00", weight: 8 },
  nalangu: { dayOffset: -1, start: "10:00", weight: 6 },
  pellikuthuru: { dayOffset: -2, start: "09:00", weight: 6 },
  mehendi: { dayOffset: -2, start: "16:00", weight: 10 },
  sangeet: { dayOffset: -1, start: "19:00", weight: 16 },
  "cocktail night": { dayOffset: -1, start: "20:00", weight: 12 },
  baraat: { dayOffset: 0, start: "17:00", weight: 8 },
  "wedding ceremony": { dayOffset: 0, start: "07:00", weight: 40 },
  reception: { dayOffset: 0, start: "19:00", weight: 26 },
  "birthday party": { dayOffset: 0, start: "17:00", weight: 80 },
  "cake cutting": { dayOffset: 0, start: "19:00", weight: 10 },
  puja: { dayOffset: 0, start: "08:00", weight: 25 },
  "kids' games": { dayOffset: 0, start: "16:00", weight: 10 },
  "setup & decor": { dayOffset: -1, start: "10:00", weight: 25 },
  "puja / ceremony": { dayOffset: 0, start: "08:00", weight: 20 },
  "community meal": { dayOffset: 0, start: "12:30", weight: 35 },
  "cultural programme": { dayOffset: 0, start: "18:00", weight: 20 },
  celebration: { dayOffset: 0, start: "18:00", weight: 60 },
};

export const normaliseName = (name: string) => name.trim().toLowerCase().replace(/\s+/g, " ");

export function functionDefaults(name: string): FunctionDefaults {
  return KNOWN[normaliseName(name)] ?? { dayOffset: 0, start: "18:00", weight: 15 };
}
