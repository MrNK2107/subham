import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Subham · AI celebration planner",
    short_name: "Subham",
    description:
      "Plan weddings, birthdays, community events and festivals with budgets, timelines, vendors and ideas.",
    start_url: "/",
    display: "standalone",
    background_color: "#fbf6ee",
    theme_color: "#9e1b32",
    icons: [{ src: "/icon.svg", sizes: "any", type: "image/svg+xml" }],
  };
}
