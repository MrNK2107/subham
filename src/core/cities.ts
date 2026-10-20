import type { EventType, Tier } from "./types";

const normalise = (city: string) => city.trim().toLowerCase().replace(/\s+/g, " ");

const METROS = new Set([
  "mumbai",
  "bombay",
  "delhi",
  "new delhi",
  "bengaluru",
  "bangalore",
  "chennai",
  "madras",
  "hyderabad",
  "secunderabad",
  "kolkata",
  "calcutta",
  "pune",
  "ahmedabad",
  "gurugram",
  "gurgaon",
  "noida",
]);

const TIER2 = new Set([
  "jaipur",
  "lucknow",
  "kanpur",
  "nagpur",
  "indore",
  "bhopal",
  "patna",
  "vadodara",
  "surat",
  "ludhiana",
  "agra",
  "nashik",
  "rajkot",
  "varanasi",
  "amritsar",
  "chandigarh",
  "coimbatore",
  "madurai",
  "tiruchirappalli",
  "trichy",
  "salem",
  "vijayawada",
  "visakhapatnam",
  "vizag",
  "guntur",
  "warangal",
  "tirupati",
  "mysuru",
  "mysore",
  "mangaluru",
  "mangalore",
  "hubli",
  "kochi",
  "cochin",
  "thiruvananthapuram",
  "trivandrum",
  "kozhikode",
  "thrissur",
  "bhubaneswar",
  "guwahati",
  "dehradun",
  "raipur",
  "ranchi",
  "goa",
  "panaji",
  "jodhpur",
  "udaipur",
  "aurangabad",
  "puducherry",
  "pondicherry",
  "jamshedpur",
]);

/** Cost tier of a city: drives per-guest cost estimates. */
export function tierOf(city: string): Tier {
  const name = normalise(city);
  if (METROS.has(name)) return "metro";
  if (TIER2.has(name)) return "tier2";
  return "tier3";
}

/**
 * Rough all-in cost per guest in rupees (venue, food, decor, services), by event type and tier.
 * Used only to say whether a budget is tight or comfortable, never to set allocations.
 */
export const PER_GUEST: Record<EventType, Record<Tier, number>> = {
  wedding: { metro: 3500, tier2: 2500, tier3: 1800 },
  birthday: { metro: 1500, tier2: 1000, tier3: 700 },
  community: { metro: 600, tier2: 400, tier3: 300 },
  festival: { metro: 800, tier2: 550, tier3: 400 },
};
