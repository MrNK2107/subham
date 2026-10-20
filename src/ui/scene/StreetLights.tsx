"use client";

import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { useEffect, useMemo, useRef, useState } from "react";
import * as THREE from "three";
import { sceneSignal } from "./signal";
import { BULB_COLORS, chase, layoutStrands, pointOnStrand } from "./strands";

const WIRE_SEGMENTS = 48;

function glowTexture(): THREE.Texture {
  const size = 128;
  const canvas = document.createElement("canvas");
  canvas.width = canvas.height = size;
  const ctx = canvas.getContext("2d")!;
  const g = ctx.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
  g.addColorStop(0, "rgba(255,255,255,1)");
  g.addColorStop(0.18, "rgba(255,255,255,0.85)");
  g.addColorStop(0.45, "rgba(255,255,255,0.18)");
  g.addColorStop(1, "rgba(255,255,255,0)");
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, size, size);
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

function Street({ still }: { still: boolean }) {
  const { size, camera } = useThree();
  const aspect = size.width / Math.max(size.height, 1);
  const strands = useMemo(() => layoutStrands(aspect), [aspect]);
  const glow = useMemo(() => glowTexture(), []);
  const pointer = useRef({ x: 0, y: 0 });
  const bokehRef = useRef<THREE.Points>(null);

  const { wires, lines, bulbs, colors, base } = useMemo(() => {
    const total = strands.reduce((n, s) => n + s.bulbs, 0);
    const positions = new Float32Array(total * 3);
    const colors = new Float32Array(total * 3);
    const base = new Float32Array(total * 3);
    let k = 0;
    strands.forEach((s, si) => {
      for (let i = 0; i < s.bulbs; i++, k++) {
        const c = new THREE.Color(BULB_COLORS[(i + si) % BULB_COLORS.length]);
        base.set([c.r, c.g, c.b], k * 3);
      }
    });
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute("color", new THREE.BufferAttribute(colors, 3));
    const wireMaterial = new THREE.LineBasicMaterial({
      color: "#3d4686",
      transparent: true,
      opacity: 0.85,
    });
    const wires = strands.map(() => {
      const g = new THREE.BufferGeometry();
      g.setAttribute(
        "position",
        new THREE.BufferAttribute(new Float32Array((WIRE_SEGMENTS + 1) * 3), 3),
      );
      return g;
    });
    const lines = wires.map((g) => new THREE.Line(g, wireMaterial));
    return { wires, lines, bulbs: geometry, colors, base };
  }, [strands]);

  // Rooftops, windows and stars: generated once, deterministic.
  const backdrop = useMemo(() => {
    const roofs: { x: number; w: number; h: number; z: number; shade: string }[] = [];
    const windows: number[] = [];
    let seed = 7;
    const rand = () => (seed = (seed * 9301 + 49297) % 233280) / 233280;
    for (const [z, shade] of [
      [-7, "#12174a"],
      [-12, "#0d1238"],
    ] as const) {
      let x = -16;
      while (x < 16) {
        const w = 1.4 + rand() * 2.2;
        const h = 1.2 + rand() * (z === -7 ? 2.4 : 3.6);
        roofs.push({ x: x + w / 2, w, h, z, shade });
        for (let wy = 0.4; wy < h - 0.3; wy += 0.55) {
          for (let wx = -w / 2 + 0.35; wx < w / 2 - 0.2; wx += 0.5) {
            if (rand() > 0.62) windows.push(x + w / 2 + wx, -2.2 + wy, z + 0.05);
          }
        }
        x += w + 0.08;
      }
    }
    // Out-of-focus bulbs close to the camera give the street depth, like a lens wide open.
    const bokeh: number[] = [];
    const bokehColors: number[] = [];
    for (let i = 0; i < 34; i++) {
      bokeh.push((rand() - 0.5) * 16, -1 + rand() * 6, 2.5 + rand() * 2.5);
      const c = new THREE.Color(BULB_COLORS[i % BULB_COLORS.length]);
      bokehColors.push(c.r, c.g, c.b);
    }
    const stars: number[] = [];
    for (let i = 0; i < 260; i++)
      stars.push((rand() - 0.5) * 50, 2 + rand() * 12, -20 - rand() * 6);
    return {
      roofs,
      windows: new Float32Array(windows),
      stars: new Float32Array(stars),
      bokeh: new Float32Array(bokeh),
      bokehColors: new Float32Array(bokehColors),
    };
  }, []);

  useEffect(() => {
    const onMove = (e: PointerEvent) => {
      pointer.current = {
        x: (e.clientX / window.innerWidth) * 2 - 1,
        y: (e.clientY / window.innerHeight) * 2 - 1,
      };
    };
    window.addEventListener("pointermove", onMove, { passive: true });
    return () => window.removeEventListener("pointermove", onMove);
  }, []);

  useFrame(({ clock }) => {
    const t = still ? 2.4 : clock.elapsedTime;
    const sinceBurst = performance.now() - sceneSignal.burstAt;
    const burst = sinceBurst < 1800 ? 1 - sinceBurst / 1800 : 0;
    const position = bulbs.getAttribute("position") as THREE.BufferAttribute;
    let k = 0;
    strands.forEach((s, si) => {
      const sway = still ? 0 : 0.18 * Math.sin(t * 0.9 + s.phase) + 0.05 * Math.sin(t * 2.3 + si);
      const wire = wires[si]!.getAttribute("position") as THREE.BufferAttribute;
      for (let j = 0; j <= WIRE_SEGMENTS; j++) {
        const [x, y, z] = pointOnStrand(s, j / WIRE_SEGMENTS, sway);
        wire.setXYZ(j, x, y, z);
      }
      wire.needsUpdate = true;
      for (let i = 0; i < s.bulbs; i++, k++) {
        const [x, y, z] = pointOnStrand(s, (i + 0.5) / s.bulbs, sway);
        position.setXYZ(k, x, y - 0.09, z);
        const b = Math.min(1, chase(i, t, s.phase, 2.2 + burst * 9) + burst * 0.6);
        colors[k * 3] = base[k * 3]! * b;
        colors[k * 3 + 1] = base[k * 3 + 1]! * b;
        colors[k * 3 + 2] = base[k * 3 + 2]! * b;
      }
    });
    position.needsUpdate = true;
    (bulbs.getAttribute("color") as THREE.BufferAttribute).needsUpdate = true;

    if (bokehRef.current && !still) bokehRef.current.position.x = Math.sin(t * 0.12) * 0.8;

    // Gentle parallax towards the pointer.
    camera.position.x += (pointer.current.x * 0.7 - camera.position.x) * 0.04;
    camera.position.y += (1.1 - pointer.current.y * 0.35 - camera.position.y) * 0.04;
    camera.lookAt(0, 1.4, -6);
  });

  return (
    <>
      <color attach="background" args={["#070a22"]} />
      <fog attach="fog" args={["#070a22", 8, 26]} />
      <points>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" args={[backdrop.stars, 3]} />
        </bufferGeometry>
        <pointsMaterial
          size={0.05}
          color="#c9c6ff"
          transparent
          opacity={0.7}
          sizeAttenuation
          fog={false}
        />
      </points>
      {backdrop.roofs.map((r, i) => (
        <mesh key={i} position={[r.x, -2.2 + r.h / 2, r.z]}>
          <planeGeometry args={[r.w, r.h]} />
          <meshBasicMaterial color={r.shade} />
        </mesh>
      ))}
      <points>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" args={[backdrop.windows, 3]} />
        </bufferGeometry>
        <pointsMaterial size={0.13} color="#ffcf7a" transparent opacity={0.75} sizeAttenuation />
      </points>
      <points ref={bokehRef}>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" args={[backdrop.bokeh, 3]} />
          <bufferAttribute attach="attributes-color" args={[backdrop.bokehColors, 3]} />
        </bufferGeometry>
        <pointsMaterial
          size={2.6}
          map={glow}
          vertexColors
          transparent
          opacity={0.16}
          depthWrite={false}
          blending={THREE.AdditiveBlending}
          sizeAttenuation
          fog={false}
        />
      </points>
      {lines.map((line, i) => (
        <primitive key={i} object={line} />
      ))}
      {/* Halo and filament share one geometry; additive blending makes overlaps glow. */}
      <points geometry={bulbs}>
        <pointsMaterial
          size={1.35}
          map={glow}
          vertexColors
          transparent
          depthWrite={false}
          blending={THREE.AdditiveBlending}
          opacity={0.7}
          sizeAttenuation
        />
      </points>
      <points geometry={bulbs}>
        <pointsMaterial
          size={0.3}
          map={glow}
          vertexColors
          transparent
          depthWrite={false}
          blending={THREE.AdditiveBlending}
          sizeAttenuation
        />
      </points>
    </>
  );
}

/**
 * The night street with strands of chasing serial lights. Decorative: hidden from assistive tech,
 * paused when off screen, and a single still frame for people who prefer reduced motion.
 */
export default function StreetLights() {
  const wrap = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(true);
  const [still, setStill] = useState(false);

  useEffect(() => {
    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => setStill(media.matches);
    update();
    media.addEventListener("change", update);
    const io = new IntersectionObserver(([entry]) => setVisible(Boolean(entry?.isIntersecting)));
    if (wrap.current) io.observe(wrap.current);
    return () => {
      media.removeEventListener("change", update);
      io.disconnect();
    };
  }, []);

  return (
    <div ref={wrap} aria-hidden="true" className="street-canvas">
      <Canvas
        dpr={[1, 1.75]}
        camera={{ position: [0, 1.1, 7], fov: 50 }}
        gl={{ antialias: true, powerPreference: "high-performance" }}
        frameloop={still ? "demand" : visible ? "always" : "never"}
      >
        <Street still={still} />
      </Canvas>
    </div>
  );
}
