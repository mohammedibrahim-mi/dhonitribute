"use client";

import { useEffect, useRef, useState } from "react";
import cosmos from "@/data/cosmos.json";
import { gallery } from "@/data/gallery";
import { cssVar, onTheme } from "@/lib/theme";
import { getGsap, prefersReducedMotion, refreshTriggers } from "@/lib/motion";

/**
 * Opening scene. Every photo floats in 3D space, but each one sits on the line from the camera
 * through one cell of a halftone portrait — at its own depth and scaled by that depth — so at rest
 * the whole field projects into one flat face. Scrolling flies the camera forward: parallax pulls
 * the face apart and the moments (aesthetic photos) stream past down the middle lane.
 * The trophy photos have their own section further down.
 */

type Cell = [number, number, number, number, number, number, number, number]; // x,y,size,r,g,b,slot,lum

const D0 = 100; // distance of the virtual portrait plane
// The lane: every aesthetic photo, strongest first
const LANE_FIRST = ["stumping-flash", "fireworks-smile", "sparks-walkout", "night-knock", "helicopter-follow-through", "number-seven-wave", "golden-hour-keeper", "fan-at-his-feet"];
const laneImages = [
  ...LANE_FIRST.map((id) => gallery.find((g) => g.id === id)).filter((g): g is (typeof gallery)[number] => Boolean(g)),
  ...gallery.filter((g) => g.kind === "aesthetic" && !LANE_FIRST.includes(g.id)),
];
const LANE_N = laneImages.length;
const TRAVEL = 160 * (LANE_N + 2); // how far the camera flies over the pinned scroll
const LANE_STEP = TRAVEL / (LANE_N + 1.2);
const BG = [14 / 255, 14 / 255, 15 / 255];
const pad3 = (n: number) => String(n).padStart(3, "0");

export default function FaceCosmos() {
  const root = useRef<HTMLElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
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
      end: `+=${Math.round(LANE_N * 22 + 60)}%`,
      pin: true,
      anticipatePin: 1,
      onUpdate: (self) => {
        progRef.current = self.progress;
        onProgRef.current?.(self.progress);
      },
    });
    requestAnimationFrame(refreshTriggers);
    return () => st.kill();
  }, [mode]);
  const [lane, setLane] = useState(-1);
  const [ready, setReady] = useState(false);

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

  useEffect(() => {
    if (mode !== "webgl" || !root.current || !canvasRef.current) return;
    let disposed = false;
    let cleanup = () => {};

    (async () => {
      const THREE = await import("three");
      if (disposed) return;
      const canvas = canvasRef.current!;
      const section = root.current!;
      const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: false, powerPreference: "high-performance" });
      renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
      renderer.setClearColor(new THREE.Color(...BG), 1);
      let offTheme = () => {};
      renderer.outputColorSpace = THREE.LinearSRGBColorSpace;
      THREE.ColorManagement.enabled = false;

      const scene = new THREE.Scene();
      const camera = new THREE.PerspectiveCamera(40, 1, 0.5, 6000);

      // ---------- portrait geometry ----------
      const cells = cosmos.cells as unknown as Cell[];
      const { gw, gh, cols, rows } = cosmos;
      const rnd = mulberry(7);
      const portraitH = 2 * D0 * Math.tan(THREE.MathUtils.degToRad(20)) * 0.82; // fits 82% of view height at fov 40
      const cs = portraitH / gh;
      const STARS = window.innerWidth < 700 ? 900 : 1700;
      const N = cells.length + STARS;

      const atlas = await new Promise<import("three").Texture>((res, rej) =>
        new THREE.TextureLoader().load("/images/cosmos-atlas.webp", res, undefined, rej)
      );
      if (disposed) return;
      atlas.colorSpace = THREE.NoColorSpace;
      atlas.generateMipmaps = true;
      atlas.minFilter = THREE.LinearMipmapLinearFilter;
      atlas.anisotropy = 4;

      const geo = new THREE.PlaneGeometry(1, 1);
      const aSlot = new Float32Array(N);
      const aTint = new Float32Array(N * 3);
      const aMix = new Float32Array(N); // tint amount
      const aLum = new Float32Array(N);
      const aStar = new Float32Array(N);
      const aFrom = new Float32Array(N * 3); // intro offset (assembles on load)
      const mesh = new THREE.InstancedMesh<import("three").PlaneGeometry, import("three").Material>(geo, undefined, N);
      const m4 = new THREE.Matrix4();
      const q = new THREE.Quaternion();
      const v = new THREE.Vector3();
      const sc = new THREE.Vector3();

      cells.forEach((c, i) => {
        const [x, y, size, r, g, b, slot, lum] = c;
        const u = (x - gw / 2 + 0.5) * cs;
        const w = -(y - gh / 2 + 0.5) * cs;
        // depth factor: log-uniform between 0.45 and 9 → spreads the portrait far down the tunnel
        const k = Math.exp(Math.log(0.45) + rnd() * (Math.log(9) - Math.log(0.45)));
        v.set(u * k, w * k, -D0 * k);
        const s = cs * size * 0.92 * k;
        sc.set(s, s, 1);
        m4.compose(v, q, sc);
        mesh.setMatrixAt(i, m4);
        aSlot[i] = slot;
        aTint.set([Math.min(1, (r / 255) * 1.15), Math.min(1, (g / 255) * 1.15), Math.min(1, (b / 255) * 1.15)], i * 3);
        aMix[i] = 0.62;
        aLum[i] = lum;
        const a = rnd() * Math.PI * 2;
        const rr = 60 + rnd() * 160;
        aFrom.set([Math.cos(a) * rr * k * 0.35, Math.sin(a) * rr * k * 0.35, (rnd() - 0.5) * 80 * k], i * 3);
      });
      for (let j = 0; j < STARS; j++) {
        const i = cells.length + j;
        const z = -(D0 * 2 + rnd() * (TRAVEL + 900));
        // keep a clear lane in the middle for the lane photos
        let x = 0,
          y = 0;
        do {
          x = (rnd() - 0.5) * 2 * Math.max(60, -z * 0.5);
          y = (rnd() - 0.5) * 2 * Math.max(40, -z * 0.32);
        } while (Math.abs(x) < 22 && Math.abs(y) < 16);
        v.set(x, y, z);
        const s = 1.6 + rnd() * 3.2;
        sc.set(s, s * 0.75, 1);
        m4.compose(v, q, sc);
        mesh.setMatrixAt(i, m4);
        aSlot[i] = Math.floor(rnd() * cosmos.count);
        aTint.set([0, 0, 0], i * 3);
        aMix[i] = 0;
        aLum[i] = 1;
        aStar[i] = 1;
      }
      const ia = (arr: Float32Array, n: number) => new THREE.InstancedBufferAttribute(arr, n);
      geo.setAttribute("aSlot", ia(aSlot, 1));
      geo.setAttribute("aTint", ia(aTint, 3));
      geo.setAttribute("aMix", ia(aMix, 1));
      geo.setAttribute("aLum", ia(aLum, 1));
      geo.setAttribute("aStar", ia(aStar, 1));
      geo.setAttribute("aFrom", ia(aFrom, 3));

      const uniforms = {
        uAtlas: { value: atlas },
        uGrid: { value: new THREE.Vector2(cols, rows) },
        uFly: { value: 0 },
        uIntro: { value: 1 },
        uBg: { value: new THREE.Vector3(...BG) },
      };
      const vertexShader = /* glsl */ `
        attribute float aSlot; attribute vec3 aTint; attribute float aMix; attribute float aLum;
        attribute float aStar; attribute vec3 aFrom;
        uniform float uIntro;
        varying vec2 vUv; varying vec3 vTint; varying float vMix; varying float vLum; varying float vStar;
        varying float vDepth; varying float vSlot;
        void main(){
          vUv = uv; vSlot = aSlot; vTint = aTint; vMix = aMix; vLum = aLum; vStar = aStar;
          vec4 p = instanceMatrix * vec4(position, 1.0);
          float e = uIntro * uIntro * (3.0 - 2.0 * uIntro);
          p.xyz += aFrom * e;
          vec4 mv = modelViewMatrix * p;
          vDepth = -mv.z;
          gl_Position = projectionMatrix * mv;
        }`;
      const material = new THREE.ShaderMaterial({
        uniforms,
        vertexShader,
        fragmentShader: /* glsl */ `
          uniform sampler2D uAtlas; uniform vec2 uGrid; uniform float uFly; uniform float uIntro; uniform vec3 uBg;
          varying vec2 vUv; varying vec3 vTint; varying float vMix; varying float vLum; varying float vStar; varying float vDepth; varying float vSlot;
          void main(){
            vec2 d = abs(vUv - 0.5) - 0.5 + 0.08;
            if (length(max(d, 0.0)) > 0.08) discard;
            vec2 slot = vec2(mod(vSlot, uGrid.x), floor(vSlot / uGrid.x));
            vec2 auv = (slot + vec2(vUv.x, 1.0 - vUv.y)) / uGrid;
            auv.y = 1.0 - auv.y;
            vec3 tex = texture2D(uAtlas, auv).rgb;
            vec3 col = mix(tex, vTint, vMix) * (0.66 + 0.9 * vLum);
            // portrait tiles fade a touch as you fly; stars fade in with the flight and with distance
            float far = smoothstep(2400.0, 700.0, vDepth);
            float near = smoothstep(2.0, 18.0, vDepth);
            float vis = vStar > 0.5 ? clamp(uFly * 6.0, 0.0, 1.0) * 0.85 : 1.0;
            vis *= far * near * (1.0 - uIntro * 0.85);
            gl_FragColor = vec4(mix(uBg, col, vis), 1.0);
          }`,
      });
      mesh.material = material;
      mesh.frustumCulled = false;
      scene.add(mesh);

      // ---------- lane: the moments, down the middle ----------
      const laneItems = laneImages;
      const laneGroup = new THREE.Group();
      scene.add(laneGroup);
      const loader = new THREE.TextureLoader();
      const lanes = laneItems.map((t, i) => {
        const h = 15;
        const w = h * (t.width / t.height);
        const m = new THREE.MeshBasicMaterial({ color: 0x0e0e0f, transparent: true, opacity: 0, depthWrite: false });
        const p = new THREE.Mesh(new THREE.PlaneGeometry(w, h), m);
        const side = i % 2 ? 1 : -1;
        p.position.set(side * (4 + (i % 3) * 3), (i % 3) - 1, -(D0 * 1.6 + LANE_STEP * (i + 1)));
        laneGroup.add(p);
        return { mesh: p, mat: m, src: t.thumb, loading: false };
      });

      // ---------- layout ----------
      const resize = () => {
        const W = section.clientWidth;
        const H = window.innerHeight;
        renderer.setSize(W, H, false);
        camera.aspect = W / H;
        // wide screens: the face fills 82% of the height; narrow screens: widen the view so it fits the width
        const portraitW = gw * cs;
        const visH = Math.max(2 * D0 * Math.tan(THREE.MathUtils.degToRad(20)), portraitW / 0.94 / camera.aspect);
        camera.fov = THREE.MathUtils.radToDeg(2 * Math.atan(visH / 2 / D0));
        camera.updateProjectionMatrix();
      };
      resize();
      window.addEventListener("resize", resize);

      // ---------- scroll + pointer ----------
      const { gsap, ScrollTrigger } = getGsap();
      let target = 0;
      let current = 0;
      target = progRef.current;
      onProgRef.current = (p) => (target = p);
      const pointer = { x: 0, y: 0, tx: 0, ty: 0 };
      const onMove = (e: PointerEvent) => {
        if (e.pointerType !== "mouse") return;
        pointer.tx = (e.clientX / window.innerWidth - 0.5) * 2;
        pointer.ty = (e.clientY / window.innerHeight - 0.5) * 2;
      };
      window.addEventListener("pointermove", onMove);

      // intro: tiles gather into the face
      const intro = gsap.to(uniforms.uIntro, { value: 0, duration: 2.4, ease: "power3.out", delay: 0.15, onStart: () => setReady(true) });

      let visible = true;
      const io = new IntersectionObserver(([e]) => (visible = e.isIntersecting), { rootMargin: "100px" });
      io.observe(section);

      let lastLane = -2;
      let raf = 0;
      const tick = () => {
        raf = requestAnimationFrame(tick);
        if (!visible) return;
        current += (target - current) * 0.08;
        pointer.x += (pointer.tx - pointer.x) * 0.05;
        pointer.y += (pointer.ty - pointer.y) * 0.05;
        const z = -current * TRAVEL;
        camera.position.set(pointer.x * 1.8, -pointer.y * 1.2, z);
        camera.lookAt(pointer.x * 0.6, -pointer.y * 0.4, z - 100);
        uniforms.uFly.value = current;

        // lane photos: load when near, fade in with distance, fade out right before the camera
        let nearest = -1;
        let best = Infinity;
        lanes.forEach((l, i) => {
          const dz = z - l.mesh.position.z; // distance in front of camera
          if (!l.loading && dz < 1400) {
            l.loading = true;
            loader.load(l.src, (tx) => {
              tx.colorSpace = THREE.NoColorSpace;
              l.mat.map = tx;
              l.mat.color.set(0xffffff);
              l.mat.needsUpdate = true;
            });
          }
          const o = smooth(1100, 420, dz) * smooth(4, 40, dz) * smooth(0.004, 0.03, current);
          l.mat.opacity = l.mat.map ? o : 0;
          if (dz > 25 && dz < best) {
            best = dz;
            nearest = i;
          }
        });
        if (nearest !== lastLane && current > 0.02) {
          lastLane = nearest;
          setLane(nearest);
        } else if (current <= 0.02 && lastLane !== -1) {
          lastLane = -1;
          setLane(-1);
        }
        renderer.render(scene, camera);
      };
      tick();
      requestAnimationFrame(refreshTriggers);

      offTheme = onTheme(() => {
        const c = new THREE.Color(cssVar("--dark", "#0e0e0f"));
        renderer.setClearColor(c, 1);
        uniforms.uBg.value.set(c.r, c.g, c.b);
      });
      cleanup = () => {
        offTheme();
        cancelAnimationFrame(raf);
        intro.kill();
        io.disconnect();
        window.removeEventListener("resize", resize);
        window.removeEventListener("pointermove", onMove);
        lanes.forEach((l) => {
          l.mat.map?.dispose();
          l.mat.dispose();
          l.mesh.geometry.dispose();
        });
        geo.dispose();
        material.dispose();
        atlas.dispose();
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

  const t = lane >= 0 ? laneImages[lane] : null;

  return (
    <section
      ref={root}
      id="cosmos"
      className={`cosmos ${mode === "webgl" ? "is-webgl" : "is-static"} ${ready ? "is-ready" : ""} ${lane >= 0 ? "has-lane" : ""}`}
      aria-label={`A portrait of MS Dhoni made from ${cosmos.count} photographs`}
    >
      {mode === "webgl" ? (
        <canvas ref={canvasRef} className="cosmos-canvas" aria-hidden="true" />
      ) : (
        <img
          className="cosmos-poster"
          src="/images/cosmos-poster.webp"
          alt="A halftone portrait of MS Dhoni built from small tiles of his photographs"
          width={1664}
          height={1584}
        />
      )}

      <div className="cosmos-ui">
        <p className="cosmos-eyebrow">A fan-made tribute</p>
        <p className="cosmos-lead">
          {cosmos.count} photographs. One captain.
          <br />
          {mode === "webgl" ? "Scroll to fly through them." : "Every tile is one of his photographs."}
        </p>

        <figure className="cosmos-sign" aria-label="MS Dhoni's signature, shown as a fan tribute">
          <img src="/images/dhoni-signature.webp" alt="" width={592} height={800} />
          <figcaption>Fan tribute · not affiliated with or endorsed by MS Dhoni</figcaption>
        </figure>

        <div className={`cosmos-now ${t ? "is-on" : ""}`} aria-live="polite">
          {t && (
            <>
              <span className="cosmos-num">{pad3(lane + 1)}</span>
              <span className="cosmos-cap">{t.caption}</span>
            </>
          )}
        </div>
        <p className="cosmos-count" aria-hidden="true">
          {t ? `${lane + 1} of ${LANE_N} moments` : "Scroll ↓"}
        </p>
      </div>
    </section>
  );
}

function smooth(e0: number, e1: number, x: number) {
  const t = Math.min(1, Math.max(0, (x - e0) / (e1 - e0)));
  return t * t * (3 - 2 * t);
}

function mulberry(seed: number) {
  let a = seed;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t >>> 0) / 4294967296);
  };
}
