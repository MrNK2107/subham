/** A one-time message for a plan's dashboard, e.g. "AI was busy, this is a starter plan". */
const key = (planId: string) => `subham.notice.${planId}`;

export function saveNotice(planId: string, message: string): void {
  try {
    sessionStorage.setItem(key(planId), message);
  } catch {
    // Not critical.
  }
}

export function takeNotice(planId: string): string | null {
  try {
    const message = sessionStorage.getItem(key(planId));
    sessionStorage.removeItem(key(planId));
    return message;
  } catch {
    return null;
  }
}
