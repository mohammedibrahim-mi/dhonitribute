"use client";

import { useEffect, useRef, useState } from "react";
import { cssVar, onTheme } from "@/lib/theme";
import { getGsap, prefersReducedMotion, refreshTriggers, scrollToY } from "@/lib/motion";

/**
 * "Lightning behind the stumps" — a scroll-driven Three.js close-up and a little game.
 * Only the keeping gloves, the stumps and the bails are on screen. Scroll slowly and the ball
 * arrives from the left into the gloves; then scroll FAST — the time it takes you to scroll from
 * the catch to the bails coming off decides your stumping time (0.08 s … 0.15 s), shown as
 * electrified text. Tier references are his widely reported stumpings.
 */

export const TIERS = [
  { t: "0.08", who: "Keemo Paul · 2018", note: "His record", maxMs: 180, verdict: "Thala speed. Faster than the eye." },
  { t: "0.09", who: "Mitchell Marsh · 2012", note: "", maxMs: 330, verdict: "Lightning hands!" },
  { t: "0.10", who: "Shubman Gill · IPL 2023 final", note: "", maxMs: 550, verdict: "A tenth of a second. Sharp." },
  { t: "0.12", who: "Suryakumar Yadav · IPL 2025", note: "", maxMs: 900, verdict: "Quick — but Thala is quicker." },
  { t: "0.15", who: "Still faster than a blink", note: "", maxMs: Infinity, verdict: "Out — but scroll faster to beat it!" },
];

const STEPS = [
  { at: 0.0, title: "Watch the ball", text: "Scroll slowly. Let it come to you." },
  { at: 0.3, title: "Get ready…", text: "The moment it lands in the gloves — scroll FAST." },
  { at: 0.45, title: "NOW! ⚡", text: "Scroll fast. Break the stumps." },
  { at: 0.62, title: "Stumped.", text: "" },
];
// timeline marks (scroll progress 0..1)
const T_BALL_START = 0.04;
const T_BOUNCE = 0.3;
const T_CATCH = 0.45;
const T_GATHER = 0.5;
const T_HIT = 0.62;
const T_RESULT = 0.66;

export default function StumpingScene() {
  const root = useRef<HTMLElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const flashRef = useRef<HTMLDivElement>(null);
  const boltsRef = useRef<SVGSVGElement>(null);
  const stRef = useRef<{ start: number; end: number } | null>(null);
  const [mode, setMode] = useState<"pending" | "webgl" | "static">("pending");
  const progRef = useRef(0);
  const onProgRef = useRef<((p: number) => void) | null>(null);
  // the pin is created right away (not after the 3D scene loads) so the page layout never jumps
  useEffect(() => {
    if (mode !== "webgl" || !root.current) return;
    const { ScrollTrigger } = getGsap();
    const st = ScrollTrigger.create({
      trigger: root.current,
      start: "top top",
      end: "+=360%",
      pin: true,
      anticipatePin: 1,
      onRefresh: (self) => (stRef.current = { start: self.start, end: self.end }),
      onUpdate: (self) => {
        stRef.current = { start: self.start, end: self.end };
        progRef.current = self.progress;
        onProgRef.current?.(self.progress);
      },
    });
    requestAnimationFrame(refreshTriggers);
    return () => st.kill();
  }, [mode]);
  const [step, setStep] = useState(0);
  const [tier, setTier] = useState<number | null>(null);
  const [ms, setMs] = useState<number | null>(null);
  const [showResult, setShowResult] = useState(false);

  useEffect(() => {
    const ok = (() => {
      try {
        return !!document.createElement("canvas").getContext("webgl2");
      } catch {
        return false;
      }
    })();
    setMode(ok && !prefersReducedMotion() ? "webgl" : "static");
  }, []);

  // ---------- the 3D scene ----------
  useEffect(() => {
    if (mode !== "webgl" || !root.current || !canvasRef.current) return;
    let disposed = false;
    let cleanup = () => {};

    (async () => {
      const THREE = await import("three");
      const { RoundedBoxGeometry } = await import("three/examples/jsm/geometries/RoundedBoxGeometry.js");
      if (disposed) return;
      const section = root.current!;
      const canvas = canvasRef.current!;

      const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, powerPreference: "high-performance" });
      renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
      renderer.shadowMap.enabled = true;
      renderer.shadowMap.type = THREE.PCFSoftShadowMap;
      renderer.toneMapping = THREE.ACESFilmicToneMapping;
      renderer.toneMappingExposure = 1.05;
      renderer.setClearColor(0x07070a, 1);

      const scene = new THREE.Scene();
      scene.fog = new THREE.Fog(0x07070a, 4, 16);
      const camera = new THREE.PerspectiveCamera(34, 1, 0.02, 60);

      // lights
      scene.add(new THREE.HemisphereLight(0xdfe8ff, 0x10200c, 0.45));
      const key = new THREE.DirectionalLight(0xfff1dc, 2.6);
      key.position.set(-2.5, 5, 3.5);
      key.castShadow = true;
      key.shadow.mapSize.set(1024, 1024);
      Object.assign(key.shadow.camera, { left: -1.5, right: 1.5, top: 1.5, bottom: -1.5 });
      key.shadow.bias = -0.0005;
      scene.add(key);
      const rim = new THREE.DirectionalLight(0x7fc8ff, 1.4);
      rim.position.set(3, 2.5, -3);
      scene.add(rim);
      const impact = new THREE.PointLight(0xff5aa0, 0, 2.5);
      scene.add(impact);

      // ground: pitch + outfield, crease
      const ground = new THREE.Mesh(new THREE.PlaneGeometry(40, 40), new THREE.MeshStandardMaterial({ color: 0x173b1b, roughness: 1 }));
      ground.rotation.x = -Math.PI / 2;
      ground.receiveShadow = true;
      scene.add(ground);
      const pitch = new THREE.Mesh(new THREE.PlaneGeometry(22, 3.05), new THREE.MeshStandardMaterial({ color: 0xb7a479, roughness: 1 }));
      pitch.rotation.x = -Math.PI / 2;
      pitch.position.set(-9.5, 0.002, 0);
      pitch.receiveShadow = true;
      scene.add(pitch);
      const lineMat = new THREE.MeshBasicMaterial({ color: 0xf2f2ee });
      const crease = new THREE.Mesh(new THREE.PlaneGeometry(0.05, 2.64), lineMat);
      crease.rotation.x = -Math.PI / 2;
      crease.position.set(0, 0.004, 0);
      scene.add(crease);
      const popping = new THREE.Mesh(new THREE.PlaneGeometry(0.05, 3.6), lineMat);
      popping.rotation.x = -Math.PI / 2;
      popping.position.set(-1.22, 0.004, 0);
      scene.add(popping);

      // floodlight bokeh
      {
        const n = 500;
        const pos = new Float32Array(n * 3);
        const r = mulberry(9);
        for (let i = 0; i < n; i++) {
          const a = (r() - 0.5) * Math.PI * 1.6;
          const d = 12 + r() * 6;
          pos.set([Math.cos(a) * d * 0.6 + 4, 1.2 + r() * 5, Math.sin(a) * d], i * 3);
        }
        const g = new THREE.BufferGeometry();
        g.setAttribute("position", new THREE.BufferAttribute(pos, 3));
        scene.add(new THREE.Points(g, new THREE.PointsMaterial({ color: 0xfff0c8, size: 0.12, transparent: true, opacity: 0.45, depthWrite: false, fog: false })));
      }

      const M = {
        stump: new THREE.MeshStandardMaterial({ color: 0xe0559a, roughness: 0.3, emissive: 0xff2a7a, emissiveIntensity: 0.05 }),
        bail: new THREE.MeshStandardMaterial({ color: 0xe0559a, roughness: 0.25, emissive: 0xff3a3a, emissiveIntensity: 0.05 }),
        led: new THREE.MeshBasicMaterial({ color: 0xff3a5a, transparent: true, opacity: 0 }),
        glove: new THREE.MeshStandardMaterial({ color: 0x16161a, roughness: 0.42 }),
        gloveHi: new THREE.MeshStandardMaterial({ color: 0x2a2a30, roughness: 0.35 }),
        palm: new THREE.MeshStandardMaterial({ color: 0x6a1420, roughness: 0.6 }),
        gold: new THREE.MeshStandardMaterial({ color: 0xd4af37, metalness: 0.7, roughness: 0.3 }),
        band: new THREE.MeshStandardMaterial({ color: 0xf4c21b, roughness: 0.6 }),
        ball: new THREE.MeshStandardMaterial({ color: 0xf4f4f0, roughness: 0.35 }),
        seam: new THREE.MeshStandardMaterial({ color: 0x2a2a2a, roughness: 0.6 }),
      };
      const sh = <T extends import("three").Object3D>(o: T) => {
        o.traverse((c) => {
          const m = c as import("three").Mesh;
          if (m.isMesh) {
            m.castShadow = true;
            m.receiveShadow = true;
          }
        });
        return o;
      };

      // stumps (with a glowing LED core) and bails
      const STUMP_H = 0.71;
      const stumps = [-0.114, 0, 0.114].map((z) => {
        const g = new THREE.Group();
        const s = new THREE.Mesh(new THREE.CylinderGeometry(0.018, 0.018, STUMP_H, 24), M.stump);
        const core = new THREE.Mesh(new THREE.CylinderGeometry(0.021, 0.021, STUMP_H * 0.96, 16), M.led);
        g.add(s, core);
        g.position.set(0, STUMP_H / 2, z);
        scene.add(sh(g));
        return g;
      });
      const bails = [-0.057, 0.057].map((z) => {
        const g = new THREE.Group();
        const barrel = new THREE.Mesh(new THREE.CapsuleGeometry(0.013, 0.07, 4, 14), M.bail);
        const spig = new THREE.Mesh(new THREE.CylinderGeometry(0.006, 0.006, 0.12, 8), M.bail);
        const glow = new THREE.Mesh(new THREE.CapsuleGeometry(0.02, 0.075, 4, 12), M.led);
        g.add(barrel, spig, glow);
        g.rotation.x = Math.PI / 2;
        g.position.set(0, STUMP_H + 0.013, z);
        scene.add(sh(g));
        return { g, p0: g.position.clone() };
      });

      // ball
      const ball = new THREE.Group();
      ball.add(new THREE.Mesh(new THREE.SphereGeometry(0.036, 32, 20), M.ball));
      const seam = new THREE.Mesh(new THREE.TorusGeometry(0.0362, 0.0024, 6, 40), M.seam);
      ball.add(seam);
      scene.add(sh(ball));

      // keeping gloves (palm faces -x, fingers point down)
      const makeGlove = (side: 1 | -1) => {
        const g = new THREE.Group();
        const back = new THREE.Mesh(new RoundedBoxGeometry(0.075, 0.15, 0.13, 4, 0.03), M.glove);
        g.add(back);
        const ridge = new THREE.Mesh(new RoundedBoxGeometry(0.02, 0.12, 0.1, 2, 0.008), M.gloveHi);
        ridge.position.set(0.04, 0.005, 0);
        g.add(ridge);
        const palm = new THREE.Mesh(new RoundedBoxGeometry(0.018, 0.14, 0.12, 2, 0.007), M.palm);
        palm.position.x = -0.04;
        g.add(palm);
        for (let i = 0; i < 4; i++) {
          const f = new THREE.Mesh(new RoundedBoxGeometry(0.07, 0.115, 0.03, 3, 0.013), M.glove);
          f.position.set(-0.012, -0.125, -0.048 + i * 0.032);
          f.rotation.z = -0.32;
          g.add(f);
          const fp = new THREE.Mesh(new RoundedBoxGeometry(0.012, 0.1, 0.026, 2, 0.005), M.palm);
          fp.position.set(-0.05, -0.12, -0.048 + i * 0.032);
          fp.rotation.z = -0.32;
          g.add(fp);
        }
        const thumb = new THREE.Mesh(new RoundedBoxGeometry(0.055, 0.1, 0.036, 3, 0.014), M.glove);
        thumb.position.set(-0.03, -0.03, side * 0.078);
        thumb.rotation.set(side * 0.5, 0, -0.5);
        g.add(thumb);
        const web = new THREE.Mesh(new THREE.BoxGeometry(0.006, 0.07, 0.04), M.palm);
        web.position.set(-0.045, -0.06, side * 0.062);
        g.add(web);
        const cuff = new THREE.Mesh(new THREE.CylinderGeometry(0.056, 0.064, 0.06, 24), M.glove);
        cuff.position.y = 0.1;
        g.add(cuff);
        const ring = new THREE.Mesh(new THREE.TorusGeometry(0.064, 0.006, 8, 32), M.gold);
        ring.rotation.x = Math.PI / 2;
        ring.position.y = 0.085;
        g.add(ring);
        const band = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.054, 0.03, 24), M.band);
        band.position.y = 0.143;
        g.add(band);
        scene.add(sh(g));
        return g;
      };
      const gloves = [makeGlove(1), makeGlove(-1)];

      // sparks
      const SPARKS = 90;
      const sparkPos = new Float32Array(SPARKS * 3);
      const sparkVel: number[] = [];
      {
        const r = mulberry(5);
        for (let i = 0; i < SPARKS; i++) {
          const a = r() * Math.PI * 2;
          const sp = 0.4 + r() * 1.5;
          sparkVel.push(Math.cos(a) * sp - 0.5, 0.6 + r() * 2.2, Math.sin(a) * sp);
        }
      }
      const sparkGeo = new THREE.BufferGeometry();
      sparkGeo.setAttribute("position", new THREE.BufferAttribute(sparkPos, 3));
      const sparkMat = new THREE.PointsMaterial({ color: 0xffc0e0, size: 0.018, transparent: true, opacity: 0, depthWrite: false, blending: THREE.AdditiveBlending });
      const sparks = new THREE.Points(sparkGeo, sparkMat);
      sparks.frustumCulled = false;
      scene.add(sparks);

      // ---------- motion ----------
      const V = (x: number, y: number, z: number) => new THREE.Vector3(x, y, z);
      const REST = V(0.5, 0.36, 0.0);
      const CATCH = V(0.4, 0.46, 0.13);
      const GATHER = V(0.44, 0.52, 0.06);
      const HIT = V(0.07, STUMP_H + 0.05, 0.0);
      const START = V(-12, 1.7, 0.05);
      const BOUNCE = V(-2.0, 0.036, 0.11);
      const ballAt = (p: number) => {
        if (p <= T_BOUNCE) {
          const t = clamp01((p - T_BALL_START) / (T_BOUNCE - T_BALL_START));
          const v = START.clone().lerp(BOUNCE, t);
          v.y = START.y + (BOUNCE.y - START.y) * t * t;
          return v;
        }
        const t = clamp01((p - T_BOUNCE) / (T_CATCH - T_BOUNCE));
        const v = BOUNCE.clone().lerp(CATCH, t);
        v.y = BOUNCE.y + (CATCH.y - BOUNCE.y) * t + 0.3 * Math.sin(Math.PI * t * 0.8);
        return v;
      };

      // camera framing per aspect (portrait phones pull back and widen)
      const frame = () => {
        const portrait = camera.aspect < 0.85;
        return portrait
          ? { from: V(-0.85, 1.1, 2.25), to: V(-0.55, 0.98, 1.65), look: V(0.18, 0.6, 0.02), fov: 52 }
          : { from: V(-1.15, 1.05, 1.95), to: V(-0.72, 0.95, 1.35), look: V(0.2, 0.6, 0.02), fov: 34 };
      };
      let F = frame();
      const resize = () => {
        const W = section.clientWidth;
        const H = window.innerHeight;
        renderer.setSize(W, H, false);
        camera.aspect = W / H;
        F = frame();
        camera.fov = F.fov;
        camera.updateProjectionMatrix();
      };
      resize();
      window.addEventListener("resize", resize);

      // ---------- scroll + game timing ----------
      const { ScrollTrigger } = getGsap();
      let target = 0;
      let current = 0;
      let armed = false;
      let decided = false;
      let resultShown = false;
      // The game clock is event-based on the raw scroll position, independent of the frame rate.
      // The strike starts at the scroll event that first moves the gloves past the catch
      // (if the scroll had been resting there, the flick counts from that moment), and ends at
      // the event where the bails come off. Pausing after the catch never counts against you.
      let prevT = performance.now();
      let prevP = 0;
      let tStart: number | null = null;
      const judge = (p: number) => {
        const now = performance.now();
        if (p < T_CATCH - 0.015) {
          armed = true;
          tStart = null;
          if (decided) {
            decided = false;
            setTier(null);
            setMs(null);
          }
        }
        if (p < T_GATHER) tStart = null;
        else if (tStart === null && prevP < T_GATHER) {
          const gap = now - prevT;
          tStart = gap > 120 ? now - 16 : prevT; // resting → the flick starts now
        }
        if (armed && !decided && p >= T_HIT) {
          const took = Math.max(16, now - (tStart ?? now - 16));
          const i = TIERS.findIndex((t) => took <= t.maxMs);
          decided = true;
          setTier(i < 0 ? TIERS.length - 1 : i);
          setMs(Math.round(took));
        }
        const sr = p >= T_RESULT;
        if (sr !== resultShown) {
          resultShown = sr;
          setShowResult(sr);
        }
        prevT = now;
        prevP = p;
      };

      target = progRef.current;
      onProgRef.current = (p) => {
        target = p;
        judge(p);
      };
      let visible = true;
      const io = new IntersectionObserver(([e]) => (visible = e.isIntersecting), { rootMargin: "100px" });
      io.observe(section);

      let lastStep = -1;
      let raf = 0;
      const clock = new THREE.Clock();
      const hands = new THREE.Vector3();
      const tick = () => {
        raf = requestAnimationFrame(tick);
        if (!visible) return;
        const dt = Math.min(0.1, clock.getDelta());
        const time = clock.elapsedTime;
        // after the catch the visuals follow the scroll almost instantly, so a fast flick feels fast
        const k = target > T_CATCH ? 18 : 7;
        current += (target - current) * (1 - Math.exp(-dt * k));
        const p = current;

        let s = 0;
        STEPS.forEach((x, i) => {
          if (p >= x.at) s = i;
        });
        if (s !== lastStep) {
          lastStep = s;
          setStep(s);
        }

        // gloves
        let roll = 0.15;
        let pitchA = 0;
        if (p < T_CATCH) {
          const kk = smooth(T_BOUNCE - 0.04, T_CATCH, p);
          hands.copy(REST).lerp(CATCH, kk);
          hands.y += Math.sin(time * 1.7) * 0.004;
          const b = ballAt(p);
          ball.position.copy(b);
          ball.rotation.z -= 0.3;
        } else if (p < T_GATHER) {
          const kk = smooth(T_CATCH, T_GATHER, p);
          hands.copy(CATCH).lerp(GATHER, kk);
          roll = 0.15 - kk * 0.25;
        } else {
          const kk = smooth(T_GATHER, T_HIT, p);
          hands.copy(GATHER).lerp(HIT, kk);
          hands.y += Math.sin(Math.PI * kk) * 0.06;
          roll = -0.1 - kk * 0.5;
          pitchA = kk * 0.25;
        }
        gloves.forEach((g, i) => {
          const side = i === 0 ? 1 : -1;
          g.position.copy(hands).add(V(0, 0, side * 0.072));
          g.rotation.set(side * (0.12 + pitchA * 0.4), 0, roll);
        });
        if (p >= T_CATCH) ball.position.copy(hands).add(V(-0.07, -0.07, 0));

        // impact
        const since = Math.max(0, p - T_HIT) * 7;
        const lit = p >= T_HIT ? (0.55 + 0.45 * Math.abs(Math.sin(time * 18))) : 0;
        M.led.opacity = lit * 0.55;
        M.bail.emissiveIntensity = 0.05 + lit * 2.4;
        M.stump.emissiveIntensity = 0.05 + lit * 1.2;
        impact.intensity = lit * 4;
        impact.position.set(0, STUMP_H, 0);
        bails.forEach((b, i) => {
          if (p < T_HIT) {
            b.g.position.copy(b.p0);
            b.g.rotation.set(Math.PI / 2, 0, 0);
            return;
          }
          const t = since;
          const tl = Math.min(t, 0.85 + i * 0.12);
          const vx = -0.9 - i * 0.45;
          const vy = 2.6 + i * 0.5;
          const vz = (i === 0 ? -1 : 1) * 0.5;
          b.g.position.set(b.p0.x + vx * tl, Math.max(0.015, b.p0.y + vy * t - 4.9 * t * t), b.p0.z + vz * tl);
          b.g.rotation.set(Math.PI / 2 + t * 13 * (i ? 1 : -1), t * 9, t * 5);
        });
        stumps.forEach((sg, i) => {
          sg.rotation.z = p >= T_HIT ? Math.sin(since * 24) * Math.exp(-since * 3) * 0.05 * (i === 1 ? 1 : 0.5) : 0;
        });
        if (p >= T_HIT) {
          const t = since;
          for (let i = 0; i < SPARKS; i++) {
            sparkPos[i * 3] = sparkVel[i * 3] * t;
            sparkPos[i * 3 + 1] = STUMP_H + sparkVel[i * 3 + 1] * t - 4.9 * t * t;
            sparkPos[i * 3 + 2] = sparkVel[i * 3 + 2] * t;
          }
          sparkGeo.attributes.position.needsUpdate = true;
          sparkMat.opacity = Math.max(0, 1 - t * 1.4);
        } else sparkMat.opacity = 0;

        // camera: push in towards the stumps, jolt on impact
        const ck = smooth(0, T_HIT, p);
        camera.position.copy(F.from).lerp(F.to, ck);
        if (p >= T_HIT) {
          const j = Math.exp(-since * 5) * 0.02;
          camera.position.x += Math.sin(time * 61) * j;
          camera.position.y += Math.cos(time * 53) * j;
        }
        camera.lookAt(F.look);

        if (flashRef.current) {
          const f = p >= T_HIT ? Math.max(0, 1 - (p - T_HIT) * 25) : 0;
          flashRef.current.style.opacity = String(f * 0.9);
        }
        renderer.render(scene, camera);
      };
      tick();
      requestAnimationFrame(refreshTriggers);

      const offTheme = onTheme(() => {
        const c = new THREE.Color(cssVar("--stump-bg", "#07070a"));
        renderer.setClearColor(c, 1);
        scene.fog!.color.copy(c);
      });
      cleanup = () => {
        offTheme();
        cancelAnimationFrame(raf);
        io.disconnect();
        window.removeEventListener("resize", resize);
        scene.traverse((o) => {
          const m = o as import("three").Mesh;
          if (m.geometry) m.geometry.dispose();
        });
        Object.values(M).forEach((m) => m.dispose());
        sparkMat.dispose();
        renderer.dispose();
      };
    })().catch(() => {
      if (!disposed) setMode("static");
    });

    return () => {
      disposed = true;
      cleanup();
    };
  }, [mode]);

  // ---------- lightning bolts around the result ----------
  const resultOn = mode === "static" || (showResult && tier !== null);
  useEffect(() => {
    const svg = boltsRef.current;
    if (!svg || !resultOn || prefersReducedMotion()) return;
    const r = Math.random;
    const bolt = (x0: number, y0: number, x1: number, y1: number, segs: number, jag: number) => {
      let d = `M${x0.toFixed(1)} ${y0.toFixed(1)}`;
      for (let i = 1; i <= segs; i++) {
        const t = i / segs;
        const x = x0 + (x1 - x0) * t + (i < segs ? (r() - 0.5) * jag : 0);
        const y = y0 + (y1 - y0) * t + (i < segs ? (r() - 0.5) * jag : 0);
        d += ` L${x.toFixed(1)} ${y.toFixed(1)}`;
      }
      return d;
    };
    const draw = () => {
      const paths: string[] = [];
      const n = 3 + Math.floor(r() * 3);
      for (let i = 0; i < n; i++) {
        const side = r() < 0.5 ? -1 : 1;
        const y0 = 20 + r() * 60;
        paths.push(bolt(50 + side * (14 + r() * 8), y0, 50 + side * (34 + r() * 16), y0 + (r() - 0.5) * 40, 6 + Math.floor(r() * 5), 7));
      }
      // an arc across the top of the number
      if (r() < 0.6) paths.push(bolt(18 + r() * 10, 28 + r() * 10, 82 - r() * 10, 28 + r() * 10, 12, 6));
      svg.innerHTML = paths
        .map((d) => `<path d="${d}" class="zb-glow"/><path d="${d}" class="zb-core"/>`)
        .join("");
    };
    draw();
    const id = window.setInterval(draw, 110);
    return () => {
      window.clearInterval(id);
      svg.innerHTML = "";
    };
  }, [resultOn]);

  const replay = () => {
    const st = stRef.current;
    if (!st) return;
    scrollToY(st.start + (st.end - st.start) * (T_BOUNCE - 0.04));
  };

  // jump past the game to the next section
  const skip = () => {
    const st = stRef.current;
    if (st) scrollToY(st.end + window.innerHeight);
  };

  const cur = STEPS[step];
  const got = tier !== null ? TIERS[tier] : null;
  const shown = mode === "static" ? TIERS[0] : got;

  return (
    <section
      ref={root}
      id="stumping"
      className={`stumping dark ${mode === "webgl" ? "is-webgl" : "is-static"} ${step === 2 ? "is-now" : ""} ${resultOn ? "has-result" : ""}`}
      aria-labelledby="stump-h"
    >
      {/* electric distortion filter for the result text */}
      <svg width="0" height="0" aria-hidden="true" focusable="false" style={{ position: "absolute" }}>
        <filter id="zap-noise" x="-20%" y="-20%" width="140%" height="140%">
          <feTurbulence type="fractalNoise" baseFrequency="0.015 0.09" numOctaves="2" seed="1" result="n">
            <animate attributeName="seed" values="1;5;9;13;17;21;25" dur="0.7s" repeatCount="indefinite" calcMode="discrete" />
          </feTurbulence>
          <feDisplacementMap in="SourceGraphic" in2="n" scale="9" xChannelSelector="R" yChannelSelector="G" />
        </filter>
      </svg>

      {mode === "webgl" && <canvas ref={canvasRef} className="stump-canvas" aria-hidden="true" />}

      <div className="stump-ui">
        <p className="eyebrow2">The stumping game</p>
        <h2 id="stump-h" className="stump-h">
          Lightning
          <br />
          behind the stumps
        </h2>
        {mode === "webgl" && !resultOn && (
          <div className="stump-step" aria-live="polite">
            <span className="stump-n">{String(Math.min(step, 2) + 1).padStart(2, "0")}</span>
            <p key={step} className="stump-t">
              <b>{cur.title}</b> {cur.text}
            </p>
          </div>
        )}
        {mode === "webgl" && !resultOn && <p className="stump-hint" aria-hidden="true">{step < 2 ? "Scroll slowly ↓" : "Scroll FAST ↓↓"}</p>}
      </div>

      <div ref={flashRef} className="stump-flash" aria-hidden="true" />

      {mode === "webgl" && !resultOn && (
        <button type="button" className="cab-skip stump-skip" onClick={skip} aria-label="Skip the stumping game and continue down the page">
          Skip game ↓
        </button>
      )}

      <div className={`zap ${resultOn ? "is-on" : ""}`} aria-live="polite">
        {shown && (
          <>
            <p className="zap-label">{mode === "static" ? "His fastest stumping" : "Your stumping"}</p>
            <div className="zap-stage">
              <svg ref={boltsRef} className="zap-bolts" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true" />
              <p className="zap-time" data-text={`${shown.t}s`}>
                {shown.t}
                <span>s</span>
              </p>
            </div>
            <p className="zap-verdict">
              {mode === "static" ? "Widely reported as the fastest stumping in cricket." : shown.verdict}
              {mode !== "static" && ms !== null && <small> Your strike took {(ms / 1000).toFixed(2)} s of scrolling.</small>}
            </p>
            <ol className="zap-tiers">
              {TIERS.map((t, i) => (
                <li key={t.t} className={(mode === "static" ? i === 0 : i === tier) ? "is-you" : ""}>
                  <b>{t.t}s</b>
                  <span>{t.who}</span>
                </li>
              ))}
            </ol>
            {mode === "webgl" && (
              <div className="zap-actions">
                <button type="button" className="zap-again" onClick={replay}>
                  ↺ Try again — scroll faster
                </button>
                <button type="button" className="zap-again zap-next" onClick={skip}>
                  Continue ↓
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </section>
  );
}

function clamp01(x: number) {
  return Math.min(1, Math.max(0, x));
}
function smooth(e0: number, e1: number, x: number) {
  const t = clamp01((x - e0) / (e1 - e0));
  return t * t * (3 - 2 * t);
}
function mulberry(seed: number) {
  let a = seed;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return (t >>> 0) / 4294967296;
  };
}
