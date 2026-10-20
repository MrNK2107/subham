"use client";

import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { useEffect, useMemo, useRef, useState } from "react";
import * as THREE from "three";
import { EffectComposer } from "three/examples/jsm/postprocessing/EffectComposer.js";
import { OutputPass } from "three/examples/jsm/postprocessing/OutputPass.js";
import { RenderPass } from "three/examples/jsm/postprocessing/RenderPass.js";
import { UnrealBloomPass } from "three/examples/jsm/postprocessing/UnrealBloomPass.js";
import { buildLane, LANE_HALF, type Lane } from "./lane";
import { sceneSignal } from "./signal";
import { chase, pointOnStrand } from "./strands";

const CROSS_COLORS = ["#ffb347", "#ff5c9a", "#3ff0a6", "#fff1cc", "#ffb347", "#7ec8ff"];
const CURTAIN_COLORS = {
  warm: ["#fff1cc", "#ffe2a8"],
  amber: ["#ffb347", "#ffc970"],
  mixed: ["#fff1cc", "#ff5c9a", "#ffb347", "#3ff0a6"],
};
const CURTAIN_SPACING = 0.36;

interface Bulb {
  kind: "cross" | "curtain";
  /** Index along its strand (for the chase). */
  i: number;
  phase: number;
  base: THREE.Color;
}

function skyTexture(): THREE.Texture {
  const c = document.createElement("canvas");
  c.width = 2;
  c.height = 512;
  const ctx = c.getContext("2d")!;
  const g = ctx.createLinearGradient(0, 0, 0, 512);
  g.addColorStop(0, "#04041a");
  g.addColorStop(0.45, "#0b0a26");
  g.addColorStop(0.6, "#140e30");
  g.addColorStop(0.72, "#1f1233");
  g.addColorStop(1, "#0a0819");
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, 2, 512);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

function labelTexture(text: string, font: string): THREE.CanvasTexture {
  const scale = 3;
  const measure = document.createElement("canvas").getContext("2d")!;
  measure.font = `700 ${28 * scale}px ${font}`;
  const c = document.createElement("canvas");
  c.width = Math.ceil(measure.measureText(text).width) + 40 * scale;
  c.height = 56 * scale;
  const g = c.getContext("2d")!;
  // A dark signboard with warm lettering: only the letters are bright enough to glow.
  g.fillStyle = "#1a1438";
  g.strokeStyle = "#8a6a2a";
  g.lineWidth = 3 * scale;
  g.beginPath();
  g.roundRect(2 * scale, 2 * scale, c.width - 4 * scale, c.height - 4 * scale, [
    6 * scale,
    6 * scale,
    12 * scale,
    12 * scale,
  ]);
  g.fill();
  g.stroke();
  g.fillStyle = "#ffd58a";
  g.font = `700 ${28 * scale}px ${font}`;
  g.textAlign = "center";
  g.textBaseline = "middle";
  g.fillText(text, c.width / 2, c.height / 2 + 2 * scale);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = 4;
  return t;
}

/** A soft warm streak down the middle of the road: light from the strands on worn stone. */
function roadTexture(): THREE.Texture {
  const c = document.createElement("canvas");
  c.width = 128;
  c.height = 512;
  const ctx = c.getContext("2d")!;
  const across = ctx.createLinearGradient(0, 0, 128, 0);
  across.addColorStop(0, "rgba(255,170,80,0)");
  across.addColorStop(0.5, "rgba(255,170,80,0.55)");
  across.addColorStop(1, "rgba(255,170,80,0)");
  ctx.fillStyle = across;
  ctx.fillRect(0, 0, 128, 512);
  ctx.globalCompositeOperation = "destination-in";
  const along = ctx.createLinearGradient(0, 0, 0, 512);
  along.addColorStop(0, "rgba(0,0,0,0.15)");
  along.addColorStop(0.7, "rgba(0,0,0,1)");
  along.addColorStop(1, "rgba(0,0,0,0.2)");
  ctx.fillStyle = along;
  ctx.fillRect(0, 0, 128, 512);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

/** Bloom post-processing: the bulbs read as light, not dots. */
function Bloom({ strength }: { strength: number }) {
  const { gl, scene, camera, size } = useThree();
  const composer = useMemo(() => {
    const c = new EffectComposer(gl);
    c.addPass(new RenderPass(scene, camera));
    c.addPass(new UnrealBloomPass(new THREE.Vector2(256, 256), strength, 0.42, 0.85));
    c.addPass(new OutputPass());
    return c;
  }, [gl, scene, camera, strength]);
  useEffect(() => {
    composer.setPixelRatio(gl.getPixelRatio());
    composer.setSize(size.width, size.height);
  }, [composer, size, gl]);
  useEffect(() => () => composer.dispose(), [composer]);
  useFrame(() => composer.render(), 1);
  return null;
}

function Street({ still, labels, mobile }: { still: boolean; labels: string[]; mobile: boolean }) {
  const { camera } = useThree();
  const lane: Lane = useMemo(
    () => buildLane({ depth: mobile ? 45 : 64, curtains: mobile ? 6 : 11 }),
    [mobile],
  );
  const sky = useMemo(() => skyTexture(), []);
  const roadGlow = useMemo(() => roadTexture(), []);
  const pointer = useRef({ x: 0, y: 0 });
  const bulbsRef = useRef<THREE.InstancedMesh>(null);

  // Every bulb in the street, in one instanced mesh.
  const { bulbs, positions, scales } = useMemo(() => {
    const bulbs: Bulb[] = [];
    const positions: THREE.Vector3[] = [];
    const scales: number[] = [];
    lane.crossings.forEach((s, ci) => {
      for (let i = 0; i < s.bulbs; i++) {
        bulbs.push({
          kind: "cross",
          i,
          phase: s.phase,
          base: new THREE.Color(CROSS_COLORS[(i + ci) % CROSS_COLORS.length]),
        });
        const [x, y, z] = pointOnStrand(s, (i + 0.5) / s.bulbs);
        positions.push(new THREE.Vector3(x, y - 0.08, z));
        scales.push(1);
      }
    });
    lane.curtains.forEach((c, k) => {
      const colors = CURTAIN_COLORS[c.palette];
      for (let s = 0; s < c.strings; s++) {
        const z = c.zFrom + ((c.zTo - c.zFrom) * (s + 0.5)) / c.strings;
        // Strings vary a little in length, like real jhalar.
        const bottom = c.bottom + ((s * 37) % 7) * 0.12;
        let i = 0;
        for (
          let y = c.top - (s % 3) * (CURTAIN_SPACING / 3);
          y > bottom;
          y -= CURTAIN_SPACING, i++
        ) {
          bulbs.push({
            kind: "curtain",
            i,
            phase: k * 1.3 + s * 0.15,
            base: new THREE.Color(colors[(s + i) % colors.length]),
          });
          positions.push(new THREE.Vector3(c.x, y, z));
          scales.push(0.62);
        }
      }
    });
    return { bulbs, positions, scales };
  }, [lane]);

  // Wires across the street.
  const wires = useMemo(() => {
    const material = new THREE.LineBasicMaterial({ color: "#2a2550" });
    return lane.crossings.map((s) => {
      const points = Array.from({ length: 33 }, (_, j) => {
        const [x, y, z] = pointOnStrand(s, j / 32);
        return new THREE.Vector3(x, y, z);
      });
      return new THREE.Line(new THREE.BufferGeometry().setFromPoints(points), material);
    });
  }, [lane]);

  // Function names hang as tags from the nearest visible strands.
  const tags = useMemo(() => {
    const font =
      getComputedStyle(document.documentElement).getPropertyValue("--font-baloo").trim() ||
      "sans-serif";
    return labels.slice(0, 5).map((text, k) => {
      const s = lane.crossings[k + 1] ?? lane.crossings[0]!;
      const [x, y, z] = pointOnStrand(s, 0.62 + (k % 3) * 0.1);
      const map = labelTexture(text, font);
      const aspect =
        (map.image as HTMLCanvasElement).width / (map.image as HTMLCanvasElement).height;
      return {
        map,
        position: new THREE.Vector3(x, y - 0.85, z),
        scale: new THREE.Vector3(0.55 * aspect, 0.55, 1),
        string: new THREE.Line(
          new THREE.BufferGeometry().setFromPoints([
            new THREE.Vector3(x, y - 0.08, z),
            new THREE.Vector3(x, y - 0.6, z),
          ]),
          new THREE.LineBasicMaterial({ color: "#4a4380" }),
        ),
      };
    });
  }, [labels, lane]);

  useEffect(() => {
    const mesh = bulbsRef.current;
    if (!mesh) return;
    const m = new THREE.Matrix4();
    positions.forEach((p, k) => {
      const sc = scales[k] ?? 1;
      m.makeScale(sc, sc, sc).setPosition(p.x, p.y, p.z);
      mesh.setMatrixAt(k, m);
    });
    mesh.instanceMatrix.needsUpdate = true;
  }, [positions, scales]);

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

  const houseColors = useMemo(
    () =>
      lane.houses.map((h) => new THREE.Color("#100d26").lerp(new THREE.Color("#241c48"), h.tone)),
    [lane],
  );
  const color = useMemo(() => new THREE.Color(), []);

  useFrame(({ clock }) => {
    const mesh = bulbsRef.current;
    if (!mesh) return;
    const t = still ? 3.1 : clock.elapsedTime;
    const since = performance.now() - sceneSignal.burstAt;
    const burst = since < 1600 ? 1 - since / 1600 : 0;
    for (let k = 0; k < bulbs.length; k++) {
      const b = bulbs[k]!;
      const level =
        b.kind === "cross"
          ? chase(b.i, t, b.phase, 2.4 + burst * 8)
          : // Curtains pour downward like a waterfall.
            0.45 + 0.55 * Math.max(0, Math.sin(t * 3.2 - b.i * 0.42 + b.phase));
      // Values above 1 feed the bloom; tungsten never goes fully dark.
      const intensity = (0.35 + level * 1.9 + burst * 1.2) * (b.kind === "curtain" ? 0.62 : 1);
      color.copy(b.base).multiplyScalar(intensity);
      mesh.setColorAt(k, color);
    }
    if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;

    // A slow walk into the lane, plus parallax towards the pointer.
    const walk = still ? 0 : Math.sin(t * 0.05) * 1.2;
    camera.position.x += (0.9 + pointer.current.x * 0.6 - camera.position.x) * 0.04;
    camera.position.y += (1.7 - pointer.current.y * 0.25 - camera.position.y) * 0.04;
    camera.position.z = 9 - walk;
    camera.lookAt(-1.9, 3.6, -30);
  });

  return (
    <>
      <primitive attach="background" object={sky} />
      <fogExp2 attach="fog" args={["#0a0822", 0.024]} />

      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, -25]}>
        <planeGeometry args={[LANE_HALF * 2 + 10, 90]} />
        <meshBasicMaterial color="#0c0a1e" />
      </mesh>

      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.01, -18]}>
        <planeGeometry args={[LANE_HALF * 2, 60]} />
        <meshBasicMaterial
          map={roadGlow}
          transparent
          opacity={0.5}
          depthWrite={false}
          blending={THREE.AdditiveBlending}
        />
      </mesh>

      {lane.houses.map((h, k) => (
        <mesh key={k} position={[h.x, h.height / 2, h.z]}>
          <boxGeometry args={[h.width, h.height, h.depth]} />
          <meshBasicMaterial color={houseColors[k]} />
        </mesh>
      ))}

      {/* Lit windows: warm panes, dimmer than the bulbs. */}
      {lane.windows.map(([x, y, z], k) => (
        <mesh key={k} position={[x, y, z]} rotation={[0, x < 0 ? Math.PI / 2 : -Math.PI / 2, 0]}>
          <planeGeometry args={[0.42, 0.6]} />
          <meshBasicMaterial color={k % 3 === 0 ? "#3a2420" : "#6e4524"} />
        </mesh>
      ))}

      {wires.map((line, k) => (
        <primitive key={k} object={line} />
      ))}

      <instancedMesh ref={bulbsRef} args={[undefined, undefined, positions.length]}>
        <sphereGeometry args={[0.075, 10, 8]} />
        <meshBasicMaterial toneMapped={false} />
      </instancedMesh>

      {tags.map((tag, k) => (
        <group key={k}>
          <primitive object={tag.string} />
          <sprite position={tag.position} scale={tag.scale}>
            <spriteMaterial map={tag.map} fog={false} />
          </sprite>
        </group>
      ))}
    </>
  );
}

/**
 * A night lane dressed for a wedding: strands of serial lights across the street, jhalar curtains
 * down the houses, haze in the distance. Decorative: hidden from assistive tech, paused off screen,
 * a single still frame for people who prefer reduced motion.
 */
export default function StreetLights({ labels = [] }: { labels?: string[] }) {
  const wrap = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(true);
  const [still, setStill] = useState(false);
  const [mobile, setMobile] = useState(false);

  useEffect(() => {
    const motion = window.matchMedia("(prefers-reduced-motion: reduce)");
    const narrow = window.matchMedia("(max-width: 700px)");
    const update = () => {
      setStill(motion.matches);
      setMobile(narrow.matches);
    };
    update();
    motion.addEventListener("change", update);
    narrow.addEventListener("change", update);
    const io = new IntersectionObserver(([entry]) => setVisible(Boolean(entry?.isIntersecting)));
    if (wrap.current) io.observe(wrap.current);
    return () => {
      motion.removeEventListener("change", update);
      narrow.removeEventListener("change", update);
      io.disconnect();
    };
  }, []);

  return (
    <div ref={wrap} aria-hidden="true" className="street-canvas">
      <Canvas
        dpr={[1, mobile ? 1.25 : 1.6]}
        camera={{ position: [0.9, 1.7, 9], fov: mobile ? 62 : 52, near: 0.1, far: 120 }}
        gl={{ antialias: false, powerPreference: "high-performance" }}
        frameloop={still ? "demand" : visible ? "always" : "never"}
      >
        <Street still={still} labels={labels} mobile={mobile} />
        <Bloom strength={mobile ? 1.1 : 1.35} />
      </Canvas>
    </div>
  );
}
