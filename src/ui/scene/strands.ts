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
