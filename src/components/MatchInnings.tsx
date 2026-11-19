"use client";

import { useEffect, useRef, useState } from "react";
import { getGsap, prefersReducedMotion, refreshTriggers, scrollToY } from "@/lib/motion";
import { playSix, unlockAudio } from "@/lib/crowdSound";
import { currentTheme, onTheme } from "@/lib/theme";

/**
 * Match Innings — three sixes, replayed as a point-cloud match on a night pitch (inspired by
 * volumetric football replays). Every player is a cloud of golden points; the batter (Dhoni,
 * shown as an illustrative figure, not real tracking data) glows. Scrolling bowls each ball:
 * the bowler runs in, the ball pitches, he swings, and the ball sails into the stands — straight,
 * over the leg side, then over the off side. Cameras switch TV → FOLLOW → SIX CAM.
 * Reduced motion / no WebGL: a short text summary of the three shots.
 */

export const SHOTS = [
  { id: "straight", n: "01", name: "Down the ground", shot: "Lofted straight drive", region: "Over long-on / long-off", dir: [0.06, -1] as [number, number] },
  { id: "leg", n: "02", name: "Helicopter, leg side", shot: "The helicopter", region: "Over deep mid-wicket", dir: [-0.78, -0.62] as [number, number] },
  { id: "off", n: "03", name: "Pull shot, off side", shot: "Pull shot", region: "Over deep cover-point", dir: [0.9, -0.42] as [number, number] },
];
const NS = SHOTS.length;
const PHASES = ["Run-up", "Release", "Contact", "Six"];
const pad = (n: number) => String(n).padStart(2, "0");

export default function MatchInnings() {
  const root = useRef<HTMLElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const tagRef = useRef<HTMLDivElement>(null);
  const progRef = useRef(0);
  const stRef = useRef<{ start: number; end: number } | null>(null);
  const soundRef = useRef(false);
  const [mode, setMode] = useState<"pending" | "webgl" | "static">("pending");
  const [ui, setUi] = useState({ shot: 0, phase: 0, cam: 0, six: false });
  const [sound, setSound] = useState(false);

  useEffect(() => {
    let gl = false;
    try {
      gl = !!document.createElement("canvas").getContext("webgl2");
    } catch {}
    setMode(gl && !prefersReducedMotion() ? "webgl" : "static");
  }, []);

  // pin + scroll progress (created up front so the page layout never jumps)
  useEffect(() => {
    if (mode !== "webgl" || !root.current) return;
    const { ScrollTrigger } = getGsap();
    const st = ScrollTrigger.create({
      trigger: root.current,
      start: "top top",
      end: `+=${NS * 130}%`,
      pin: true,
      anticipatePin: 1,
      onRefresh: (self) => (stRef.current = { start: self.start, end: self.end }),
      onUpdate: (self) => {
        stRef.current = { start: self.start, end: self.end };
        progRef.current = self.progress;
      },
    });
    requestAnimationFrame(refreshTriggers);
    return () => st.kill();
  }, [mode]);

  useEffect(() => {
    if (mode !== "webgl" || !root.current || !canvasRef.current) return;
    let disposed = false;
    let cleanup = () => {};
    (async () => {
      const THREE = await import("three");
      if (disposed) return;
      cleanup = buildMatch(THREE, root.current!, canvasRef.current!, tagRef.current!, progRef, soundRef, (s) =>
        setUi((u) => (u.shot === s.shot && u.phase === s.phase && u.cam === s.cam && u.six === s.six ? u : s))
      );
    })();
    return () => {
      disposed = true;
      cleanup();
    };
  }, [mode]);

  const goTo = (i: number) => {
    const st = stRef.current;
    if (!st) return;
    const k = Math.max(0, Math.min(NS - 1, i));
    scrollToY(st.start + ((st.end - st.start) * (k + 0.02)) / NS);
  };

  const toggleSound = () => {
    const v = !soundRef.current;
    soundRef.current = v;
    setSound(v);
    if (v) unlockAudio();
  };

  if (mode === "static") {
    return (
      <section id="innings" className="innings is-static" aria-labelledby="mi-h">
        <p className="mi-eyebrow">Match innings</p>
        <h2 id="mi-h">The greatest finisher of the game</h2>
        <ol className="mi-static-list">
          {SHOTS.map((s) => (
            <li key={s.id}>
              <b>{s.n}</b> {s.shot} — {s.region}
            </li>
          ))}
        </ol>
      </section>
    );
  }

  const s = SHOTS[ui.shot];
  return (
    <section ref={root} id="innings" className="innings" aria-labelledby="mi-h">
      <canvas ref={canvasRef} className="mi-canvas" aria-hidden="true" />
      <div className="mi-vignette" aria-hidden="true" />

      {/* side arcs */}
      <svg className="mi-arc is-left" viewBox="0 0 200 1000" preserveAspectRatio="none" aria-hidden="true">
        <path d="M180 0 Q-60 500 180 1000" />
      </svg>
      <svg className="mi-arc is-right" viewBox="0 0 200 1000" preserveAspectRatio="none" aria-hidden="true">
        <path d="M20 0 Q260 500 20 1000" />
      </svg>

      <header className="mi-head">
        <p className="mi-eyebrow">Match innings</p>
        <h2 id="mi-h">
          The greatest <em>finisher</em> of the game
        </h2>
      </header>

      <p className="mi-cams" aria-hidden="true">
        {["TV", "Follow", "Six cam"].map((c, i) => (
          <span key={c} className={ui.cam === i ? "is-on" : ""}>
            {c}
          </span>
        ))}
      </p>

      <ol className="mi-shots" aria-label="Shots">
        {SHOTS.map((sh, i) => (
          <li key={sh.id} className={i === ui.shot ? "is-on" : i < ui.shot ? "is-past" : ""} style={{ ["--i" as string]: i }}>
            <button type="button" onClick={() => goTo(i)} aria-current={i === ui.shot ? "step" : undefined}>
              <i aria-hidden="true" />
              <span>
                <b>{sh.n}</b> {sh.name}
              </span>
            </button>
          </li>
        ))}
      </ol>

      <ol className="mi-phases" aria-hidden="true">
        {PHASES.map((p, i) => (
          <li key={p} className={i === ui.phase ? "is-on" : i < ui.phase ? "is-past" : ""} style={{ ["--i" as string]: i }}>
            <span>{p}</span>
            <i />
          </li>
        ))}
      </ol>

      <div className="mi-nav">
        <button type="button" onClick={() => goTo(ui.shot - 1)} disabled={ui.shot === 0} aria-label="Previous six">
          ‹
        </button>
        <button type="button" onClick={() => goTo(ui.shot + 1)} disabled={ui.shot === NS - 1} aria-label="Next six">
          ›
        </button>
      </div>

      <div ref={tagRef} className="mi-tag" aria-hidden="true">
        <span>MSD</span>
        <b>7</b>
      </div>

      <p className={`mi-six ${ui.six ? "is-on" : ""}`} aria-hidden="true">
        SIX
      </p>

      <footer className="mi-bar">
        <span>
          <small>Ball</small>
          <b>
            {pad(ui.shot + 1)} / {pad(NS)}
          </b>
        </span>
        <span>
          <small>Shot</small>
          <b>{s.shot}</b>
        </span>
        <span>
          <small>Region</small>
          <b>{s.region}</b>
        </span>
        <span>
          <small>Result</small>
          <b className={ui.six ? "is-six" : ""}>{ui.six ? "SIX" : ui.phase >= 2 ? "In the air…" : "—"}</b>
        </span>
        <button type="button" className={`mi-sound ${sound ? "is-on" : ""}`} onClick={toggleSound} aria-pressed={sound}>
          {sound ? "Stadium sound on" : "Sound off"}
        </button>
      </footer>
      <p className="mi-note">Illustrative replay — figures are drawn, not tracking data.</p>
      <p className="sr-only" aria-live="polite">
        {`Ball ${ui.shot + 1} of ${NS}: ${s.shot}, ${s.region}. ${ui.six ? "Six." : ""}`}
      </p>
    </section>
  );
}

/* ═══════════════════════════ the 3D match ═══════════════════════════ */

type Three = typeof import("three");
type V3 = import("three").Vector3;
type UiState = { shot: number; phase: number; cam: number; six: boolean };

const BOUNDARY = 64;
const smooth = (e0: number, e1: number, x: number) => {
  const t = Math.max(0, Math.min(1, (x - e0) / (e1 - e0)));
  return t * t * (3 - 2 * t);
};
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

let seed = 11;
const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647;

// time marks inside one ball (0..1)
const T_RUN0 = 0.02;
const T_STRIDE = 0.36;
const T_RELEASE = 0.44;
const T_BOUNCE = 0.5;
const T_CONTACT = 0.535;
const T_LAND = 0.84;

function buildMatch(
  THREE: Three,
  section: HTMLElement,
  canvas: HTMLCanvasElement,
  tag: HTMLDivElement,
  progRef: { current: number },
  soundRef: { current: boolean },
  report: (s: UiState) => void
) {
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: false, powerPreference: "high-performance" });
  const DPR = Math.min(window.devicePixelRatio || 1, 2);
  renderer.setPixelRatio(DPR);
  const BG = new THREE.Color(0x0d0900);
  renderer.setClearColor(BG, 1);
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(16, 1, 0.3, 600);
  const disposables: { dispose: () => void }[] = [];
  const track = <T extends { dispose: () => void }>(o: T) => (disposables.push(o), o);

  // ---------- point material ----------
  const makeMat = (color: number, size: number, glow = 1) =>
    track(
      new THREE.ShaderMaterial({
        transparent: true,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
        uniforms: {
          uColor: { value: new THREE.Color(color) },
          uSize: { value: size },
          uScale: { value: 1 },
          uTime: { value: 0 },
          uGlow: { value: glow },
          uFogNear: { value: 60 },
          uFogFar: { value: 260 },
        },
        vertexShader: /* glsl */ `
          attribute float a;
          uniform float uSize, uScale, uTime, uFogNear, uFogFar;
          varying float vA;
          void main() {
            vec4 mv = modelViewMatrix * vec4(position, 1.0);
            gl_Position = projectionMatrix * mv;
            float tw = 0.75 + 0.25 * sin(uTime * 2.0 + a * 40.0);
            float fog = 1.0 - smoothstep(uFogNear, uFogFar, -mv.z);
            vA = fract(a) * tw * fog;
            gl_PointSize = clamp(uSize * 0.01 * (0.6 + 0.8 * fract(a * 7.0)) * projectionMatrix[1][1] * uScale / -mv.z, 1.0, 40.0);
          }`,
        fragmentShader: /* glsl */ `
          uniform vec3 uColor; uniform float uGlow;
          varying float vA;
          void main() {
            vec2 c = gl_PointCoord - 0.5;
            float d = length(c);
            if (d > 0.5) discard;
            float f = smoothstep(0.5, 0.0, d);
            gl_FragColor = vec4(uColor * uGlow, f * vA);
          }`,
      })
    );
  const mats: import("three").ShaderMaterial[] = [];
  const mat = (c: number, s: number, g = 1) => {
    const m = makeMat(c, s, g);
    mats.push(m);
    return m;
  };

  const cloud = (pts: number[], alpha: number[], m: import("three").ShaderMaterial) => {
    const g = track(new THREE.BufferGeometry());
    g.setAttribute("position", new THREE.Float32BufferAttribute(pts, 3));
    g.setAttribute("a", new THREE.Float32BufferAttribute(alpha, 1));
    const p = new THREE.Points(g, m);
    p.frustumCulled = false;
    scene.add(p);
    return p;
  };

  const groundMat = mat(0xffd24a, 9, 0.9);
  // ---------- ground: grass speckle, pitch, creases, circles ----------
  {
    const P: number[] = [];
    const A: number[] = [];
    const add = (x: number, y: number, z: number, a: number) => (P.push(x, y, z), A.push(a));
    // outfield speckle
    for (let i = 0; i < 26000; i++) {
      const r = Math.sqrt(rnd()) * (BOUNDARY + 4);
      const th = rnd() * Math.PI * 2;
      add(Math.cos(th) * r, 0, -10 + Math.sin(th) * r, 0.05 + rnd() * 0.18);
    }
    // mowing stripes
    for (let k = -8; k <= 8; k += 2)
      for (let i = 0; i < 900; i++) {
        const x = k * 8 + rnd() * 8;
        const zz = -10 + (rnd() * 2 - 1) * Math.sqrt(Math.max(0, (BOUNDARY - 1) ** 2 - x * x));
        add(x, 0, zz, 0.12 + rnd() * 0.1);
      }
    // pitch strip
    for (let i = 0; i < 2600; i++) add((rnd() - 0.5) * 3.05, 0.01, -10 + (rnd() - 0.5) * 22, 0.05 + rnd() * 0.12);
    // dotted lines
    const line = (x0: number, z0: number, x1: number, z1: number, n: number, a = 0.95) => {
      for (let i = 0; i <= n; i++) {
        const t = i / n;
        add(lerp(x0, x1, t) + (rnd() - 0.5) * 0.04, 0.02, lerp(z0, z1, t) + (rnd() - 0.5) * 0.04, a * (0.7 + rnd() * 0.3));
      }
    };
    for (const zc of [0, -20.12]) {
      const s = zc === 0 ? -1 : 1;
      line(-1.83, zc + s * 1.22, 1.83, zc + s * 1.22, 140); // popping crease
      line(-1.32, zc, 1.32, zc, 90); // bowling crease
      line(-1.32, zc, -1.32, zc + s * 1.22, 40);
      line(1.32, zc, 1.32, zc + s * 1.22, 40);
    }
    const circle = (r: number, n: number, a: number, dash = false) => {
      for (let i = 0; i < n; i++) {
        if (dash && i % 6 > 2) continue;
        const th = (i / n) * Math.PI * 2;
        add(Math.cos(th) * r, 0.03, -10 + Math.sin(th) * r, a);
      }
    };
    circle(27.4, 900, 0.7, true); // 30-yard circle
    circle(BOUNDARY, 5200, 1.0); // the rope
    circle(BOUNDARY + 0.25, 5200, 0.6);
    cloud(P, A, groundMat);
  }

  // ---------- stands, crowd, floodlights ----------
  const crowdMat = mat(0xffc21a, 30, 0.9);
  {
    const P: number[] = [];
    const A: number[] = [];
    for (let i = 0; i < 42000; i++) {
      const tier = rnd();
      const r = BOUNDARY + 8 + tier * 30;
      const th = rnd() * Math.PI * 2;
      const y = 1.5 + tier * 18 + (rnd() - 0.5) * 0.6;
      P.push(Math.cos(th) * r, y, -10 + Math.sin(th) * r);
      A.push(0.15 + rnd() * 0.7);
    }
    // the roofs: dotted rings
    for (let i = 0; i < 7000; i++) {
      const th = rnd() * Math.PI * 2;
      const r = BOUNDARY + 40 + rnd() * 3;
      P.push(Math.cos(th) * r, 22 + rnd() * 1.5, -10 + Math.sin(th) * r);
      A.push(0.2 + rnd() * 0.3);
    }
    cloud(P, A, crowdMat);
  }
  const lightMat = mat(0xfff1b0, 30, 1.2);
  const lights: V3[] = [];
  {
    const P: number[] = [];
    const A: number[] = [];
    for (let k = 0; k < 6; k++) {
      const th = (k / 6) * Math.PI * 2 + 0.5;
      const r = BOUNDARY + 44;
      const x = Math.cos(th) * r;
      const z = -10 + Math.sin(th) * r;
      for (let i = 0; i < 700; i++) P.push(x + (rnd() - 0.5) * 0.8, rnd() * 46, z + (rnd() - 0.5) * 0.8), A.push(0.15 + rnd() * 0.25);
      for (let i = 0; i < 900; i++) P.push(x + (rnd() - 0.5) * 7, 46 + (rnd() - 0.5) * 4, z + (rnd() - 0.5) * 2), A.push(0.6 + rnd() * 0.4);
      lights.push(new THREE.Vector3(x, 46, z));
    }
    cloud(P, A, lightMat);
  }
  // flood glow sprites
  let glowTex: import("three").CanvasTexture;
  let floodSprite: import("three").SpriteMaterial | null = null;
  {
    const c = document.createElement("canvas");
    c.width = c.height = 128;
    const g = c.getContext("2d")!;
    const gr = g.createRadialGradient(64, 64, 0, 64, 64, 64);
    gr.addColorStop(0, "rgba(255,240,180,1)");
    gr.addColorStop(0.2, "rgba(255,210,90,0.5)");
    gr.addColorStop(1, "rgba(255,190,40,0)");
    g.fillStyle = gr;
    g.fillRect(0, 0, 128, 128);
    const tx = track(new THREE.CanvasTexture(c));
    glowTex = tx;
    const sm = track(new THREE.SpriteMaterial({ map: tx, blending: THREE.AdditiveBlending, depthWrite: false, transparent: true }));
    floodSprite = sm;
    for (const p of lights) {
      const s = new THREE.Sprite(sm);
      s.position.copy(p);
      s.scale.setScalar(15);
      scene.add(s);
    }
  }

  const stumpMat = mat(0xfff0b8, 2.2, 1);
  // stumps
  {
    const P: number[] = [];
    const A: number[] = [];
    for (const zc of [0, -20.12])
      for (const x of [-0.115, 0, 0.115]) for (let i = 0; i < 160; i++) P.push(x + (rnd() - 0.5) * 0.03, rnd() * 0.71, zc + (rnd() - 0.5) * 0.03), A.push(0.8);
    cloud(P, A, stumpMat);
  }

  // ---------- point-cloud people ----------
  type Joints = Record<string, V3>;
  const J = () => {
    const o: Joints = {};
    for (const k of ["pel", "chest", "neck", "head", "shL", "shR", "elL", "elR", "haL", "haR", "hipL", "hipR", "knL", "knR", "anL", "anR", "toL", "toR", "batA", "batB"]) o[k] = new THREE.Vector3();
    return o;
  };
  type Seg = { a: string; b: string; r0: number; r1: number; n: number; flat?: [number, number] };
  const BODY: Seg[] = [
    { a: "pel", b: "chest", r0: 0.16, r1: 0.19, n: 380 },
    { a: "chest", b: "neck", r0: 0.17, r1: 0.07, n: 120 },
    { a: "shL", b: "elL", r0: 0.055, r1: 0.05, n: 110 },
    { a: "elL", b: "haL", r0: 0.045, r1: 0.04, n: 90 },
    { a: "shR", b: "elR", r0: 0.055, r1: 0.05, n: 110 },
    { a: "elR", b: "haR", r0: 0.045, r1: 0.04, n: 90 },
    { a: "shL", b: "shR", r0: 0.07, r1: 0.07, n: 90 },
    { a: "hipL", b: "knL", r0: 0.085, r1: 0.06, n: 160 },
    { a: "knL", b: "anL", r0: 0.06, r1: 0.045, n: 130 },
    { a: "hipR", b: "knR", r0: 0.085, r1: 0.06, n: 160 },
    { a: "knR", b: "anR", r0: 0.06, r1: 0.045, n: 130 },
    { a: "anL", b: "toL", r0: 0.045, r1: 0.04, n: 40 },
    { a: "anR", b: "toR", r0: 0.045, r1: 0.04, n: 40 },
  ];
  const BAT: Seg = { a: "batA", b: "batB", r0: 0, r1: 0, n: 260, flat: [0.055, 0.025] };

  type Person = {
    j: Joints;
    pts: Float32Array;
    geo: import("three").BufferGeometry;
    spec: { seg: number; t: number; c: number; s: number; rho: number }[];
    segs: Seg[];
    headN: number;
  };
  const people: Person[] = [];
  const makePerson = (m: import("three").ShaderMaterial, density = 1, bat = false): Person => {
    const segs = bat ? [...BODY, BAT] : BODY;
    const spec: Person["spec"] = [];
    segs.forEach((sg, si) => {
      const n = Math.round(sg.n * density);
      for (let i = 0; i < n; i++) {
        const th = rnd() * Math.PI * 2;
        spec.push({ seg: si, t: rnd(), c: Math.cos(th), s: Math.sin(th), rho: 0.65 + 0.35 * Math.sqrt(rnd()) });
      }
    });
    const headN = Math.round(240 * density);
    const total = spec.length + headN;
    const pts = new Float32Array(total * 3);
    const al = new Float32Array(total);
    for (let i = 0; i < total; i++) al[i] = 0.35 + rnd() * 0.6;
    const geo = track(new THREE.BufferGeometry());
    geo.setAttribute("position", new THREE.BufferAttribute(pts, 3));
    geo.setAttribute("a", new THREE.BufferAttribute(al, 1));
    const p = new THREE.Points(geo, m);
    p.frustumCulled = false;
    scene.add(p);
    const person = { j: J(), pts, geo, spec, segs, headN };
    people.push(person);
    return person;
  };

  // head points are fixed unit-sphere samples
  const headDirs: V3[] = [];
  for (let i = 0; i < 600; i++) {
    const v = new THREE.Vector3(rnd() * 2 - 1, rnd() * 2 - 1, rnd() * 2 - 1);
    if (v.lengthSq() > 1 || v.lengthSq() < 0.01) {
      i--;
      continue;
    }
    headDirs.push(v.normalize().multiplyScalar(0.7 + 0.3 * rnd()));
  }

  const _ax = new THREE.Vector3();
  const _u = new THREE.Vector3();
  const _w = new THREE.Vector3();
  const _ref = new THREE.Vector3();
  const writePerson = (p: Person) => {
    const segFrames = p.segs.map((sg) => {
      const A = p.j[sg.a];
      const B = p.j[sg.b];
      const ax = new THREE.Vector3().subVectors(B, A);
      const len = ax.length() || 1e-4;
      _ax.copy(ax).divideScalar(len);
      _ref.set(0, 1, 0);
      if (Math.abs(_ax.y) > 0.9) _ref.set(1, 0, 0);
      const u = new THREE.Vector3().crossVectors(_ax, _ref).normalize();
      const w = new THREE.Vector3().crossVectors(_ax, u).normalize();
      return { A, ax, u, w };
    });
    const pts = p.pts;
    let k = 0;
    for (const sp of p.spec) {
      const sg = p.segs[sp.seg];
      const f = segFrames[sp.seg];
      let ox: number, oy: number;
      if (sg.flat) {
        const blade = sp.t > 0.3;
        ox = sp.c * (blade ? sg.flat[0] : 0.016) * sp.rho * 1.4;
        oy = sp.s * (blade ? sg.flat[1] : 0.016) * sp.rho;
      } else {
        const r = lerp(sg.r0, sg.r1, sp.t) * sp.rho;
        ox = sp.c * r;
        oy = sp.s * r;
      }
      pts[k++] = f.A.x + f.ax.x * sp.t + f.u.x * ox + f.w.x * oy;
      pts[k++] = f.A.y + f.ax.y * sp.t + f.u.y * ox + f.w.y * oy;
      pts[k++] = f.A.z + f.ax.z * sp.t + f.u.z * ox + f.w.z * oy;
    }
    const h = p.j.head;
    for (let i = 0; i < p.headN; i++) {
      const d = headDirs[i % headDirs.length];
      pts[k++] = h.x + d.x * 0.11;
      pts[k++] = h.y + d.y * 0.13;
      pts[k++] = h.z + d.z * 0.11;
    }
    (p.geo.attributes.position as import("three").BufferAttribute).needsUpdate = true;
  };

  // two-bone IK
  const ik = (A: V3, T: V3, l1: number, l2: number, pole: V3, mid: V3, end: V3) => {
    const d0 = _u.subVectors(T, A);
    let d = d0.length();
    const dir = d0.clone().divideScalar(d || 1);
    d = Math.min(d, l1 + l2 - 0.001);
    const ca = Math.max(-1, Math.min(1, (l1 * l1 + d * d - l2 * l2) / (2 * l1 * d)));
    const sa = Math.sqrt(1 - ca * ca);
    const perp = _w.copy(pole).addScaledVector(dir, -pole.dot(dir));
    if (perp.lengthSq() < 1e-6) perp.set(0, 0, 1);
    perp.normalize();
    mid.copy(A).addScaledVector(dir, l1 * ca).addScaledVector(perp, l1 * sa);
    end.copy(A).addScaledVector(dir, d);
  };

  type Pose = {
    pel: V3;
    face: number; // chest facing angle (radians, 0 = +z)
    hipFace?: number;
    lean?: number; // forward lean (radians)
    side?: number; // sideways lean
    footL: V3;
    footR: V3;
    handL: V3;
    handR: V3;
    look?: number;
  };
  const up = new THREE.Vector3(0, 1, 0);
  const tmp = new THREE.Vector3();
  const solve = (p: Person, s: Pose) => {
    const j = p.j;
    const F = new THREE.Vector3(Math.sin(s.face), 0, Math.cos(s.face));
    const L = new THREE.Vector3().crossVectors(up, F).normalize();
    const hF = s.hipFace ?? s.face;
    const HF = new THREE.Vector3(Math.sin(hF), 0, Math.cos(hF));
    const HL = new THREE.Vector3().crossVectors(up, HF).normalize();
    j.pel.copy(s.pel);
    const spine = new THREE.Vector3(0, 1, 0).addScaledVector(F, Math.sin(s.lean ?? 0.08)).addScaledVector(L, Math.sin(s.side ?? 0)).normalize();
    j.chest.copy(j.pel).addScaledVector(spine, 0.46);
    j.neck.copy(j.chest).addScaledVector(spine, 0.12);
    j.head.copy(j.neck).addScaledVector(spine, 0.14).addScaledVector(F, 0.02);
    j.shL.copy(j.chest).addScaledVector(L, 0.19).addScaledVector(spine, -0.02);
    j.shR.copy(j.chest).addScaledVector(L, -0.19).addScaledVector(spine, -0.02);
    j.hipL.copy(j.pel).addScaledVector(HL, 0.1).addScaledVector(up, -0.04);
    j.hipR.copy(j.pel).addScaledVector(HL, -0.1).addScaledVector(up, -0.04);
    // arms: elbows bend down/back
    const armPole = tmp.copy(F).multiplyScalar(-0.3).addScaledVector(up, -1);
    ik(j.shL, s.handL, 0.3, 0.28, armPole.clone().addScaledVector(L, 0.6), j.elL, j.haL);
    ik(j.shR, s.handR, 0.3, 0.28, armPole.clone().addScaledVector(L, -0.6), j.elR, j.haR);
    // legs: knees forward
    ik(j.hipL, s.footL, 0.46, 0.45, HF.clone().addScaledVector(up, 0.2), j.knL, j.anL);
    ik(j.hipR, s.footR, 0.46, 0.45, HF.clone().addScaledVector(up, 0.2), j.knR, j.anR);
    const toeL = j.anL.clone().sub(j.knL).setY(0);
    j.toL.copy(j.anL).addScaledVector(toeL.lengthSq() > 0.001 ? toeL.normalize().lerp(HF, 0.6).normalize() : HF, 0.17).setY(Math.max(0.02, j.anL.y - 0.04));
    const toeR = j.anR.clone().sub(j.knR).setY(0);
    j.toR.copy(j.anR).addScaledVector(toeR.lengthSq() > 0.001 ? toeR.normalize().lerp(HF, 0.6).normalize() : HF, 0.17).setY(Math.max(0.02, j.anR.y - 0.04));
  };
  const v = (x: number, y: number, z: number) => new THREE.Vector3(x, y, z);

  // materials
  const dimMat = mat(0xffc93a, 2.4, 0.45);
  const msdMat = mat(0xfff3c4, 2.4, 1.0);
  const msdHalo = mat(0xffd34d, 9, 0.12);

  // the batter (Dhoni): body + an outer halo cloud sharing the same points
  const msd = makePerson(msdMat, 2.2, true);
  const msdGlow = new THREE.Points(msd.geo, msdHalo);
  msdGlow.frustumCulled = false;
  scene.add(msdGlow);
  // halo sprite behind him
  const haloSprite = new THREE.Sprite(track(new THREE.SpriteMaterial({ map: glowTex, blending: THREE.AdditiveBlending, depthWrite: false, transparent: true, opacity: 0.55, color: 0xffcf40 })));
  haloSprite.scale.setScalar(2.6);
  scene.add(haloSprite);

  const bowler = makePerson(dimMat, 1);
  const keeper = makePerson(dimMat, 1);
  const nonStriker = makePerson(dimMat, 1, true);
  const umpire = makePerson(dimMat, 1);
  const umpire2 = makePerson(dimMat, 1);
  // static fielders
  const FIELD: [number, number][] = [
    [-2.4, 3.2], // first slip (off side is +x for a right-hander: slips at +x)
    [3.6, 3.6], // second slip
    [18, -6], // point
    [22, -20], // cover
    [12, -34], // mid-off
    [-12, -34], // mid-on
    [-24, -16], // mid-wicket
    [-20, 2], // square leg
    [-40, 30], // fine leg
  ];
  FIELD[0] = [2.6, 3.0];
  const fielders = FIELD.map(() => makePerson(dimMat, 0.9));

  // pose the static people once
  const standAt = (p: Person, x: number, z: number, face: number, crouch = 0, handsKnees = true) => {
    const F = v(Math.sin(face), 0, Math.cos(face));
    const L = v(0, 1, 0).cross(F).normalize();
    const h = 0.95 - crouch;
    const pel = v(x, h, z);
    solve(p, {
      pel,
      face,
      lean: crouch > 0.1 ? 0.5 : 0.06,
      footL: v(x, 0.08, z).addScaledVector(L, 0.2),
      footR: v(x, 0.08, z).addScaledVector(L, -0.2),
      handL: handsKnees ? pel.clone().addScaledVector(F, 0.32).addScaledVector(L, 0.16).setY(h - 0.32) : pel.clone().addScaledVector(L, 0.26).setY(h - 0.15),
      handR: handsKnees ? pel.clone().addScaledVector(F, 0.32).addScaledVector(L, -0.16).setY(h - 0.32) : pel.clone().addScaledVector(L, -0.26).setY(h - 0.15),
    });
    writePerson(p);
  };
  const faceTo = (x: number, z: number, tx: number, tz: number) => Math.atan2(tx - x, tz - z);
  fielders.forEach((p, i) => {
    const [x, z] = FIELD[i];
    standAt(p, x, z, faceTo(x, z, 0, -1), i < 2 ? 0.28 : 0.12);
  });
  standAt(keeper, 0.1, 1.9, Math.PI, 0.45);
  standAt(umpire, -0.4, -22.6, 0, 0, false);
  standAt(umpire2, -22, -1, faceTo(-22, -1, 0, -1), 0, false);
  // non-striker: leaning on the bat at the bowler's end
  {
    const x = -1.4;
    const z = -21.4;
    solve(nonStriker, { pel: v(x, 0.94, z), face: 0.3, lean: 0.12, footL: v(x + 0.2, 0.08, z), footR: v(x - 0.2, 0.08, z + 0.05), handL: v(x + 0.12, 0.92, z + 0.35), handR: v(x + 0.05, 0.86, z + 0.32) });
    nonStriker.j.batA.set(x + 0.1, 0.9, z + 0.34);
    nonStriker.j.batB.set(x + 0.2, 0.02, z + 0.55);
    writePerson(nonStriker);
  }

  // ---------- batting keyframes (right-hander, facing +x = off side, bowler at -z) ----------
  type BK = { t: number; pel: [number, number, number]; face: number; lean: number; fl: [number, number, number]; fr: [number, number, number]; g: [number, number, number]; d: [number, number, number] };
  // Keyframes traced frame by frame from broadcast replays of Dhoni's sixes (behind-the-bowler and
  // side-on views): deep crouch, the very high vertical backlift, a short stride, the bottom-hand
  // whip, and his signature finishes. P = [x, y, z]; g = top-hand grip; d = bat direction.
  const PI2 = Math.PI / 2;
  // stance: wide base, knees well bent, head over the front knee, bat held up off the ground behind
  const stance: Omit<BK, "t"> = { pel: [0, 0.84, -0.9], face: PI2 + 0.3, lean: 0.4, fl: [0.1, 0.08, -1.14], fr: [-0.02, 0.08, -0.64], g: [0.26, 0.96, -0.78], d: [0.55, 0.1, 0.83] };
  // the high backlift: bat straight up above the back shoulder, hands at head height, still crouched
  const backlift: Omit<BK, "t"> = { pel: [0, 0.84, -0.9], face: PI2 + 0.2, lean: 0.36, fl: [0.1, 0.08, -1.24], fr: [-0.02, 0.08, -0.6], g: [0.14, 1.48, -0.66], d: [0.0, 0.99, 0.12] };
  // per shot: [contact, ...follow-through] — the downswing is blended from the backlift
  const BATS: Record<string, Omit<BK, "t">[]> = {
    // lofted straight hit: short stride, front leg braced, bat comes down straight; the finish stops
    // high with the hands by the chin and the bat pointing up over the shoulder (vs Australia, night T20 replay)
    straight: [
      { pel: [0.05, 0.84, -1.05], face: PI2 + 0.4, lean: 0.32, fl: [0.12, 0.08, -1.52], fr: [-0.02, 0.08, -0.62], g: [0.3, 0.98, -1.3], d: [0.02, -0.95, -0.3] },
      { pel: [0.05, 0.88, -1.1], face: PI2 + 0.7, lean: 0.22, fl: [0.12, 0.08, -1.52], fr: [-0.02, 0.1, -0.64], g: [0.26, 1.4, -1.4], d: [0.1, 0.82, -0.55] },
      { pel: [0.05, 0.93, -1.12], face: PI2 + 0.95, lean: 0.06, fl: [0.12, 0.08, -1.52], fr: [-0.04, 0.16, -0.66], g: [0.1, 1.62, -1.3], d: [-0.25, 0.85, 0.45] },
    ],
    // the whip over mid-wicket: front leg planted, bat swings across the line, wraps round the
    // neck and then recoils back up on the leg side — the helicopter twirl (vs Australia, day ODI replay)
    leg: [
      { pel: [0.0, 0.84, -1.1], face: PI2 + 0.5, lean: 0.3, fl: [-0.08, 0.08, -1.55], fr: [0.0, 0.08, -0.55], g: [0.25, 1.05, -1.3], d: [-0.1, -0.4, -0.91] },
      { pel: [-0.02, 0.88, -1.12], face: PI2 + 1.15, lean: 0.2, fl: [-0.08, 0.08, -1.55], fr: [0.02, 0.1, -0.58], g: [-0.05, 1.38, -1.35], d: [-0.75, 0.5, -0.4] },
      { pel: [-0.02, 0.92, -1.1], face: PI2 + 1.35, lean: 0.1, fl: [-0.08, 0.08, -1.55], fr: [0.02, 0.16, -0.6], g: [0.05, 1.6, -1.05], d: [0.2, 0.45, 0.87] },
      { pel: [-0.02, 0.93, -1.1], face: PI2 + 1.2, lean: 0.08, fl: [-0.08, 0.08, -1.55], fr: [0.02, 0.16, -0.6], g: [-0.12, 1.5, -1.1], d: [-0.15, 0.97, 0.15] },
    ],
    // short ball, back foot: a flat swing at chest height through the off side, the bat wraps
    // behind the head and finishes straight up, with the front leg thrown wide (vs New Zealand, 2019 World Cup semi-final, off Ferguson)
    off: [
      { pel: [0.0, 0.88, -0.7], face: PI2 + 0.25, lean: 0.12, fl: [0.22, 0.08, -1.2], fr: [-0.04, 0.08, -0.42], g: [0.45, 1.3, -0.9], d: [0.55, 0.05, -0.83] },
      { pel: [0.0, 0.9, -0.72], face: PI2 + 0.55, lean: 0.05, fl: [0.3, 0.08, -1.3], fr: [-0.08, 0.1, -0.42], g: [0.3, 1.62, -0.8], d: [-0.45, 0.35, -0.82] },
      { pel: [0.0, 0.88, -0.75], face: PI2 + 0.75, lean: -0.05, fl: [0.42, 0.08, -1.4], fr: [-0.18, 0.12, -0.42], g: [0.2, 1.68, -0.72], d: [-0.7, 0.2, 0.68] },
      { pel: [0.0, 0.82, -0.78], face: PI2 + 0.85, lean: -0.1, fl: [0.48, 0.08, -1.45], fr: [-0.22, 0.12, -0.42], g: [0.15, 1.98, -0.75], d: [0.05, 0.95, 0.3] },
    ],
  };
  // the downswing: hands drop by the back hip while the bat is still pointing up and back
  const DOWN: Record<string, { g: [number, number, number]; d: [number, number, number] }> = {
    straight: { g: [0.24, 1.15, -0.85], d: [0.0, 0.45, 0.89] },
    leg: { g: [0.24, 1.2, -0.82], d: [0.05, 0.3, 0.95] },
    off: { g: [0.3, 1.42, -0.76], d: [-0.2, 0.2, 0.95] },
  };
  const downswing = (shot: string, hit: Omit<BK, "t">): Omit<BK, "t"> => ({
    ...hit,
    pel: [hit.pel[0], hit.pel[1] - 0.02, (hit.pel[2] + backlift.pel[2]) / 2],
    face: (hit.face + backlift.face) / 2,
    lean: (hit.lean + backlift.lean) / 2,
    g: DOWN[shot].g,
    d: DOWN[shot].d,
  });
  const lerpArr = (a: number[], b: number[], t: number) => a.map((x, i) => lerp(x, b[i], t)) as [number, number, number];
  const mixBK = (a: Omit<BK, "t">, b: Omit<BK, "t">, t: number): Omit<BK, "t"> => ({
    pel: lerpArr(a.pel, b.pel, t),
    face: lerp(a.face, b.face, t),
    lean: lerp(a.lean, b.lean, t),
    fl: lerpArr(a.fl, b.fl, t),
    fr: lerpArr(a.fr, b.fr, t),
    g: lerpArr(a.g, b.g, t),
    d: lerpArr(a.d, b.d, t),
  });
  const FOLLOW = 0.16; // share of a ball spent in the follow-through
  const batPose = (shot: string, t: number) => {
    const keys = BATS[shot];
    const hit = keys[0];
    const finish = keys[keys.length - 1];
    if (t < 0.28) return stance;
    if (t < T_RELEASE) return mixBK(stance, backlift, smooth(0.28, T_RELEASE, t));
    if (t < T_BOUNCE) return backlift; // hold the backlift — stillness before the strike
    const mid = (T_BOUNCE + T_CONTACT) / 2;
    if (t < mid) return mixBK(backlift, downswing(shot, hit), smooth(T_BOUNCE, mid, t));
    if (t < T_CONTACT) return mixBK(downswing(shot, hit), hit, smooth(mid, T_CONTACT, t));
    if (t < T_CONTACT + FOLLOW) {
      const f = ((t - T_CONTACT) / FOLLOW) * (keys.length - 1);
      const i = Math.min(keys.length - 2, Math.floor(f));
      const u = f - i;
      return mixBK(keys[i], keys[i + 1], u * u * (3 - 2 * u));
    }
    // hold the finish, then reset for the next ball
    return mixBK(finish, stance, smooth(0.93, 1.0, t));
  };
  const contactPoint = (shot: string) => {
    const h = BATS[shot][0];
    return v(h.g[0] + h.d[0] * 0.72, h.g[1] + h.d[1] * 0.72, h.g[2] + h.d[2] * 0.72);
  };

  const poseBatter = (shot: string, t: number) => {
    const k = batPose(shot, t);
    const g = v(...k.g);
    const d = v(...k.d).normalize();
    solve(msd, {
      pel: v(...k.pel),
      face: k.face,
      hipFace: Math.PI / 2 + (k.face - Math.PI / 2) * 0.5,
      lean: k.lean,
      footL: v(...k.fl),
      footR: v(...k.fr),
      handL: g.clone(),
      handR: g.clone().addScaledVector(d, 0.11),
    });
    msd.j.batA.copy(g).addScaledVector(d, -0.08);
    msd.j.batB.copy(g).addScaledVector(d, 0.9);
    writePerson(msd);
  };

  // ---------- bowler ----------
  const RUN_FROM = -42;
  const CREASE = -19.6;
  const poseBowler = (t: number) => {
    const runT = smooth(T_RUN0, T_STRIDE + 0.04, t);
    const z = t < T_STRIDE + 0.04 ? lerp(RUN_FROM, CREASE - 0.6, runT) : lerp(CREASE - 0.6, CREASE + 3.2, smooth(T_STRIDE + 0.04, 0.62, t));
    const x = 0.6;
    const phase = (z - RUN_FROM) * 1.25;
    const running = t < T_STRIDE;
    const deliver = smooth(T_STRIDE, T_RELEASE + 0.02, t);
    const after = smooth(T_RELEASE, 0.6, t);
    const stride = running ? 0.42 : 0.0;
    const bob = running ? Math.abs(Math.sin(phase)) * 0.06 : 0;
    const pel = v(x, 0.95 + bob - deliver * 0.08 * (1 - after), z);
    const footL = v(x + 0.12, 0.08 + (running ? Math.max(0, Math.cos(phase)) * 0.22 : 0), z + (running ? Math.sin(phase) * stride : 0.55 * deliver + 0.2 * after));
    const footR = v(x - 0.12, 0.08 + (running ? Math.max(0, -Math.cos(phase)) * 0.22 : 0), z - (running ? Math.sin(phase) * stride : 0.35 * deliver - 0.6 * after));
    // bowling arm windmill: angle from down-back, over the top, to down-front
    const sh = v(x - 0.19, 1.38 + bob, z);
    let handR: V3;
    let handL: V3;
    if (running) {
      handR = v(x - 0.25, 0.92 + bob, z - Math.sin(phase) * 0.3);
      handL = v(x + 0.25, 0.92 + bob, z + Math.sin(phase) * 0.3);
    } else {
      const beta = lerp(-1.9, -6.1, smooth(T_STRIDE, T_RELEASE + 0.05, t)); // radians
      handR = sh.clone().add(v(0, Math.sin(beta) * 0.58, Math.cos(beta) * 0.58));
      handL = v(x + 0.3, lerp(1.9, 0.9, smooth(T_STRIDE, T_RELEASE + 0.03, t)), z + lerp(0.4, -0.1, deliver));
    }
    solve(bowler, { pel, face: lerp(0, -0.5, deliver * (1 - after)), lean: 0.12 + deliver * 0.25 * (1 - after * 0.5), footL, footR, handL, handR });
    writePerson(bowler);
    return bowler.j.haR;
  };

  // ---------- ball ----------
  const ballMat = mat(0xffffff, 4, 1.4);
  const trailMat = mat(0xffe27a, 6, 0.8);
  const ballN = 60;
  const ballGeo = track(new THREE.BufferGeometry());
  const ballPts = new Float32Array(ballN * 3);
  const ballA = new Float32Array(ballN).map(() => 0.6 + rnd() * 0.4);
  ballGeo.setAttribute("position", new THREE.BufferAttribute(ballPts, 3));
  ballGeo.setAttribute("a", new THREE.BufferAttribute(ballA, 1));
  const ball = new THREE.Points(ballGeo, ballMat);
  ball.frustumCulled = false;
  scene.add(ball);
  const TRAIL = 140;
  const trailGeo = track(new THREE.BufferGeometry());
  const trailPts = new Float32Array(TRAIL * 3);
  const trailA = new Float32Array(TRAIL);
  trailGeo.setAttribute("position", new THREE.BufferAttribute(trailPts, 3));
  trailGeo.setAttribute("a", new THREE.BufferAttribute(trailA, 1));
  const trail = new THREE.Points(trailGeo, trailMat);
  trail.frustumCulled = false;
  scene.add(trail);
  const ballSprite = new THREE.Sprite(track(new THREE.SpriteMaterial({ map: glowTex, blending: THREE.AdditiveBlending, depthWrite: false, transparent: true, color: 0xfff2c0, sizeAttenuation: false })));
  ballSprite.scale.setScalar(0.05);
  scene.add(ballSprite);

  const RELEASE = v(0.35, 2.2, CREASE + 0.2);
  const BOUNCE_FULL = v(0.3, 0.0, -4.6);
  const BOUNCE_SHORT = v(0.35, 0.0, -9.5);
  const landFor = (dir: [number, number]) => {
    const d = new THREE.Vector2(dir[0], dir[1]).normalize();
    // land ~14 m beyond the rope, measured from the ground centre
    const R = BOUNDARY + 14;
    // ray from contact (≈ striker end) to the circle centred at (0,-10)
    const cx = 0;
    const cz = -10;
    const ox = 0.4 - cx;
    const oz = -1.5 - cz;
    const b = ox * d.x + oz * d.y;
    const c = ox * ox + oz * oz - R * R;
    const s = -b + Math.sqrt(b * b - c);
    return v(0.4 + d.x * s, 9, -1.5 + d.y * s);
  };
  const ballAt = (shot: number, t: number, out: V3) => {
    const sh = SHOTS[shot];
    const C = contactPoint(sh.id);
    const BOUNCE = sh.id === "off" ? BOUNCE_SHORT : BOUNCE_FULL;
    if (t < T_RELEASE) return false;
    if (t < T_BOUNCE) {
      const u = (t - T_RELEASE) / (T_BOUNCE - T_RELEASE);
      out.lerpVectors(RELEASE, BOUNCE, u);
      out.y = lerp(RELEASE.y, 0.02, u) + Math.sin(u * Math.PI) * 0.25;
      return true;
    }
    if (t < T_CONTACT) {
      const u = (t - T_BOUNCE) / (T_CONTACT - T_BOUNCE);
      out.lerpVectors(BOUNCE, C, u);
      out.y = lerp(0.02, C.y, Math.sqrt(u));
      return true;
    }
    const L = landFor(sh.dir);
    const u = Math.min(1.25, (t - T_CONTACT) / (T_LAND - T_CONTACT));
    const peak = shot === 1 ? 30 : shot === 2 ? 24 : 34;
    out.lerpVectors(C, L, u);
    out.y = lerp(C.y, L.y, u) + 4 * peak * u * (1 - u);
    if (u > 1) out.y = Math.max(L.y - (u - 1) * 12, 2);
    return true;
  };

  // ---------- team colours (follow the site theme) ----------
  const PAL = {
    classic: { bg: 0x0d0900, ground: 0xffd24a, crowd: 0xffc21a, light: 0xfff1b0, stump: 0xfff0b8, dim: 0xffc93a, msd: 0xfff3c4, halo: 0xffd34d, trail: 0xffe27a, sprite: 0xffcf40 },
    csk: { bg: 0x100c00, ground: 0xffde3a, crowd: 0xffd200, light: 0xfff6c0, stump: 0xfff4c4, dim: 0xffd84a, msd: 0xfffbe0, halo: 0xffe14a, trail: 0xfff07a, sprite: 0xffdc2a },
    india: { bg: 0x020a1e, ground: 0x5f9bff, crowd: 0x3a78ff, light: 0xdfe9ff, stump: 0xffb46a, dim: 0x6aa2ff, msd: 0xe9f1ff, halo: 0x5f9bff, trail: 0xffa54d, sprite: 0x7fb0ff },
  } as const;
  const offTheme = onTheme(() => {
    const p = PAL[currentTheme()];
    renderer.setClearColor(p.bg, 1);
    groundMat.uniforms.uColor.value.setHex(p.ground);
    crowdMat.uniforms.uColor.value.setHex(p.crowd);
    lightMat.uniforms.uColor.value.setHex(p.light);
    stumpMat.uniforms.uColor.value.setHex(p.stump);
    dimMat.uniforms.uColor.value.setHex(p.dim);
    msdMat.uniforms.uColor.value.setHex(p.msd);
    msdHalo.uniforms.uColor.value.setHex(p.halo);
    trailMat.uniforms.uColor.value.setHex(p.trail);
    (haloSprite.material as import("three").SpriteMaterial).color.setHex(p.sprite);
    floodSprite?.color.setHex(p.light);
  });

  // ---------- camera ----------
  const camPos = v(0, 6, -50);
  const camLook = v(0, 1, -4);
  const tPos = v(0, 0, 0);
  const tLook = v(0, 0, 0);
  let fov = 16;
  let mobile = false;

  const resize = () => {
    const w = section.clientWidth;
    const h = section.clientHeight;
    mobile = w < 860;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
    const scale = (h * DPR) / 2;
    mats.forEach((m) => (m.uniforms.uScale.value = scale));
  };
  resize();
  const ro = new ResizeObserver(resize);
  ro.observe(section);

  let visible = false;
  const io = new IntersectionObserver(([e]) => (visible = e.isIntersecting), { rootMargin: "200px" });
  io.observe(section);

  const clock = new THREE.Clock();
  let smoothP = progRef.current;
  let raf = 0;
  let lastShot = -1;
  let soundFor = -1;
  let flashFor = -1;
  let flash = 0;
  const bp = new THREE.Vector3();
  const tagPos = new THREE.Vector3();

  const tick = () => {
    raf = requestAnimationFrame(tick);
    if (!visible) return;
    const dt = Math.min(0.05, clock.getDelta());
    const time = clock.elapsedTime;
    smoothP += (progRef.current - smoothP) * Math.min(1, dt * 5);
    const G = Math.min(NS - 0.0001, Math.max(0, smoothP * NS));
    const shot = Math.floor(G);
    const t = G - shot;
    const sh = SHOTS[shot];

    if (shot !== lastShot) lastShot = shot;

    // people
    const hand = poseBowler(t);
    poseBatter(sh.id, t);
    haloSprite.position.copy(msd.j.chest);

    // ball
    const hasBall = t >= T_RELEASE ? ballAt(shot, t, bp) : false;
    if (!hasBall && t < T_RELEASE && t > T_STRIDE) bp.copy(hand);
    const showBall = hasBall || (t > 0.05 && t < T_RELEASE);
    if (!hasBall && t <= T_STRIDE) bp.copy(hand);
    for (let i = 0; i < ballN; i++) {
      ballPts[i * 3] = bp.x + (rnd() - 0.5) * 0.09;
      ballPts[i * 3 + 1] = bp.y + (rnd() - 0.5) * 0.09;
      ballPts[i * 3 + 2] = bp.z + (rnd() - 0.5) * 0.09;
    }
    ballGeo.attributes.position.needsUpdate = true;
    ball.visible = showBall;
    ballSprite.visible = showBall;
    ballSprite.position.copy(bp);
    ballSprite.scale.setScalar(t > T_CONTACT ? 0.07 : 0.04);
    // trail (rebuilt from the analytic path so it's correct when scrubbing backwards)
    let n = 0;
    if (t > T_RELEASE) {
      const t0 = Math.max(T_RELEASE, t - (t > T_CONTACT ? 0.14 : 0.05));
      for (let i = 0; i < TRAIL; i++) {
        const tt = lerp(t0, t, i / (TRAIL - 1));
        if (!ballAt(shot, tt, tmp)) continue;
        trailPts[n * 3] = tmp.x;
        trailPts[n * 3 + 1] = tmp.y;
        trailPts[n * 3 + 2] = tmp.z;
        trailA[n] = 0.05 + 0.9 * (i / TRAIL);
        n++;
      }
    }
    trailGeo.setDrawRange(0, n);
    trailGeo.attributes.position.needsUpdate = true;
    trailGeo.attributes.a.needsUpdate = true;

    // the six moment: bat crack + roar at contact (only when scrolling forward), crowd flare on landing
    const forward = progRef.current >= smoothP - 0.0005;
    if (t >= T_CONTACT && t < T_CONTACT + 0.06 && soundFor !== shot && forward) {
      soundFor = shot;
      if (soundRef.current) playSix();
    }
    if (t < T_CONTACT - 0.02) soundFor = soundFor === shot ? -1 : soundFor;
    const landed = t > T_LAND - 0.02;
    if (landed && flashFor !== shot) {
      flashFor = shot;
      flash = 1;
    }
    if (!landed && flashFor === shot) flashFor = -1;
    flash = Math.max(0, flash - dt * 0.6);
    crowdMat.uniforms.uGlow.value = 1 + flash * 1.6 + (landed ? 0.4 : 0);
    mats.forEach((m) => (m.uniforms.uTime.value = time));
    msdMat.uniforms.uGlow.value = 1.0 + Math.sin(time * 2.2) * 0.15;

    // cameras: TV (behind the bowler) → FOLLOW (chase the ball) → SIX CAM (wide, from the stands)
    const camMode = t < T_CONTACT + 0.01 ? 0 : t < 0.74 ? 1 : 2;
    const wide = mobile ? 1.55 : 1;
    if (camMode === 0) {
      tPos.set(0.4, 6.8, -64);
      tLook.set(0.2, 0.7, -1.5);
      fov = 9.5 * wide;
      // slow push-in during the run-up
      tPos.z += smooth(0, T_RELEASE, t) * 6;
    } else {
      const L = landFor(sh.dir);
      const C = contactPoint(sh.id);
      const side = new THREE.Vector3(L.z - C.z, 0, -(L.x - C.x)).normalize();
      const dirH = new THREE.Vector3(L.x - C.x, 0, L.z - C.z).normalize();
      if (camMode === 1) {
        // FOLLOW: from just behind the batter, chasing the ball's line
        tPos.copy(C).addScaledVector(dirH, -6).addScaledVector(side, 2.4).add(v(0, 1.9, 0));
        tLook.copy(bp).lerp(C, 0.62);
        tLook.y = Math.min(tLook.y, 4.2);
        fov = 68 * (mobile ? 1.15 : 1);
      } else {
        // SIX CAM: high and wide behind the batter — the whole ground and the ball dropping into the stands
        tPos.copy(C).addScaledVector(dirH, -14).add(v(0, 13, 0)).addScaledVector(side, 4);
        tLook.copy(C).lerp(L, 0.62).setY(9);
        fov = 54 * (mobile ? 1.25 : 1);
      }
    }
    const k = Math.min(1, dt * (camMode === 0 ? 3.5 : 2.2));
    camPos.lerp(tPos, k);
    camLook.lerp(tLook, k);
    // test hook: a fixed close camera for checking poses
    const dbg = (window as unknown as { __miCam?: { p: number[]; l: number[]; f: number } }).__miCam;
    if (dbg) {
      camPos.set(dbg.p[0], dbg.p[1], dbg.p[2]);
      camLook.set(dbg.l[0], dbg.l[1], dbg.l[2]);
      fov = dbg.f;
      camera.fov = dbg.f;
      msdMat.uniforms.uGlow.value = 0.32;
      msdHalo.uniforms.uGlow.value = 0;
      haloSprite.visible = false;
    }
    camera.position.copy(camPos);
    camera.fov += (fov - camera.fov) * k;
    camera.updateProjectionMatrix();
    camera.lookAt(camLook);

    renderer.render(scene, camera);

    // the MSD tag follows his head
    tagPos.copy(msd.j.head).add(v(0, 0.45, 0)).project(camera);
    const onScreen = tagPos.z < 1 && Math.abs(tagPos.x) < 1.1 && Math.abs(tagPos.y) < 1.1;
    tag.style.opacity = onScreen && camMode === 0 ? "1" : "0";
    tag.style.transform = `translate3d(${((tagPos.x + 1) / 2) * section.clientWidth}px, ${((1 - tagPos.y) / 2) * section.clientHeight}px, 0)`;

    const phase = t < T_STRIDE ? 0 : t < T_CONTACT ? 1 : t < T_LAND ? 2 : 3;
    report({ shot, phase, cam: camMode, six: t > T_LAND - 0.01 });
  };
  tick();

  return () => {
    offTheme();
    cancelAnimationFrame(raf);
    ro.disconnect();
    io.disconnect();
    disposables.forEach((d) => d.dispose());
    renderer.dispose();
  };
}
