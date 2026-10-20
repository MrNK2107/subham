"use client";

import { useEffect, useState } from "react";

/**
 * True once the page has loaded and the browser has a quiet moment. Heavy decorative work (the
 * WebGL street) waits for this so it never competes with hydration or the first paint of the text.
 */
export function useIdle(timeout = 2000): boolean {
  const [idle, setIdle] = useState(false);

  useEffect(() => {
    let cancel = () => {};
    const schedule = () => {
      if (typeof window.requestIdleCallback === "function") {
        const handle = window.requestIdleCallback(() => setIdle(true), { timeout });
        cancel = () => window.cancelIdleCallback(handle);
      } else {
        const handle = window.setTimeout(() => setIdle(true), 200);
        cancel = () => window.clearTimeout(handle);
      }
    };
    if (document.readyState === "complete") {
      schedule();
      return () => cancel();
    }
    window.addEventListener("load", schedule, { once: true });
    return () => {
      window.removeEventListener("load", schedule);
      cancel();
    };
  }, [timeout]);

  return idle;
}
