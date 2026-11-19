"use client";

import { useEffect, useRef, useState } from "react";
import { THEMES, currentTheme, setThemeAttr, type ThemeId } from "@/lib/theme";
import { prefersReducedMotion } from "@/lib/motion";

/**
 * Theme picker — a small floating pill with three looks: Classic (black & gold), Yellove (CSK
 * golden yellow & white) and Men in Blue (India blue & saffron). Switching plays a "stadium
 * doors" transition: the two halves of a giant stadium screen — "THE MAN · THE MYTH · THE
 * LEGEND" over a packed crowd, painted in the new theme's colours — slide in from both sides and
 * slam shut, the board powers on, the site changes colour behind it, and the doors swing open.
 */

const BOARD = (id: ThemeId, tall: boolean) => `/images/board/${id}-${tall ? "tall" : "wide"}.webp`;
const isTall = () => typeof window !== "undefined" && window.innerHeight > window.innerWidth * 1.05;
/** Make sure the board image for a theme is decoded before the doors move. */
function preloadBoard(id: ThemeId) {
  const img = new Image();
  img.src = BOARD(id, isTall());
  return img.decode().catch(() => {});
}

type Powder = { colors: string[]; wash: string; ink: string };
const POWDER: Record<ThemeId, Powder> = {
  classic: { colors: ["#d9b56d", "#f3d58c", "#fff1d0", "#b8893a", "#8a6a2e"], wash: "#0e0e0f", ink: "#f3d58c" },
  csk: { colors: ["#f9c80e", "#ffde59", "#ffffff", "#ff9f1c", "#ffe9a8", "#1f4fa8"], wash: "#f9c80e", ink: "#1d1503" },
  india: { colors: ["#ff9933", "#ffffff", "#138808", "#1f5fff", "#ffb366", "#2fa84f"], wash: "#061640", ink: "#ffffff" },
};

export default function ThemeSwitcher() {
  const [theme, setTheme] = useState<ThemeId>("classic");
  const [open, setOpen] = useState(false);
  const [fx, setFx] = useState<ThemeId | null>(null);
  const busy = useRef(false);
  const overlay = useRef<HTMLDivElement>(null);
  const wrap = useRef<HTMLDivElement>(null);

  useEffect(() => setTheme(currentTheme()), []);
  useEffect(() => {
    if (!open) return;
    const onDown = (e: PointerEvent) => {
      if (wrap.current && !wrap.current.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    window.addEventListener("pointerdown", onDown);
    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("pointerdown", onDown);
      window.removeEventListener("keydown", onKey);
    };
  }, [open]);

  // preload the boards when the menu opens, so the doors are ready to move
  useEffect(() => {
    if (open) THEMES.forEach((th) => th.id !== theme && preloadBoard(th.id));
  }, [open, theme]);

  // the stadium doors
  useEffect(() => {
    if (!fx || !overlay.current) return;
    const el = overlay.current;
    const left = el.querySelector<HTMLElement>(".tsd-l")!;
    const right = el.querySelector<HTMLElement>(".tsd-r")!;
    const seam = el.querySelector<HTMLElement>(".tsd-seam")!;
    const power = el.querySelector<HTMLElement>(".tsd-power")!;
    const anims: Animation[] = [];
    const timers: number[] = [];
    let cancelled = false;
    const IN = 700; // doors travel
    const HOLD = 900; // closed: board powers on, theme swaps
    const OUT = 800; // doors open

    preloadBoard(fx).then(() => {
      if (cancelled) return;
      el.classList.add("is-ready");
      const slideIn = { duration: IN, easing: "cubic-bezier(0.55, 0, 0.9, 0.45)", fill: "forwards" as const };
      anims.push(left.animate([{ transform: "translateX(-101%)" }, { transform: "translateX(0)" }], slideIn));
      anims.push(right.animate([{ transform: "translateX(101%)" }, { transform: "translateX(0)" }], slideIn));
      // the slam: a little shudder, a light burst down the seam, then the board flickers on
      timers.push(
        window.setTimeout(() => {
          anims.push(
            el.animate(
              [{ transform: "translate(0,0)" }, { transform: "translate(-6px,3px)" }, { transform: "translate(5px,-2px)" }, { transform: "translate(-2px,1px)" }, { transform: "translate(0,0)" }],
              { duration: 320, easing: "ease-out" }
            )
          );
          anims.push(seam.animate([{ opacity: 0, transform: "scaleY(0.2)" }, { opacity: 1, transform: "scaleY(1)", offset: 0.25 }, { opacity: 0, transform: "scaleY(1)" }], { duration: 700, easing: "ease-out", fill: "forwards" }));
          anims.push(
            power.animate(
              [{ opacity: 0.85 }, { opacity: 0.2, offset: 0.12 }, { opacity: 0.7, offset: 0.2 }, { opacity: 0.05, offset: 0.34 }, { opacity: 0.4, offset: 0.42 }, { opacity: 0, offset: 0.6 }, { opacity: 0 }],
              { duration: 800, easing: "linear", fill: "forwards" }
            )
          );
        }, IN)
      );
      timers.push(
        window.setTimeout(() => {
          setThemeAttr(fx);
          setTheme(fx);
        }, IN + 250)
      );
      timers.push(
        window.setTimeout(() => {
          const open = { duration: OUT, easing: "cubic-bezier(0.65, 0, 0.35, 1)", fill: "forwards" as const };
          anims.push(left.animate([{ transform: "translateX(0)" }, { transform: "translateX(-101%)" }], open));
          anims.push(right.animate([{ transform: "translateX(0)" }, { transform: "translateX(101%)" }], open));
        }, IN + HOLD)
      );
      timers.push(
        window.setTimeout(() => {
          setFx(null);
          busy.current = false;
        }, IN + HOLD + OUT + 40)
      );
    });

    return () => {
      cancelled = true;
      timers.forEach(window.clearTimeout);
      anims.forEach((a) => a.cancel());
    };
  }, [fx]);

  const pick = (id: ThemeId) => {
    setOpen(false);
    if (id === theme || busy.current) return;
    if (prefersReducedMotion()) {
      setThemeAttr(id);
      setTheme(id);
      return;
    }
    busy.current = true;
    setFx(id);
  };

  const now = THEMES.find((t) => t.id === theme)!;
  const next = fx ? THEMES.find((t) => t.id === fx)! : null;

  return (
    <>
      <div ref={wrap} className={`tsw ${open ? "is-open" : ""}`}>
        <button type="button" className="tsw-toggle" aria-expanded={open} aria-controls="tsw-menu" onClick={() => setOpen((o) => !o)}>
          <Swatch c={now.swatch} />
          <span className="tsw-label">
            Theme<b>: {now.name}</b>
          </span>
        </button>
        <ul id="tsw-menu" className="tsw-menu" role="list">
          {THEMES.map((t) => (
            <li key={t.id}>
              <button type="button" className={t.id === theme ? "is-on" : ""} aria-pressed={t.id === theme} onClick={() => pick(t.id)}>
                <Swatch c={t.swatch} />
                <span>
                  <b>{t.name}</b>
                  <small>{t.tag}</small>
                </span>
              </button>
            </li>
          ))}
        </ul>
      </div>

      {next && (
        <div ref={overlay} className="tsd" aria-hidden="true">
          <div className="tsd-door tsd-l" style={{ backgroundImage: `url(${BOARD(next.id, isTall())})` }}>
            <span className="tsd-edge" />
          </div>
          <div className="tsd-door tsd-r" style={{ backgroundImage: `url(${BOARD(next.id, isTall())})` }}>
            <span className="tsd-edge" />
          </div>
          <span className="tsd-power" />
          <span className="tsd-seam" />
          <p className="tsd-name" style={{ color: POWDER[next.id].ink }}>
            {next.name}
            <small>{next.tag}</small>
          </p>
        </div>
      )}
      <p className="sr-only" role="status" aria-live="polite">
        {`Theme: ${now.name}`}
      </p>
    </>
  );
}

function Swatch({ c }: { c: [string, string] }) {
  return (
    <i className="tsw-sw" aria-hidden="true" style={{ background: `linear-gradient(135deg, ${c[0]} 0 50%, ${c[1]} 50% 100%)` }} />
  );
}
