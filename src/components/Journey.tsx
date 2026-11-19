"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { journey, type JourneyChapter } from "@/data/journey";
import { imageById } from "@/data/gallery";
import { getGsap, lockScroll, prefersReducedMotion, refreshTriggers, scrollToY } from "@/lib/motion";
import { cssVar, onTheme } from "@/lib/theme";
import { playMoment, type MomentSound } from "@/lib/crowdSound";

/**
 * The Journey — a scroll-driven career timeline set in a pale 3D exhibition space (inspired by
 * product-showroom sites): the camera glides down a grid floor, each chapter's photo panel rises
 * from the floor as you approach, and the chapter text sits on the left. The year rail jumps
 * between chapters. Every chapter has a photo, stats, a fan note
 * and a "play the moment" film: letterboxed motion over the photo with three captions and
 * synthesized stadium sound (or a real video, if one is supplied in the data).
 * Reduced motion / no WebGL: chapters are laid out one after another.
 */

const N = journey.length;
const pad = (n: number) => String(n).padStart(2, "0");
const BEAT = 2.6;

export default function Journey() {
  const root = useRef<HTMLElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const stRef = useRef<{ start: number; end: number } | null>(null);
  const progRef = useRef(0); // continuous chapter position, -0.3 … N-0.7
  const [mode, setMode] = useState<"pending" | "space" | "static">("pending");
  const [index, setIndex] = useState(0);
  const [film, setFilm] = useState<number | null>(null);

  useEffect(() => {
    const gl = (() => {
      try {
        return !!document.createElement("canvas").getContext("webgl2");
      } catch {
        return false;
      }
    })();
    setMode(gl && !prefersReducedMotion() ? "space" : "static");
  }, []);

  // scroll → chapter position
  useEffect(() => {
    if (mode !== "space" || !root.current) return;
    const { ScrollTrigger } = getGsap();
    let last = -1;
    const st = ScrollTrigger.create({
      trigger: root.current,
      start: "top top",
      end: `+=${N * 80}%`,
      pin: true,
      anticipatePin: 1,
      onRefresh: (self) => (stRef.current = { start: self.start, end: self.end }),
      onUpdate: (self) => {
        stRef.current = { start: self.start, end: self.end };
        const p = -0.3 + self.progress * (N - 0.4);
        progRef.current = p;
        const i = Math.max(0, Math.min(N - 1, Math.round(p)));
        if (i !== last) {
          last = i;
          setIndex(i);
        }
      },
    });
    requestAnimationFrame(refreshTriggers);
    return () => st.kill();
  }, [mode]);

  // the 3D space
  useEffect(() => {
    if (mode !== "space" || !root.current || !canvasRef.current) return;
    let disposed = false;
    let cleanup = () => {};
    (async () => {
      const THREE = await import("three");
      const { RoundedBoxGeometry } = await import("three/examples/jsm/geometries/RoundedBoxGeometry.js");
      if (disposed) return;
      cleanup = buildSpace(THREE, RoundedBoxGeometry, root.current!, canvasRef.current!, progRef);
    })();
    return () => {
      disposed = true;
      cleanup();
    };
  }, [mode]);

  const goTo = (i: number) => {
    const st = stRef.current;
    if (!st) return;
    scrollToY(st.start + ((st.end - st.start) * (i + 0.3)) / (N - 0.4));
  };

  if (mode === "static") {
    return (
      <section id="journey" className="journey is-static" aria-labelledby="jr-h">
        <header className="jr-static-head">
          <p className="eyebrow2">The journey</p>
          <h2 id="jr-h">Eight chapters of a career</h2>
        </header>
        {journey.map((c, i) => (
          <Chapter key={c.id} c={c} i={i} active onPlay={() => setFilm(i)} />
        ))}
        {film !== null && <Film c={journey[film]} onClose={() => setFilm(null)} />}
      </section>
    );
  }

  const c = journey[index];

  return (
    <section ref={root} id="journey" className="journey jsp" aria-labelledby="jr-h">
      <canvas ref={canvasRef} className="jsp-canvas" aria-hidden="true" />
      <div className="jsp-fade" aria-hidden="true" />

      <header className="jsp-head">
        <span className="jsp-chip is-dark">Timeline</span>
        <h2 id="jr-h">
          The Journey <i>2004 — 2026</i>
        </h2>
      </header>

      <article key={c.id} className="jsp-text" aria-labelledby={`jsp-${c.id}`} aria-live="polite">
        <p className="jsp-chips">
          <span className="jsp-chip is-dark">
            Chapter {pad(index + 1)} / {pad(N)}
          </span>
          <span className="jsp-chip is-blue">{c.year}</span>
          <span className="jsp-chip">{c.moment}</span>
        </p>
        <h3 id={`jsp-${c.id}`} className="jsp-title">
          {c.experience}
        </h3>
        <p className="jsp-story">{c.story}</p>
        <ul className="jsp-stats">
          {c.stats.map((s) => (
            <li key={s.label}>
              <b>{s.value}</b>
              <span>{s.label}</span>
            </li>
          ))}
        </ul>
        <p className="jsp-note">
          “{c.fanNote}” <small>— fan note from the makers of this tribute</small>
        </p>
        <button type="button" className="jsp-play" onClick={() => setFilm(index)}>
          <span aria-hidden="true">▶</span> Play the moment <small>with sound</small>
        </button>
      </article>

      <nav className="jsp-rail" aria-label="Chapters">
        <ol>
          {journey.map((ch, i) => (
            <li key={ch.id} className={i === index ? "is-on" : i < index ? "is-past" : ""}>
              <button type="button" onClick={() => goTo(i)} aria-current={i === index ? "step" : undefined} aria-label={`Chapter ${i + 1}: ${ch.year}, ${ch.moment}`}>
                <span className="jsp-dot" aria-hidden="true" />
                <span className="jsp-ry">{ch.year}</span>
              </button>
            </li>
          ))}
        </ol>
      </nav>

      {film !== null && <Film c={journey[film]} onClose={() => setFilm(null)} />}
    </section>
  );
}

type Three = typeof import("three");
type RBG = typeof import("three/examples/jsm/geometries/RoundedBoxGeometry.js").RoundedBoxGeometry;

const SPACING = 16;
const BG = 0xeceef6;
const smooth = (e0: number, e1: number, x: number) => {
  const t = Math.max(0, Math.min(1, (x - e0) / (e1 - e0)));
  return t * t * (3 - 2 * t);
};

/**
 * A pale exhibition space in the style of a product showroom: a grid floor with "+" marks,
 * floating glossy tiles, and one photo panel per chapter. Each panel lies flat on the floor and
 * stands up as you approach (hinged at its base, with a soft shadow), then folds away as you pass.
 */
function buildSpace(THREE: Three, RoundedBoxGeometry: RBG, section: HTMLElement, canvas: HTMLCanvasElement, progRef: { current: number }) {
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, powerPreference: "high-performance" });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.setClearColor(BG, 1);
  const scene = new THREE.Scene();
  scene.fog = new THREE.Fog(BG, 12, 46);
  const camera = new THREE.PerspectiveCamera(40, 1, 0.1, 120);
  scene.add(new THREE.HemisphereLight(0xffffff, 0xd8dcea, 1.25));
  const sun = new THREE.DirectionalLight(0xffffff, 1.6);
  sun.position.set(-4, 9, 6);
  scene.add(sun);

  const disposables: { dispose: () => void }[] = [];
  const track = <T extends { dispose: () => void }>(o: T) => (disposables.push(o), o);
  const aniso = Math.min(8, renderer.capabilities.getMaxAnisotropy());

  // ---------- floor: fine grid + "+" marks ----------
  const tile = document.createElement("canvas");
  tile.width = tile.height = 512;
  {
    const g = tile.getContext("2d")!;
    g.fillStyle = "#ffffff";
    g.fillRect(0, 0, 512, 512);
    g.strokeStyle = "rgba(120,130,170,0.16)";
    g.lineWidth = 2;
    for (let k = 0; k <= 4; k++) {
      g.beginPath();
      g.moveTo(k * 128, 0);
      g.lineTo(k * 128, 512);
      g.moveTo(0, k * 128);
      g.lineTo(512, k * 128);
      g.stroke();
    }
    g.strokeStyle = "rgba(40,48,80,0.55)";
    g.lineWidth = 5;
    g.beginPath();
    g.moveTo(256 - 26, 256);
    g.lineTo(256 + 26, 256);
    g.moveTo(256, 256 - 26);
    g.lineTo(256, 256 + 26);
    g.stroke();
  }
  const floorTex = track(new THREE.CanvasTexture(tile));
  floorTex.colorSpace = THREE.SRGBColorSpace;
  floorTex.wrapS = floorTex.wrapT = THREE.RepeatWrapping;
  floorTex.anisotropy = aniso;
  const FLOOR_L = N * SPACING + 120;
  floorTex.repeat.set(160 / 4, FLOOR_L / 4);
  const floorMat = track(new THREE.MeshBasicMaterial({ map: floorTex }));
  const floor = new THREE.Mesh(track(new THREE.PlaneGeometry(160, FLOOR_L)), floorMat);
  floor.rotation.x = -Math.PI / 2;
  floor.position.z = -FLOOR_L / 2 + 40;
  scene.add(floor);

  // soft shadow texture
  const sh = document.createElement("canvas");
  sh.width = sh.height = 128;
  {
    const g = sh.getContext("2d")!;
    const r = g.createRadialGradient(64, 64, 0, 64, 64, 64);
    r.addColorStop(0, "rgba(30,36,70,0.9)");
    r.addColorStop(1, "rgba(30,36,70,0)");
    g.fillStyle = r;
    g.fillRect(0, 0, 128, 128);
  }
  const shadowTex = track(new THREE.CanvasTexture(sh));

  // ---------- chapter panels ----------
  const loader = new THREE.TextureLoader();
  type Panel = { pivot: import("three").Group; hinge: import("three").Group; mats: import("three").MeshBasicMaterial[]; shadow: import("three").MeshBasicMaterial; year: import("three").MeshBasicMaterial; i: number };
  const panels: Panel[] = [];
  journey.forEach((ch, i) => {
    const im = imageById(ch.imageId);
    const aspect = im ? im.width / im.height : 0.75;
    const H = aspect > 1.2 ? 3.1 : 3.9;
    const W = Math.min(5.6, H * aspect);
    const pivot = new THREE.Group();
    const hinge = new THREE.Group();
    pivot.add(hinge);
    const LIFT = 0.3;
    const frameMat = track(new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true }));
    const frame = new THREE.Mesh(track(new THREE.PlaneGeometry(W + 0.2, H + 0.2)), frameMat);
    frame.position.y = LIFT + H / 2;
    const photoMat = track(new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true }));
    const photo = new THREE.Mesh(track(new THREE.PlaneGeometry(W, H)), photoMat);
    photo.position.set(0, LIFT + H / 2, 0.01);
    // thin edge so the panel reads as a slab when it lies down
    const edgeMat = track(new THREE.MeshBasicMaterial({ color: 0xc9cede, transparent: true }));
    const edge = new THREE.Mesh(track(new THREE.PlaneGeometry(W + 0.2, H + 0.2)), edgeMat);
    edge.position.set(0, LIFT + H / 2, -0.04);
    edge.rotation.y = Math.PI;
    hinge.add(frame, photo, edge);
    if (im) {
      loader.load(im.src, (tx) => {
        tx.colorSpace = THREE.SRGBColorSpace;
        tx.anisotropy = aniso;
        track(tx);
        photoMat.map = tx;
        photoMat.needsUpdate = true;
      });
    }
    const shadowMat = track(new THREE.MeshBasicMaterial({ map: shadowTex, transparent: true, depthWrite: false, opacity: 0 }));
    const shadow = new THREE.Mesh(track(new THREE.PlaneGeometry(W * 1.5, 1.6)), shadowMat);
    shadow.rotation.x = -Math.PI / 2;
    shadow.position.set(0, 0.01, 0.15);
    pivot.add(shadow);

    // the year, painted on the floor in front of the panel
    const yc = document.createElement("canvas");
    yc.width = 1024;
    yc.height = 256;
    const g = yc.getContext("2d")!;
    g.fillStyle = "rgba(28,34,64,0.9)";
    g.font = "800 210px Inter, 'Helvetica Neue', Arial, sans-serif";
    g.textAlign = "center";
    g.textBaseline = "middle";
    g.fillText(ch.year, 512, 136);
    const yTex = track(new THREE.CanvasTexture(yc));
    yTex.colorSpace = THREE.SRGBColorSpace;
    yTex.anisotropy = aniso;
    const yearMat = track(new THREE.MeshBasicMaterial({ map: yTex, transparent: true, depthWrite: false, opacity: 0 }));
    const year = new THREE.Mesh(track(new THREE.PlaneGeometry(4.4, 1.1)), yearMat);
    year.rotation.x = -Math.PI / 2;
    year.position.set(0, 0.02, 2.3);
    pivot.add(year);

    pivot.position.set(0, 0, -i * SPACING);
    scene.add(pivot);
    panels.push({ pivot, hinge, mats: [frameMat, photoMat, edgeMat], shadow: shadowMat, year: yearMat, i });
  });

  // ---------- floating glossy tiles ----------
  const glyphs = ["7", "★", "C", "MSD", "WC", "🏏"];
  const glyphTex = glyphs.map((s) => {
    const c = document.createElement("canvas");
    c.width = c.height = 128;
    const g = c.getContext("2d")!;
    g.fillStyle = "#fff";
    g.font = `800 ${s.length > 2 ? 40 : 64}px Inter, Arial, sans-serif`;
    g.textAlign = "center";
    g.textBaseline = "middle";
    g.fillText(s, 64, 68);
    const tx = track(new THREE.CanvasTexture(c));
    tx.colorSpace = THREE.SRGBColorSpace;
    return tx;
  });
  const boxGeo = track(new RoundedBoxGeometry(0.62, 0.62, 0.16, 4, 0.08));
  const faceGeo = track(new THREE.PlaneGeometry(0.46, 0.46));
  const tileMats = [
    track(new THREE.MeshStandardMaterial({ color: 0x3d6cff, roughness: 0.25, metalness: 0.05, emissive: 0x1a3aa8, emissiveIntensity: 0.35 })),
    track(new THREE.MeshStandardMaterial({ color: 0x7aa2ff, roughness: 0.2, metalness: 0.05, emissive: 0x2b4fd0, emissiveIntensity: 0.25 })),
    track(new THREE.MeshStandardMaterial({ color: 0xf2c230, roughness: 0.3, metalness: 0.1, emissive: 0x7a5a00, emissiveIntensity: 0.25 })),
  ];
  const faceMats = glyphTex.map((tx) => track(new THREE.MeshBasicMaterial({ map: tx, transparent: true })));
  let seed = 7;
  const rnd = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
  type Bit = { o: import("three").Group; base: import("three").Vector3; spin: import("three").Vector3; ph: number };
  const bits: Bit[] = [];
  const COUNT = N * 6;
  for (let k = 0; k < COUNT; k++) {
    const o = new THREE.Group();
    const m = new THREE.Mesh(boxGeo, tileMats[k % 3]);
    const f = new THREE.Mesh(faceGeo, faceMats[k % faceMats.length]);
    f.position.z = 0.085;
    o.add(m, f);
    const side = rnd() < 0.5 ? -1 : 1;
    const x = side * (3.5 + rnd() * 9);
    const base = new THREE.Vector3(x, 0.4 + rnd() * 4.2, 6 - rnd() * (N * SPACING + 6));
    o.position.copy(base);
    o.rotation.set(rnd() * 6, rnd() * 6, rnd() * 6);
    const s = 0.6 + rnd() * 0.9;
    o.scale.setScalar(s);
    scene.add(o);
    bits.push({ o, base, spin: new THREE.Vector3((rnd() - 0.5) * 0.5, (rnd() - 0.5) * 0.6, (rnd() - 0.5) * 0.3), ph: rnd() * 6.28 });
  }

  // ---------- layout / loop ----------
  let mobile = false;
  const resize = () => {
    const w = section.clientWidth;
    const h = section.clientHeight;
    mobile = w < 860;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    camera.fov = mobile ? 52 : 38;
    camera.updateProjectionMatrix();
    panels.forEach((p) => {
      p.pivot.position.x = mobile ? 0 : 2.9;
      p.pivot.rotation.y = mobile ? 0 : -0.3;
      p.pivot.scale.setScalar(mobile ? 0.82 : 1);
    });
  };
  resize();
  const ro = new ResizeObserver(resize);
  ro.observe(section);

  const mouse = { x: 0, y: 0, sx: 0, sy: 0 };
  const onMove = (e: PointerEvent) => {
    mouse.x = (e.clientX / window.innerWidth) * 2 - 1;
    mouse.y = (e.clientY / window.innerHeight) * 2 - 1;
  };
  window.addEventListener("pointermove", onMove, { passive: true });

  let visible = false;
  const io = new IntersectionObserver(([e]) => (visible = e.isIntersecting), { rootMargin: "200px" });
  io.observe(section);

  const clock = new THREE.Clock();
  let smoothP = progRef.current;
  let raf = 0;
  const look = new THREE.Vector3();
  const tick = () => {
    raf = requestAnimationFrame(tick);
    if (!visible) return;
    const dt = Math.min(0.05, clock.getDelta());
    const t = clock.elapsedTime;
    smoothP += (progRef.current - smoothP) * Math.min(1, dt * 6);
    mouse.sx += (mouse.x - mouse.sx) * Math.min(1, dt * 3);
    mouse.sy += (mouse.y - mouse.sy) * Math.min(1, dt * 3);

    // the camera dwells at each chapter and glides between them
    const n = Math.floor(smoothP);
    const q = n + smooth(0.3, 0.95, smoothP - n);
    const camZ = -q * SPACING + (mobile ? 9.6 : 9.2);
    camera.position.set((mobile ? 0 : 0.6) + mouse.sx * 0.5, (mobile ? 2.3 : 2.5) - mouse.sy * 0.2, camZ);
    look.set(mobile ? 0 : 1.2, mobile ? 1.15 : 1.75, camZ - 10);
    camera.lookAt(look);

    for (const p of panels) {
      const f = q - p.i;
      const uIn = smooth(-0.85, -0.2, f);
      const uOut = 1 - smooth(0.06, 0.4, f);
      const u = Math.min(uIn, uOut);
      p.hinge.rotation.x = -(1 - u) * (Math.PI / 2) * 0.98;
      p.hinge.position.y = Math.sin(t * 0.9 + p.i) * 0.05 * u;
      const op = 0.15 + 0.85 * smooth(0, 0.45, u);
      const fade = f > 0 ? smooth(0.2, 0.9, uOut) : 1;
      p.mats.forEach((m) => (m.opacity = op * fade));
      p.shadow.opacity = 0.22 * u;
      p.year.opacity = 0.75 * smooth(-0.6, -0.1, f) * (1 - smooth(0.05, 0.3, f));
      p.pivot.visible = f > -2.2 && f < 0.5;
    }
    for (const b of bits) {
      b.o.rotation.x += b.spin.x * dt;
      b.o.rotation.y += b.spin.y * dt;
      b.o.rotation.z += b.spin.z * dt;
      b.o.position.y = b.base.y + Math.sin(t * 0.7 + b.ph) * 0.18;
    }
    renderer.render(scene, camera);
  };
  tick();

  const offTheme = onTheme(() => {
    const c = new THREE.Color(cssVar("--space", "#eceef6"));
    renderer.setClearColor(c, 1);
    scene.fog!.color.copy(c);
    floorMat.color.copy(c);
    const a = new THREE.Color(cssVar("--accent2", "#2f5bff"));
    tileMats[0].color.copy(a);
    tileMats[0].emissive.copy(a).multiplyScalar(0.45);
    const g2 = new THREE.Color(cssVar("--gold", "#d9b56d"));
    tileMats[2].color.copy(g2);
  });

  return () => {
    offTheme();
    cancelAnimationFrame(raf);
    ro.disconnect();
    io.disconnect();
    window.removeEventListener("pointermove", onMove);
    disposables.forEach((d) => d.dispose());
    renderer.dispose();
  };
}

function Chapter({ c, i, active, onPlay, bgSrc }: { c: JourneyChapter; i: number; active: boolean; onPlay: () => void; bgSrc?: string }) {
  const im = imageById(c.imageId);
  return (
    <article className={`jr-ch ${active ? "is-active" : ""}`} aria-labelledby={`jr-${c.id}`}>
      <div className="jr-text">
        <p className="jr-kicker">
          Chapter {pad(i + 1)} <i>/ {pad(N)}</i> · {c.year}
        </p>
        <p className="jr-moment">{c.moment}</p>
        <h3 id={`jr-${c.id}`} className="jr-exp">
          {c.experience}
        </h3>
        <p className="jr-story">{c.story}</p>
        <ul className="jr-stats">
          {c.stats.map((s) => (
            <li key={s.label}>
              <b>{s.value}</b>
              <span>{s.label}</span>
            </li>
          ))}
        </ul>
        <blockquote className="jr-note">
          <p>&ldquo;{c.fanNote}&rdquo;</p>
          <footer>Fan note · from the makers of this tribute</footer>
        </blockquote>
        <button type="button" className="jr-play" onClick={onPlay}>
          <span aria-hidden="true">▶</span> Play the moment <small>with sound</small>
        </button>
      </div>
      {im && (
        <figure className="jr-photo">
          <div className="jr-frame">
            <img src={bgSrc ?? im.src} alt={im.alt} width={im.width} height={im.height} style={{ objectPosition: im.objectPosition }} />
          </div>
          <figcaption>{im.caption}</figcaption>
        </figure>
      )}
    </article>
  );
}

/** Full-screen "moment": letterbox, slow push-in, three caption beats, synthesized crowd. */
function Film({ c, onClose }: { c: JourneyChapter; onClose: () => void }) {
  const im = imageById(c.imageId);
  const [beat, setBeat] = useState(0);
  const [muted, setMuted] = useState(false);
  const sound = useRef<MomentSound | null>(null);
  const closeBtn = useRef<HTMLButtonElement>(null);

  const stopSound = useCallback(() => {
    sound.current?.stop();
    sound.current = null;
  }, []);

  useEffect(() => {
    closeBtn.current?.focus();
    lockScroll(true);
    if (!muted && !c.video) sound.current = playMoment({ swell: c.sound.swell, crack: c.sound.crack, beatSec: BEAT });
    const t1 = window.setTimeout(() => setBeat(1), BEAT * 1000);
    const t2 = window.setTimeout(() => setBeat(2), BEAT * 2000);
    const t3 = window.setTimeout(() => setBeat(3), BEAT * 3000 + 1600);
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => {
      [t1, t2, t3].forEach(window.clearTimeout);
      window.removeEventListener("keydown", onKey);
      stopSound();
      lockScroll(false);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const toggleMute = () => {
    if (!muted) stopSound();
    setMuted((m) => !m);
  };

  return (
    <div className={`jr-film ${c.sound.crack && beat >= 2 ? "is-hit" : ""}`} role="dialog" aria-modal="true" aria-label={`${c.year}: ${c.moment}`} data-lenis-prevent>
      {c.video ? (
        <video src={c.video} autoPlay playsInline controls className="jr-film-video" />
      ) : (
        im && <img src={im.src} alt={im.alt} className="jr-film-img" style={{ objectPosition: im.objectPosition, animationDuration: `${BEAT * 3 + 2}s` }} />
      )}
      <div className="jr-film-shade" aria-hidden="true" />
      <p className="jr-film-year" aria-hidden="true">
        {c.year}
      </p>
      <div className="jr-film-caps" aria-live="polite">
        {c.beats.map((b, i) => (
          <p key={i} className={i === beat ? "is-on" : i < beat ? "is-past" : ""}>
            {b}
          </p>
        ))}
        {beat >= 3 && <p className="jr-film-end is-on">{c.experience}</p>}
      </div>
      <div className="jr-film-ctrl">
        {!c.video && (
          <button type="button" onClick={toggleMute} aria-pressed={muted}>
            {muted ? "🔇 Sound off" : "🔊 Sound on"}
          </button>
        )}
        <button type="button" ref={closeBtn} onClick={onClose}>
          Back to the journey ✕
        </button>
      </div>
      {!c.video && <p className="jr-film-note">Motion film from the photo · synthesized stadium sound</p>}
    </div>
  );
}
