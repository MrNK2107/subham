/** Pure geometry for strings of serial lights, kept separate from WebGL so it can be tested. */

export interface StrandSpec {
  /** Left and right anchor points in scene units. */
  from: [number, number, number];
  to: [number, number, number];
  /** How far the middle of the wire hangs below the anchors. */
  sag: number;
  bulbs: number;
  /** Phase offset for sway and chase, so strands never move in lockstep. */
  phase: number;
}

export const BULB_COLORS = ["#ffb703", "#ff4f8b", "#2ee59d", "#fff3d6"] as const;

/** A point along a hanging wire: a parabola is a close, cheap stand-in for a catenary. */
export function pointOnStrand(s: StrandSpec, t: number, sway = 0): [number, number, number] {
  const x = s.from[0] + (s.to[0] - s.from[0]) * t;
  const z = s.from[2] + (s.to[2] - s.from[2]) * t;
  const line = s.from[1] + (s.to[1] - s.from[1]) * t;
  const dip = 4 * s.sag * t * (1 - t);
  // The middle of the strand swings most; the anchors stay put.
  const swing = sway * Math.sin(Math.PI * t);
  return [x, line - dip, z + swing];
}

/**
 * Brightness of one bulb in a chase pattern, like the controller box on real serial lights:
 * a wave runs along the strand and every fourth bulb stays lit as a base.
 */
export function chase(index: number, time: number, phase: number, speed = 2.2): number {
  const wave = Math.sin(time * speed - index * 0.55 + phase);
  const base = index % 4 === 0 ? 0.55 : 0.18;
  return Math.max(base, wave > 0.35 ? 1 : wave > 0 ? 0.6 : base);
}

/** A deterministic street of strands for a given aspect ratio (wider screens get more width). */
export function layoutStrands(aspect: number): StrandSpec[] {
  const w = Math.max(6, 5.2 * aspect);
  const rows: [number, number, number, number][] = [
    // y, z, sag, density
    [3.75, 2.2, 0.75, 0.75],
    [3.5, -1.5, 1.0, 1],
    [2.9, -4.5, 1.25, 1.15],
    [3.4, -8, 1.5, 1.35],
    [2.2, -11, 1.7, 1.5],
  ];
  return rows.map(([y, z, sag, density], i) => {
    const span = w * (1 + -z * 0.09);
    const tilt = (i % 2 === 0 ? 1 : -1) * 0.35;
    return {
      from: [-span / 2, y + tilt, z],
      to: [span / 2, y - tilt, z],
      sag,
      bulbs: Math.round(26 * density * Math.min(1.6, aspect)),
      phase: i * 1.7,
    };
  });
}
