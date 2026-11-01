"use client";

import { useEffect, useRef, useState } from "react";
import { GROUPS, groupLevels, stillLevels } from "./controller";
import { sceneSignal } from "./signal";

/**
 * The hero is a path-traced photograph of a lane dressed for a wedding (scripts/blender/lane.py),
 * baked as one image per light group. Light adds linearly, so summing the layers with changing
 * weights re-lights the street: as a strand chases, its glow on the plaster, the puddles and the
 * glass of neighbouring bulbs chases with it.
 */
const BASE = "/scene/lane";
/** Where to centre the crop: the vanishing point on wide screens, the lit facades in portrait. */
const FOCUS: [number, number] = [0.59, 0.5];
const FOCUS_PORTRAIT: [number, number] = [0.8, 0.5];
const IMAGE_ASPECT = 16 / 9;

const VERTEX = `#version 300 es
in vec2 aPos;
out vec2 vUv;
void main() {
  vUv = aPos * 0.5 + 0.5;
  vUv.y = 1.0 - vUv.y;
  gl_Position = vec4(aPos, 0.0, 1.0);
}`;

const FRAGMENT = `#version 300 es
precision highp float;
in vec2 vUv;
out vec4 outColor;
uniform sampler2D uL0, uL1, uL2, uL3, uL4, uL5, uL6;
uniform float uW[7];
uniform vec2 uScale;
uniform vec2 uOffset;
uniform float uTime;

// Layers are stored as (x / (1 + x)) ^ (1 / 2.2) so filaments keep their headroom in a JPEG.
vec3 decode(vec3 v) {
  vec3 y = pow(v, vec3(2.2));
  return y / max(1.0 - y, vec3(1e-3));
}

// Minimal AgX (Benjamin Wrensch's fit): the same view transform the scene was lit under.
vec3 agx(vec3 v) {
  const mat3 m = mat3(0.842479062253094, 0.0423282422610123, 0.0423756549057051,
    0.0784335999999992, 0.878468636469772, 0.0784336,
    0.0792237451477643, 0.0791661274605434, 0.879142973793104);
  const mat3 inv = mat3(1.19687900512017, -0.0528968517574562, -0.0529716355144438,
    -0.0980208811401368, 1.15190312990417, -0.0980434501171241,
    -0.0990297440797205, -0.0989611768448433, 1.15107367264116);
  const float lo = -12.47393;
  const float hi = 4.026069;
  v = m * v;
  v = (clamp(log2(max(v, vec3(1e-10))), lo, hi) - lo) / (hi - lo);
  vec3 v2 = v * v;
  vec3 v4 = v2 * v2;
  v = 15.5 * v4 * v2 - 40.14 * v4 * v + 31.96 * v4 - 6.868 * v2 * v + 0.4298 * v2 + 0.1191 * v - 0.00232;
  return clamp(inv * v, 0.0, 1.0);
}

float hash(vec2 p) {
  return fract(sin(dot(p, vec2(12.9898, 78.233))) * 43758.5453);
}

void main() {
  vec2 uv = uOffset + vUv * uScale;
  vec3 c = vec3(0.0);
  vec3 glow = vec3(0.0);
  #define LAYER(i, tex) { \\
    c += uW[i] * decode(texture(tex, uv).rgb); \\
    glow += uW[i] * (decode(textureLod(tex, uv, 3.0).rgb) * 0.6 + decode(textureLod(tex, uv, 5.0).rgb)); \\
  }
  LAYER(0, uL0) LAYER(1, uL1) LAYER(2, uL2) LAYER(3, uL3) LAYER(4, uL4) LAYER(5, uL5) LAYER(6, uL6)
  // Light scattering in the evening air and the lens: a soft halo around everything bright.
  c += glow * 0.07;
  vec3 col = agx(c);
  // A lens falls off towards the corners, and film is never perfectly clean.
  vec2 d = vUv - 0.5;
  col *= 1.0 - dot(d, d) * 0.55;
  col += (hash(vUv * 1024.0 + fract(uTime) * 61.0) - 0.5) * 0.018;
  outColor = vec4(col, 1.0);
}`;

function compile(gl: WebGL2RenderingContext, type: number, source: string): WebGLShader {
  const shader = gl.createShader(type)!;
  gl.shaderSource(shader, source);
  gl.compileShader(shader);
  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    throw new Error(gl.getShaderInfoLog(shader) ?? "shader failed to compile");
  }
  return shader;
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.decoding = "async";
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
}

/** UV scale and offset for object-fit: cover around the focal point, with room for parallax. */
function cover(width: number, height: number, zoom: number): { scale: number[]; offset: number[] } {
  const aspect = width / height;
  let sx = 1 / zoom;
  let sy = 1 / zoom;
  if (aspect > IMAGE_ASPECT) sy *= IMAGE_ASPECT / aspect;
  else sx *= aspect / IMAGE_ASPECT;
  const focus = aspect < 1 ? FOCUS_PORTRAIT : FOCUS;
  const ox = Math.min(1 - sx, Math.max(0, focus[0] - sx / 2));
  const oy = Math.min(1 - sy, Math.max(0, focus[1] - sy / 2));
  return { scale: [sx, sy], offset: [ox, oy] };
}

/**
 * A night lane dressed for a wedding. Decorative: hidden from assistive tech, paused off screen
 * and in background tabs, a single still frame for people who prefer reduced motion, and the
 * baked poster if WebGL2 isn't available.
 */
export default function StreetLights() {
  const wrap = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const canvas = canvasRef.current;
    const gl = canvas?.getContext("webgl2", { antialias: false, alpha: false });
    if (!canvas || !gl) return;
    let disposed = false;
    let frame = 0;
    let visible = true;
    const still = window.matchMedia("(prefers-reduced-motion: reduce)");
    const pointer = { x: 0, y: 0, tx: 0, ty: 0 };

    const program = gl.createProgram()!;
    try {
      gl.attachShader(program, compile(gl, gl.VERTEX_SHADER, VERTEX));
      gl.attachShader(program, compile(gl, gl.FRAGMENT_SHADER, FRAGMENT));
      gl.linkProgram(program);
    } catch {
      // The poster stays.
      return;
    }
    gl.useProgram(program);
    const textures: WebGLTexture[] = [];
    const quad = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, quad);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW);
    const aPos = gl.getAttribLocation(program, "aPos");
    gl.enableVertexAttribArray(aPos);
    gl.vertexAttribPointer(aPos, 2, gl.FLOAT, false, 0, 0);
    const uW = gl.getUniformLocation(program, "uW");
    const uScale = gl.getUniformLocation(program, "uScale");
    const uOffset = gl.getUniformLocation(program, "uOffset");
    const uTime = gl.getUniformLocation(program, "uTime");

    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = Math.round(canvas.clientWidth * dpr);
      canvas.height = Math.round(canvas.clientHeight * dpr);
      gl.viewport(0, 0, canvas.width, canvas.height);
    };

    const draw = (now: number) => {
      const t = now / 1000;
      const since = performance.now() - sceneSignal.burstAt;
      const burst = since < 1600 ? 1 - since / 1600 : 0;
      const levels = still.matches ? stillLevels() : groupLevels(t, burst);
      // Ease towards the pointer: the camera drifts a few centimetres, never jumps.
      pointer.x += (pointer.tx - pointer.x) * 0.05;
      pointer.y += (pointer.ty - pointer.y) * 0.05;
      const { scale, offset } = cover(canvas.width, canvas.height, 1.05);
      const slack = [(1 - scale[0]!) * 0.5, (1 - scale[1]!) * 0.5];
      gl.uniform1fv(uW, levels);
      gl.uniform2f(uScale, scale[0]!, scale[1]!);
      gl.uniform2f(
        uOffset,
        Math.min(1 - scale[0]!, Math.max(0, offset[0]! + pointer.x * slack[0]! * 0.5)),
        Math.min(1 - scale[1]!, Math.max(0, offset[1]! + pointer.y * slack[1]! * 0.5)),
      );
      gl.uniform1f(uTime, t);
      gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
    };

    const loop = (now: number) => {
      if (disposed) return;
      draw(now);
      frame = visible && !still.matches ? requestAnimationFrame(loop) : 0;
    };
    const start = () => {
      if (!frame && !disposed) frame = requestAnimationFrame(loop);
    };

    const onMove = (e: PointerEvent) => {
      pointer.tx = (e.clientX / window.innerWidth) * 2 - 1;
      pointer.ty = (e.clientY / window.innerHeight) * 2 - 1;
    };
    const onVisibility = () => {
      visible = !document.hidden;
      if (visible) start();
    };
    const io = new IntersectionObserver(([entry]) => {
      visible = Boolean(entry?.isIntersecting) && !document.hidden;
      if (visible) start();
    });
    const ro = new ResizeObserver(() => {
      resize();
      start();
    });

    Promise.all(GROUPS.map((g) => loadImage(`${BASE}/${g}.jpg`)))
      .then((images) => {
        if (disposed) return;
        images.forEach((img, i) => {
          const tex = gl.createTexture()!;
          textures.push(tex);
          gl.activeTexture(gl.TEXTURE0 + i);
          gl.bindTexture(gl.TEXTURE_2D, tex);
          gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGB8, gl.RGB, gl.UNSIGNED_BYTE, img);
          gl.generateMipmap(gl.TEXTURE_2D);
          gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR);
          gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
          gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
          gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
          gl.uniform1i(gl.getUniformLocation(program, `uL${i}`), i);
        });
        resize();
        if (wrap.current) io.observe(wrap.current);
        ro.observe(canvas);
        window.addEventListener("pointermove", onMove, { passive: true });
        document.addEventListener("visibilitychange", onVisibility);
        still.addEventListener("change", start);
        start();
        setReady(true);
      })
      // The poster stays if the layers can't load.
      .catch(() => undefined);

    return () => {
      disposed = true;
      cancelAnimationFrame(frame);
      io.disconnect();
      ro.disconnect();
      window.removeEventListener("pointermove", onMove);
      document.removeEventListener("visibilitychange", onVisibility);
      still.removeEventListener("change", start);
      // Free what we made rather than losing the context: React may mount this canvas again.
      textures.forEach((tex) => gl.deleteTexture(tex));
      gl.deleteBuffer(quad);
      gl.deleteProgram(program);
    };
  }, []);

  return (
    <div
      ref={wrap}
      aria-hidden="true"
      className="street-canvas"
      style={{ backgroundImage: `url(${BASE}/poster.jpg)` }}
      data-ready={ready || undefined}
    >
      <canvas ref={canvasRef} />
    </div>
  );
}
