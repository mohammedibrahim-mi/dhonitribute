"use client";

import { useEffect, useRef, useState } from "react";
import { trophies } from "@/data/trophies";
import { cssVar, onTheme } from "@/lib/theme";
import { getGsap, prefersReducedMotion, refreshTriggers, scrollToY } from "@/lib/motion";

/**
 * Trophy gallery — a curved, gallery-like corridor in Three.js. The trophy photos hang on
 * off-white walls under soft white spotlight halos; scrolling walks you round the curve.
 * "You are walking past…" names the photo ahead, arrows step between photos, clicking a photo
 * opens it up close, and a skip button jumps past the whole walk.
 * Reduced motion / no WebGL: a simple grid.
 */

const pad = (n: number) => String(n).padStart(2, "0");
const N = trophies.length;
// ring corridor geometry
const R_IN = 10;
const R_OUT = 14;
const R_CAM = 11.6;
const WALL_H = 5;
const EYE = 1.6;
const STEP = 0.16; // radians between consecutive photos (they alternate outer / inner wall)
const THETA0 = 0.45; // first photo angle (walking clockwise = decreasing angle)
const LOOKAHEAD = 0.34; // radians ahead of the camera that counts as "walking past"

export default function TrophyGallery() {
  const root = useRef<HTMLElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
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
      end: `+=${N * 50}%`,
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
  const [current, setCurrent] = useState(0);
  const [open, setOpen] = useState<number | null>(null);

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
      try {
        await document.fonts?.ready;
      } catch {}
      const section = root.current!;
      const canvas = canvasRef.current!;

      const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, powerPreference: "high-performance" });
      renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
      renderer.outputColorSpace = THREE.SRGBColorSpace;
      renderer.toneMapping = THREE.ACESFilmicToneMapping;
      renderer.toneMappingExposure = 1.15;
      const SKY = 0x151824;
      renderer.setClearColor(SKY, 1);

      const scene = new THREE.Scene();
      scene.fog = new THREE.Fog(SKY, 11, 30);
      const camera = new THREE.PerspectiveCamera(58, 1, 0.1, 80);

      scene.add(new THREE.HemisphereLight(0xfff8ee, 0x202026, 0.75));
      const lamp = new THREE.PointLight(0xfff6ea, 14, 14, 1.7); // follows the camera: soft falloff along the walls
      scene.add(lamp);

      // ---------- corridor ----------
      const wallMat = new THREE.MeshStandardMaterial({ color: 0xc9c4bb, roughness: 0.95 });
      const outer = new THREE.Mesh(new THREE.CylinderGeometry(R_OUT, R_OUT, WALL_H, 220, 1, true), wallMat);
      outer.material = wallMat.clone();
      (outer.material as import("three").MeshStandardMaterial).side = THREE.BackSide;
      outer.position.y = WALL_H / 2;
      scene.add(outer);
      const inner = new THREE.Mesh(new THREE.CylinderGeometry(R_IN, R_IN, WALL_H, 200, 1, true), wallMat);
      inner.position.y = WALL_H / 2;
      scene.add(inner);
      const floor = new THREE.Mesh(
        new THREE.RingGeometry(R_IN, R_OUT, 220, 1),
        new THREE.MeshStandardMaterial({ color: 0x19191d, roughness: 0.5, metalness: 0.2 })
      );
      floor.rotation.x = -Math.PI / 2;
      scene.add(floor);

      // soft radial texture (halos + floor pools)
      const glowTex = (() => {
        const c = document.createElement("canvas");
        c.width = c.height = 256;
        const g = c.getContext("2d")!;
        const grd = g.createRadialGradient(128, 128, 0, 128, 128, 128);
        grd.addColorStop(0, "rgba(255,255,255,1)");
        grd.addColorStop(0.3, "rgba(255,255,255,0.62)");
        grd.addColorStop(0.62, "rgba(255,255,255,0.14)");
        grd.addColorStop(1, "rgba(255,255,255,0)");
        g.fillStyle = grd;
        g.fillRect(0, 0, 256, 256);
        const t = new THREE.CanvasTexture(c);
        t.colorSpace = THREE.SRGBColorSpace;
        return t;
      })();

      // caption card texture
      const cardTex = (title: string, sub: string, n: number) => {
        const c = document.createElement("canvas");
        c.width = 512;
        c.height = 300;
        const g = c.getContext("2d")!;
        g.fillStyle = "#fbfaf7";
        g.fillRect(0, 0, 512, 300);
        g.fillStyle = "#9a958c";
        g.font = "600 22px 'Inter', system-ui, sans-serif";
        g.fillText(`No. ${pad(n)}`, 34, 52);
        g.fillStyle = "#161616";
        g.font = "800 40px 'Inter Tight', 'Inter', system-ui, sans-serif";
        const words = title.split(" ");
        let line = "";
        let y = 112;
        for (const w of words) {
          const test = line ? `${line} ${w}` : w;
          if (g.measureText(test).width > 440 && line) {
            g.fillText(line, 34, y);
            line = w;
            y += 48;
            if (y > 210) break;
          } else line = test;
        }
        if (y <= 210) g.fillText(line, 34, y);
        g.fillStyle = "#6b675f";
        g.font = "500 22px 'Inter', system-ui, sans-serif";
        g.fillText(sub.toUpperCase(), 34, 268);
        const t = new THREE.CanvasTexture(c);
        t.colorSpace = THREE.SRGBColorSpace;
        t.anisotropy = 4;
        return t;
      };

      // ---------- photos on the walls ----------
      const loader = new THREE.TextureLoader();
      const items: {
        mesh: import("three").Mesh;
        theta: number;
        photoMat: import("three").MeshBasicMaterial;
        loaded: boolean;
        src: string;
      }[] = [];
      const disposables: { dispose: () => void }[] = [glowTex, wallMat, outer.material as import("three").Material];
      const placeOnWall = (obj: import("three").Object3D, theta: number, r: number, y: number, facingIn: boolean) => {
        obj.position.set(r * Math.cos(theta), y, r * Math.sin(theta));
        // face the corridor: the outer wall faces the centre, the inner wall faces outward
        const look = facingIn ? new THREE.Vector3(0, y, 0) : new THREE.Vector3(obj.position.x * 2, y, obj.position.z * 2);
        obj.lookAt(look);
      };
      trophies.forEach((t, i) => {
        const onOuter = i % 2 === 0;
        const theta = THETA0 - i * STEP;
        const r = onOuter ? R_OUT - 0.02 : R_IN + 0.02;
        const maxH = 1.75;
        const maxW = 2.3;
        let h = maxH;
        let w = (h * t.width) / t.height;
        if (w > maxW) {
          w = maxW;
          h = (w * t.height) / t.width;
        }
        const group = new THREE.Group();
        // halo (spotlight on the wall)
        const halo = new THREE.Mesh(
          new THREE.PlaneGeometry(w * 1.45 + 1.3, h * 1.6 + 2.2),
          new THREE.MeshBasicMaterial({ map: glowTex, transparent: true, opacity: 0.85, depthWrite: false, blending: THREE.AdditiveBlending })
        );
        halo.position.set(0, 0.45, 0.005);
        group.add(halo);
        // mat + shadow
        const shadow = new THREE.Mesh(
          new THREE.PlaneGeometry(w + 0.22, h + 0.22),
          new THREE.MeshBasicMaterial({ color: 0x000000, transparent: true, opacity: 0.18, depthWrite: false })
        );
        shadow.position.set(0.05, -0.06, 0.008);
        group.add(shadow);
        const mat = new THREE.Mesh(new THREE.PlaneGeometry(w + 0.16, h + 0.16), new THREE.MeshBasicMaterial({ color: 0xfdfcf8 }));
        mat.position.z = 0.012;
        group.add(mat);
        const photoMat = new THREE.MeshBasicMaterial({ color: 0x2b2b2b });
        const photo = new THREE.Mesh(new THREE.PlaneGeometry(w, h), photoMat);
        photo.position.z = 0.016;
        photo.userData.index = i;
        group.add(photo);
        // caption card, bottom-left of the photo
        const card = new THREE.Mesh(
          new THREE.PlaneGeometry(0.62, 0.36),
          new THREE.MeshBasicMaterial({ map: cardTex(t.caption.replace(/\.$/, ""), t.category, i + 1) })
        );
        card.position.set(-w / 2 + 0.31, -h / 2 - 0.36, 0.014);
        group.add(card);
        placeOnWall(group, theta, r, 1.85, onOuter);
        scene.add(group);
        // pool of light on the floor below
        const pool = new THREE.Mesh(
          new THREE.PlaneGeometry(2.6, 1.5),
          new THREE.MeshBasicMaterial({ map: glowTex, transparent: true, opacity: 0.16, depthWrite: false, blending: THREE.AdditiveBlending })
        );
        pool.rotation.x = -Math.PI / 2;
        const pr = onOuter ? R_OUT - 0.9 : R_IN + 0.9;
        pool.position.set(pr * Math.cos(theta), 0.01, pr * Math.sin(theta));
        pool.rotation.z = -theta;
        scene.add(pool);
        items.push({ mesh: photo, theta, photoMat, loaded: false, src: t.thumb });
      });


      // ---------- camera path ----------
      const START = THETA0 + STEP * 2.6; // begin a little before the title panel
      const END = THETA0 - (N - 1) * STEP + LOOKAHEAD * 0.75;
      const camAt = (p: number) => START + (END - START) * p;
      const resize = () => {
        const W = section.clientWidth;
        const H = window.innerHeight;
        renderer.setSize(W, H, false);
        camera.aspect = W / H;
        camera.fov = camera.aspect < 0.8 ? 80 : camera.aspect < 1.2 ? 70 : 60;
        camera.updateProjectionMatrix();
      };
      resize();
      window.addEventListener("resize", resize);

      // ---------- scroll ----------
      const { ScrollTrigger } = getGsap();
      let target = 0;
      let cur = 0;
      // the walk finishes a little before the pin ends, so the gallery never slides away mid-walk
      const walk = (p: number) => Math.min(1, p / 0.9);
      target = walk(progRef.current);
      onProgRef.current = (p) => (target = walk(p));
      const pointer = { x: 0, y: 0, tx: 0, ty: 0 };
      const onMove = (e: PointerEvent) => {
        if (e.pointerType !== "mouse") return;
        pointer.tx = (e.clientX / window.innerWidth - 0.5) * 2;
        pointer.ty = (e.clientY / window.innerHeight - 0.5) * 2;
      };
      window.addEventListener("pointermove", onMove);

      // click a photo to look closer
      const ray = new THREE.Raycaster();
      const ndc = new THREE.Vector2();
      const photos = items.map((it) => it.mesh);
      const onClick = (e: MouseEvent) => {
        const rect = canvas.getBoundingClientRect();
        ndc.set(((e.clientX - rect.left) / rect.width) * 2 - 1, -((e.clientY - rect.top) / rect.height) * 2 + 1);
        ray.setFromCamera(ndc, camera);
        const hit = ray.intersectObjects(photos, false)[0];
        if (hit && hit.distance < 9) setOpen(hit.object.userData.index as number);
      };
      canvas.addEventListener("click", onClick);
      const onHover = (e: PointerEvent) => {
        if (e.pointerType !== "mouse") return;
        const rect = canvas.getBoundingClientRect();
        ndc.set(((e.clientX - rect.left) / rect.width) * 2 - 1, -((e.clientY - rect.top) / rect.height) * 2 + 1);
        ray.setFromCamera(ndc, camera);
        const hit = ray.intersectObjects(photos, false)[0];
        canvas.style.cursor = hit && hit.distance < 9 ? "zoom-in" : "";
      };
      canvas.addEventListener("pointermove", onHover);

      let visible = true;
      const io = new IntersectionObserver(([e]) => (visible = e.isIntersecting), { rootMargin: "200px" });
      io.observe(section);

      let last = -1;
      let raf = 0;
      const clock = new THREE.Clock();
      const tmp = new THREE.Vector3();
      const tick = () => {
        raf = requestAnimationFrame(tick);
        if (!visible) return;
        const dt = Math.min(0.1, clock.getDelta());
        cur += (target - cur) * (1 - Math.exp(-dt * 7));
        pointer.x += (pointer.tx - pointer.x) * 0.05;
        pointer.y += (pointer.ty - pointer.y) * 0.05;
        const th = camAt(cur);
        const bob = Math.sin(cur * 120) * 0.02; // a gentle walking bob
        camera.position.set(R_CAM * Math.cos(th), EYE + bob, R_CAM * Math.sin(th));
        // look ahead along the curve (clockwise), drifting towards the outer wall
        // aim down the middle of the corridor (slightly towards the inner wall) so both walls stay in view
        const ahead = th - 0.3 + pointer.x * 0.05;
        const rl = R_CAM - 0.35;
        tmp.set(rl * Math.cos(ahead), EYE - 0.05 - pointer.y * 0.25, rl * Math.sin(ahead));
        camera.lookAt(tmp);
        lamp.position.copy(camera.position).add(new THREE.Vector3(0, 1.2, 0));

        // load textures as photos come near
        items.forEach((it) => {
          if (!it.loaded && (Math.abs(it.theta - th) < 1.2 || clock.elapsedTime > 1.5)) {
            it.loaded = true;
            loader.load(it.src, (tx) => {
              tx.colorSpace = THREE.SRGBColorSpace;
              tx.anisotropy = 4;
              it.photoMat.map = tx;
              it.photoMat.color.set(0xffffff);
              it.photoMat.needsUpdate = true;
              disposables.push(tx);
            });
          }
        });
        // the photo we are "walking past"
        let best = 0;
        let bd = Infinity;
        items.forEach((it, i) => {
          const d = Math.abs(it.theta - (th - LOOKAHEAD));
          if (d < bd) {
            bd = d;
            best = i;
          }
        });
        if (best !== last) {
          last = best;
          setCurrent(best);
        }
        renderer.render(scene, camera);
      };
      tick();
      requestAnimationFrame(refreshTriggers);

      const offTheme = onTheme(() => {
        const c = new THREE.Color(cssVar("--gallery-sky", "#151824"));
        renderer.setClearColor(c, 1);
        scene.fog!.color.copy(c);
      });
      cleanup = () => {
        offTheme();
        cancelAnimationFrame(raf);
        io.disconnect();
        window.removeEventListener("resize", resize);
        window.removeEventListener("pointermove", onMove);
        canvas.removeEventListener("click", onClick);
        canvas.removeEventListener("pointermove", onHover);
        scene.traverse((o) => {
          const m = o as import("three").Mesh;
          if (m.isMesh) {
            m.geometry.dispose();
            const mm = m.material as import("three").MeshBasicMaterial;
            mm.map?.dispose();
            mm.dispose();
          }
        });
        disposables.forEach((d) => d.dispose());
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

  // step to a photo: scroll so it sits at the "walking past" point
  const goTo = (i: number) => {
    const st = stRef.current;
    if (!st) return;
    const k = Math.max(0, Math.min(N - 1, i));
    const START = THETA0 + STEP * 2.6;
    const END = THETA0 - (N - 1) * STEP + LOOKAHEAD * 0.75;
    const th = THETA0 - k * STEP + LOOKAHEAD;
    const p = Math.max(0, Math.min(1, (th - START) / (END - START)));
    scrollToY(st.start + (st.end - st.start) * p);
  };
  const skip = () => {
    const st = stRef.current;
    if (st) scrollToY(st.end + window.innerHeight);
  };

  // lightbox: Esc / arrows
  useEffect(() => {
    if (open === null) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(null);
      if (e.key === "ArrowRight") setOpen((o) => (o === null ? o : Math.min(N - 1, o + 1)));
      if (e.key === "ArrowLeft") setOpen((o) => (o === null ? o : Math.max(0, o - 1)));
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  const t = trophies[current];

  if (mode === "static") {
    return (
      <section id="trophies" className="tgallery is-static" aria-labelledby="tg-h">
        <div className="tg-static-head">
          <p className="eyebrow2">Hall of Fame</p>
          <h2 id="tg-h">A captain who turned pressure into history</h2>
        </div>
        <ul className="tg-grid">
          {trophies.map((g, i) => (
            <li key={g.id}>
              <figure>
                <img src={g.thumb} alt={g.alt} width={g.width} height={g.height} loading="lazy" />
                <figcaption>
                  <span>No. {pad(i + 1)}</span> {g.caption}
                </figcaption>
              </figure>
            </li>
          ))}
        </ul>
      </section>
    );
  }

  return (
    <section ref={root} id="trophies" className="tgallery" aria-labelledby="tg-h">
      <canvas ref={canvasRef} className="tg-canvas" aria-hidden="true" />
      <div className="tg-ui">
        <header className="tg-heading">
          <p className="tg-eyebrow2">The trophy room · {N} photographs</p>
          <h2 id="tg-h" className="tg-h2">
            Hall of <em>Fame</em>
          </h2>
        </header>
        <div className="tg-now" aria-live="polite">
          <p className="tg-kicker">You are walking past</p>
          <p key={current} className="tg-title">
            {t.caption.replace(/\.$/, "")}
          </p>
          <button type="button" className="tg-look" onClick={() => setOpen(current)}>
            Look closer →
          </button>
        </div>
        <div className="tg-side">
          <p className="tg-count">
            {pad(current + 1)} <i>/ {pad(N)}</i>
          </p>
          <div className="tg-arrows">
            <button type="button" onClick={() => goTo(current - 1)} aria-label="Previous photo" disabled={current === 0}>
              ←
            </button>
            <button type="button" onClick={() => goTo(current + 1)} aria-label="Next photo" disabled={current === N - 1}>
              →
            </button>
          </div>
          <p className="tg-help">
            Scroll to walk round
            <br />
            Click a photo to look closer
          </p>
        </div>
        <button type="button" className="cab-skip tg-skip" onClick={skip} aria-label={`Skip the Hall of Fame (${N} photos) and continue down the page`}>
          Skip Hall of Fame <span aria-hidden="true">↓</span>
        </button>
      </div>

      {open !== null && (
        <div className="tg-lightbox" role="dialog" aria-modal="true" aria-label={trophies[open].alt} onClick={() => setOpen(null)}>
          <figure onClick={(e) => e.stopPropagation()}>
            <img src={trophies[open].src} alt={trophies[open].alt} width={trophies[open].width} height={trophies[open].height} />
            <figcaption>
              <span>
                No. {pad(open + 1)} · {trophies[open].category}
              </span>
              <b>{trophies[open].caption}</b>
              <small>{trophies[open].credit}</small>
            </figcaption>
          </figure>
          <button type="button" className="tg-close" onClick={() => setOpen(null)} aria-label="Close">
            ×
          </button>
          <button type="button" className="tg-lb-prev" onClick={(e) => { e.stopPropagation(); setOpen(Math.max(0, open - 1)); }} aria-label="Previous photo" disabled={open === 0}>
            ←
          </button>
          <button type="button" className="tg-lb-next" onClick={(e) => { e.stopPropagation(); setOpen(Math.min(N - 1, open + 1)); }} aria-label="Next photo" disabled={open === N - 1}>
            →
          </button>
        </div>
      )}
    </section>
  );
}
