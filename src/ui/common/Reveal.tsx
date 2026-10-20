"use client";

import { useAnimate, useInView, useReducedMotion } from "motion/react";
import { useEffect, useRef, type ElementType, type ReactNode } from "react";

interface Props {
  children: ReactNode;
  as?: ElementType;
  className?: string;
  delay?: number;
  /** Animate on mount instead of when scrolled into view (first viewport). */
  immediate?: boolean;
}

/**
 * Content is visible by default (no JavaScript, no animation, reduced motion). When it enters the
 * viewport it warms up like a bulb: from dim and soft to full. Motion animates through the CSSOM,
 * so no inline style attributes are rendered and the strict CSP holds.
 */
export function Reveal({ children, as: Tag = "div", className, delay = 0, immediate }: Props) {
  const [scope, animate] = useAnimate<HTMLElement>();
  const inView = useInView(scope, { once: true, amount: 0.25 });
  const reduce = useReducedMotion();

  useEffect(() => {
    if (reduce || !(immediate || inView) || !scope.current) return;
    animate(
      scope.current,
      { opacity: [0, 1], y: [28, 0], filter: ["blur(6px)", "blur(0px)"] },
      { duration: 0.9, delay, ease: [0.16, 1, 0.3, 1] },
    );
  }, [inView, immediate, reduce, animate, scope, delay]);

  return (
    <Tag ref={scope} className={className}>
      {children}
    </Tag>
  );
}

/**
 * Plays a short entrance whenever `key` changes (a new tab, the next wizard step), never on first
 * render, so server-rendered markup stays free of inline styles.
 */
export function useEnterOnChange<T extends HTMLElement>(
  key: unknown,
  from: "right" | "below" = "below",
) {
  const [scope, animate] = useAnimate<T>();
  const reduce = useReducedMotion();
  // Compare with the previous key (not a "first run" flag) so double-invoked effects stay still.
  const previous = useRef(key);
  useEffect(() => {
    if (Object.is(previous.current, key)) return;
    previous.current = key;
    if (reduce || !scope.current) return;
    animate(
      scope.current,
      from === "right" ? { opacity: [0, 1], x: [32, 0] } : { opacity: [0, 1], y: [14, 0] },
      { type: "spring", stiffness: 120, damping: 18 },
    );
  }, [key, reduce, animate, scope, from]);
  return scope;
}
