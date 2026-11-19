"use client";

import { useEffect, useRef, useState } from "react";
import { getGsap, prefersReducedMotion, refreshTriggers, scrollToY } from "@/lib/motion";
import { recordFormats } from "@/data/records";

const words = [
  "Captain", "Cool", "Finisher", "Thala", "Helicopter", "Stumping", "Trust", "Calm",
  "Ranchi", "Chennai", "2007", "2011", "2013", "Seven", "Mahi", "Legend",
];
const COLS = 6;
const ROWS = 9;

// Timeline layout (in timeline units)
const WALL = 2.2; // word wall + "Thala" on its own
const PANEL = 1; // each record format holds for one unit
const N = recordFormats.length;
const TOTAL = WALL + 0.4 + N * PANEL;
const PIN = "+=" + Math.round(TOTAL * 100) + "%";

/**
 * Pinned 3D wall of words with a glowing, extruded "Thala" at its centre. After the wall,
 * "Thala" rises to the top and his career records play through format by format, each as
 * a grid of square boxes. Reduced motion: everything is laid out statically.
 */
export default function WordWall() {
  const root = useRef<HTMLElement>(null);
  const stRef = useRef<{ start: number; end: number } | null>(null);
  const [animated, setAnimated] = useState(false);
  const [active, setActive] = useState(-1);

  useEffect(() => {
    if (!prefersReducedMotion()) setAnimated(true);
  }, []);

  useEffect(() => {
    if (!animated || !root.current) return;
    const { gsap } = getGsap();
    const ctx = gsap.context(() => {
      const tl = gsap.timeline({
        defaults: { ease: "none" },
        // follow the (scrub-smoothed) animation itself, so the active tab matches what is on screen
        onUpdate: () => {
          const t = tl.time();
          const idx = t < WALL + 0.2 ? -1 : Math.min(N - 1, Math.max(0, Math.floor((t - WALL - 0.25) / PANEL)));
          setActive((prev) => (prev === idx ? prev : idx));
        },
        scrollTrigger: {
          trigger: root.current,
          start: "top top",
          end: PIN,
          scrub: 1,
          pin: true,
      anticipatePin: 1,
          onUpdate: (self) => (stRef.current = { start: self.start, end: self.end }),
          onRefresh: (self) => (stRef.current = { start: self.start, end: self.end }),
        },
      });
      tl.fromTo(".ww-plane", { rotateX: 0, rotateZ: 0, z: -200, opacity: 0.4 }, { rotateX: 52, rotateZ: -18, z: 0, opacity: 1, duration: 1 }, 0)
        .to(".ww-plane", { rotateX: 70, rotateZ: -62, z: 260, duration: 1 }, 1)
        .to(".ww-plane", { rotateX: 84, rotateZ: -80, z: 520, opacity: 0.22, duration: 0.8 }, WALL)
        .fromTo(".ww-thala", { scale: 0.55, opacity: 0, rotateX: 40 }, { scale: 1, opacity: 1, rotateX: 0, duration: 0.7, ease: "power2.out" }, 0)
        .to(".ww-thala", { rotateY: -14, rotateX: 8, duration: 1.4 }, 0.7)
        // "Thala" rises and becomes the heading of the records
        .to(".ww-center", { yPercent: -36, scale: 0.42, duration: 0.6, ease: "power2.inOut" }, WALL)
        .to(".ww-thala", { rotateY: 0, rotateX: 0, duration: 0.6 }, WALL)
        .fromTo(".ww-rec", { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.3 }, WALL + 0.2);

      recordFormats.forEach((_, i) => {
        const at = WALL + 0.25 + i * PANEL;
        const sel = `.ww-panel[data-i="${i}"]`;
        tl.fromTo(sel, { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.15 }, at);
        tl.fromTo(
          `${sel} .ww-box`,
          { y: 40, opacity: 0, rotateX: -50 },
          { y: 0, opacity: 1, rotateX: 0, duration: 0.35, stagger: 0.025, ease: "power2.out" },
          at
        );
        if (i < N - 1) {
          tl.to(`${sel} .ww-box`, { y: -30, opacity: 0, duration: 0.2, stagger: 0.01 }, at + PANEL - 0.25);
          tl.to(sel, { autoAlpha: 0, duration: 0.05 }, at + PANEL - 0.05);
        }
      });
      tl.to({}, { duration: 0.3 }, TOTAL - 0.3); // hold the last panel
    }, root);
    requestAnimationFrame(refreshTriggers);
    return () => ctx.revert();
  }, [animated]);

  const jump = (i: number) => {
    const st = stRef.current;
    if (!st) return;
    const t = WALL + 0.25 + i * PANEL + 0.45;
    scrollToY(st.start + (st.end - st.start) * (t / TOTAL));
  };

  const cells = Array.from({ length: COLS * ROWS }, (_, i) => words[(i * 7) % words.length]);

  return (
    <section
      className={`wordwall dark ${animated ? "is-animated" : "is-static"}`}
      ref={root}
      aria-label="Thala — MS Dhoni's career records"
    >
      <div className="ww-scene" aria-hidden="true">
        <div className="ww-plane" style={{ gridTemplateColumns: `repeat(${COLS}, 1fr)` }}>
          {cells.map((w, i) => (
            <span key={i} className={`ww-cell ${i % 5 === 0 ? "hi" : ""}`}>
              {w}
            </span>
          ))}
        </div>
      </div>

      <div className="ww-center">
        <p className="ww-thala" data-text="Thala">
          Thala
        </p>
      </div>

      <div className="ww-rec">
        <h2 className="sr-only">Career records</h2>
        <nav className="ww-tabs" aria-label="Record formats">
          {recordFormats.map((f, i) => (
            <button
              key={f.id}
              type="button"
              className={active === i ? "is-on" : ""}
              aria-current={active === i ? "true" : undefined}
              onClick={() => jump(i)}
              tabIndex={animated ? 0 : -1}
            >
              {f.tab}
            </button>
          ))}
        </nav>
        <div className="ww-panels">
          {recordFormats.map((f, i) => (
            <section className="ww-panel" data-i={i} key={f.id} aria-labelledby={`rec-${f.id}`}>
              <header className="ww-phead">
                <h3 id={`rec-${f.id}`}>{f.title}</h3>
                <p>{f.sub}</p>
              </header>
              <ul className={`ww-grid ${f.boxes.length <= 3 ? "is-big" : ""}`}>
                {f.boxes.map((b) => (
                  <li className="ww-box" key={b.label}>
                    <span className="ww-val">{b.value}</span>
                    <span className="ww-lab">{b.label}</span>
                    {b.note && <span className="ww-note">{b.note}</span>}
                  </li>
                ))}
              </ul>
            </section>
          ))}
        </div>
        <p className="ww-src">Career figures from public scorecards. IPL figures through the 2026 season.</p>
      </div>
    </section>
  );
}
