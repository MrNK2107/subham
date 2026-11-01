/**
 * The controller box on a real string of serial lights: it steps through a few modes (chase,
 * alternate flash, steady glow) and every bulb on the strand follows. Here each mode drives the
 * brightness of the baked light groups; pure so it can be tested without WebGL.
 */

/** Order matches the layer images: ambient, four chase phases, two curtain sets. */
export const GROUPS = [
  "ambient",
  "chase0",
  "chase1",
  "chase2",
  "chase3",
  "curtain0",
  "curtain1",
] as const;

const MODE_SECONDS = 9;
const FADE_SECONDS = 1.2;
/** Tungsten-style lamps never snap: a short ramp on and off. */
const OFF = 0.04;

function smoothstep(a: number, b: number, x: number): number {
  const t = Math.min(1, Math.max(0, (x - a) / (b - a)));
  return t * t * (3 - 2 * t);
}

function fract(x: number): number {
  return x - Math.floor(x);
}

/** Brightness of chase phase k (0..3) in each mode at time t. */
const MODES: ((k: number, t: number) => number)[] = [
  // Chase: two neighbouring phases lit, the pair walking along the strand.
  (k, t) => {
    const p = fract(t * 1.5 - k / 4);
    return OFF + (1 - OFF) * smoothstep(0, 0.06, p) * (1 - smoothstep(0.44, 0.52, p));
  },
  // Alternate flash: odd and even bulbs take turns.
  (k, t) => {
    const p = fract(t * 0.9 + (k % 2) * 0.5);
    return OFF + (1 - OFF) * smoothstep(0, 0.08, p) * (1 - smoothstep(0.45, 0.55, p));
  },
  // Steady glow with a slow breath, the way most houses leave them for the evening.
  (k, t) => 0.82 + 0.18 * Math.sin(t * 0.8 + k * 0.3),
];

/**
 * Weight for every light group at time t (seconds). `burst` (0..1) flares the whole street, used
 * when someone submits their celebration.
 */
export function groupLevels(t: number, burst = 0): number[] {
  const slot = Math.floor(t / MODE_SECONDS);
  const into = t - slot * MODE_SECONDS;
  const current = MODES[slot % MODES.length]!;
  const next = MODES[(slot + 1) % MODES.length]!;
  const blend = smoothstep(MODE_SECONDS - FADE_SECONDS, MODE_SECONDS, into);
  const chase = [0, 1, 2, 3].map((k) => {
    const level = current(k, t) * (1 - blend) + next(k, t) * blend;
    return level + burst * 1.4;
  });
  // Curtains twinkle gently and out of step with each other.
  const curtain = [0, 1].map((c) => 0.86 + 0.14 * Math.sin(t * 1.7 + c * Math.PI) + burst * 0.7);
  return [1, ...chase, ...curtain];
}

/** A single composed frame for people who prefer reduced motion: everything steadily on. */
export function stillLevels(): number[] {
  return GROUPS.map(() => 1);
}
