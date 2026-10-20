import type { StrandSpec } from "./strands";

/** Half the width of the street, in scene units (roughly metres). */
export const LANE_HALF = 4.2;

export interface House {
  x: number;
  z: number;
  width: number;
  depth: number;
  height: number;
  /** 0..1 brightness variation so facades never read as one flat block. */
  tone: number;
}

/** A curtain of vertical light strings (jhalar) hanging down a house front. */
export interface Curtain {
  x: number;
  zFrom: number;
  zTo: number;
  top: number;
  bottom: number;
  strings: number;
  /** Mostly warm white or amber, the way houses are actually dressed for weddings. */
  palette: "warm" | "amber" | "mixed";
}

export interface Lane {
  houses: House[];
  crossings: StrandSpec[];
  curtains: Curtain[];
  windows: [number, number, number][];
}

function random(seed: number) {
  let s = seed;
  return () => (s = (s * 16807) % 2147483647) / 2147483647;
}

/** A narrow Indian street at night: houses on both sides, strands across, curtains down the fronts. */
export function buildLane({
  depth = 60,
  curtains = 10,
  seed = 11,
}: { depth?: number; curtains?: number; seed?: number } = {}): Lane {
  const rand = random(seed);
  const houses: House[] = [];
  const windows: [number, number, number][] = [];

  for (const side of [-1, 1]) {
    let z = 6;
    while (z > -depth) {
      const width = 2.2 + rand() * 2.6; // frontage along the street
      const houseDepth = 3 + rand() * 3;
      const height = 5 + rand() * 7;
      const cz = z - width / 2;
      houses.push({
        x: side * (LANE_HALF + houseDepth / 2),
        z: cz,
        width: houseDepth,
        depth: width,
        height,
        tone: rand(),
      });
      // A few lit windows on the street-facing wall.
      for (let wy = 2.2; wy < height - 0.8; wy += 1.6) {
        for (let wz = z - 0.6; wz > z - width + 0.4; wz -= 1.1) {
          if (rand() > 0.72 && wz < -2) windows.push([side * (LANE_HALF - 0.02), wy, wz]);
        }
      }
      z -= width + 0.15;
    }
  }

  const crossings: StrandSpec[] = [];
  for (let z = 1.5, i = 0; z > -depth + 4; z -= 4.2 + rand() * 1.4, i++) {
    const y = 5.3 + rand() * 0.9;
    crossings.push({
      from: [-LANE_HALF, y + (rand() - 0.5) * 0.8, z],
      to: [LANE_HALF, y + (rand() - 0.5) * 0.8, z - (rand() - 0.5) * 1.2],
      sag: 0.9 + rand() * 0.5,
      bulbs: 34,
      phase: i * 0.9,
    });
  }

  const dressed: Curtain[] = [];
  const candidates = houses.filter((h) => h.z < 2 && h.z > -depth * 0.7);
  const palettes: Curtain["palette"][] = ["warm", "amber", "warm", "mixed"];
  for (let i = 0; i < curtains && candidates.length; i++) {
    const h = candidates.splice(Math.floor(rand() * candidates.length), 1)[0]!;
    const side = Math.sign(h.x);
    dressed.push({
      x: side * (LANE_HALF - 0.05),
      zFrom: h.z + h.depth / 2 - 0.2,
      zTo: h.z - h.depth / 2 + 0.2,
      top: h.height - 0.2,
      bottom: 1 + rand() * 1.4,
      strings: Math.round(h.depth / 0.32),
      palette: palettes[i % palettes.length]!,
    });
  }

  return { houses, crossings, curtains: dressed, windows };
}
