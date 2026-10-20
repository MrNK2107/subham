const MS_PER_DAY = 86_400_000;
const toTime = (iso: string) => Date.parse(`${iso}T00:00:00Z`);

/** Calendar arithmetic on YYYY-MM-DD strings, independent of the device's time zone. */
export function addDays(iso: string, days: number): string {
  return new Date(toTime(iso) + days * MS_PER_DAY).toISOString().slice(0, 10);
}

export function daysUntil(date: string, today: string): number {
  return Math.round((toTime(date) - toTime(today)) / MS_PER_DAY);
}

/** `daysBefore` the target date, but never before today and never after the target. */
export function dueDate(target: string, today: string, daysBefore: number): string {
  const due = addDays(target, -Math.max(0, daysBefore));
  if (due < today) return today < target ? today : target;
  return due;
}

/** Today's date in India, YYYY-MM-DD. */
export function todayInIndia(now = new Date()): string {
  return new Date(now.getTime() + 330 * 60_000).toISOString().slice(0, 10);
}
