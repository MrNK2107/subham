/** Subham's icon set: one stroke weight, round joins, drawn on a 24px grid. Decorative by default. */
const PATHS = {
  budget: "M6 5h12M6 9h12M9 5c4 0 6 2 6 4s-2 4-6 4H7l7 7",
  timeline: "M4 7h16v13H4zM4 11h16M8 3v4M16 3v4M8 15h3",
  vendors: "M9 4h6v3H9zM7 6H5v15h14V6h-2M8 12l2 2 5-5M8 18h8",
  ideas:
    "M12 3v3M5.6 5.6l2.1 2.1M3 12h3M18 12h3M16.3 7.7l2.1-2.1M9 18h6M10 21h4M8.5 14a4.5 4.5 0 1 1 7 0c-.8.9-1.5 1.8-1.5 3h-4c0-1.2-.7-2.1-1.5-3z",
  guests:
    "M9 11a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7zM2.5 20c.5-3.5 3.2-6 6.5-6s6 2.5 6.5 6M16 4.5a3.5 3.5 0 0 1 0 6.5M18 14c2 .7 3.3 2.9 3.5 6",
  assistant: "M4 5h16v11H9l-5 4zM8 9h8M8 12h5",
  bulb: "M12 3a5 5 0 0 0-3 9c.6.5 1 1.3 1 2v1h4v-1c0-.7.4-1.5 1-2a5 5 0 0 0-3-9zM10 18h4M11 21h2",
  arrow: "M5 12h14M13 6l6 6-6 6",
  mic: "M12 3a3 3 0 0 0-3 3v6a3 3 0 0 0 6 0V6a3 3 0 0 0-3-3zM5 11a7 7 0 0 0 14 0M12 18v3",
  calendar: "M4 7h16v13H4zM4 11h16M8 3v4M16 3v4M12 14v4M10 16h4",
  share:
    "M18 8a3 3 0 1 0-2.8-4M6 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6zM18 22a3 3 0 1 0 0-6 3 3 0 0 0 0 6zM8.6 13.5l6.8 4M15.4 6.5l-6.8 4",
  print: "M7 9V3h10v6M7 18H4v-8h16v8h-3M7 14h10v7H7z",
  close: "M6 6l12 12M18 6L6 18",
  plus: "M12 5v14M5 12h14",
  check: "M5 12.5l4.5 4.5L19 7",
  trash: "M4 7h16M9 7V4h6v3M6 7l1 13h10l1-13",
} as const;

export type IconName = keyof typeof PATHS;

export function Icon({
  name,
  size = 22,
  label,
}: {
  name: IconName;
  size?: number;
  label?: string;
}) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.75}
      strokeLinecap="round"
      strokeLinejoin="round"
      role={label ? "img" : undefined}
      aria-label={label}
      aria-hidden={label ? undefined : true}
      focusable="false"
    >
      <path d={PATHS[name]} />
    </svg>
  );
}
