"use client";

import { useEffect, useRef, useState } from "react";
import { getGsap, prefersReducedMotion, refreshTriggers } from "@/lib/motion";

/**
 * "My yellow memories" — the creator's own photos, clipped like polaroids to a string of warm
 * fairy lights against a dusk sky. The section pins; as you scroll, the lights switch on along the
 * string and each photo drops onto its clip and sways. On phones the string pans sideways so each
 * photo comes to the centre in turn.
 * Reduced motion: every photo is shown, nothing moves.
 */

type FanPhoto = {
  src: string;
  w: number;
  h: number;
  alt: string;
  caption: string;
  place: string;
  tilt: number;
};

const PHOTOS: FanPhoto[] = [
  {
    src: "/images/fan/chepauk.webp",
    w: 760,
    h: 868,
    alt: "The creator of this tribute in a CSK jersey in the stands at Chepauk under floodlights",
    caption: "My home ground",
    place: "Chepauk, Chennai",
    tilt: -4,
  },
  {
    src: "/images/fan/atmosphere.webp",
    w: 760,
    h: 950,
    alt: "A packed, floodlit Chepauk crowd in yellow, many wearing number 7 Dhoni jerseys",
    caption: "The atmosphere 💥",
    place: "A sea of 7s",
    tilt: 3,
  },
  {
    src: "/images/fan/idol-wave.webp",
    w: 760,
    h: 904,
    alt: "MS Dhoni in CSK training kit walking past at night and waving, photographed by the creator",
    caption: "When your idol looks at you and waves 🥹",
    place: "13·05·2023 · Leela Palace Chennai",
    tilt: -2,
  },
  {
    src: "/images/fan/whistle-podu.webp",
    w: 900,
    h: 717,
    alt: "The creator standing behind a giant yellow #WHISTLEPODU sign in the Leela Palace courtyard",
    caption: "#WhistlePodu 💛",
    place: "The Leela Palace, Chennai",
    tilt: 4,
  },
  {
    src: "/images/fan/yellow-polo.webp",
    w: 760,
    h: 860,
    alt: "The creator in a yellow Chennai Super Kings polo and sunglasses",
    caption: "Yellow, every day",
    place: "Fan boy, forever",
    tilt: -3,
  },
];

const N = PHOTOS.length;
const pad = (n: number) => String(n).padStart(2, "0");
const T = PHOTOS.map((_, i) => 0.1 + (0.8 * i) / (N - 1)); // positions along the string
const BULBS = 23;
const Y0 = 88; // string ends (px from top of the stage)
const SAG = 95; // sag at the middle (px)
const yAt = (t: number) => Y0 + 4 * SAG * t * (1 - t);

export default function FanLights() {
  const root = useRef<HTMLElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);
  const [animated, setAnimated] = useState(false);
  const [shown, setShown] = useState(0);

  useEffect(() => {
    if (!prefersReducedMotion()) setAnimated(true);
  }, []);

  useEffect(() => {
    if (!animated || !root.current) return;
    const { ScrollTrigger } = getGsap();
    let last = -1;
    const update = (p: number) => {
      const track = trackRef.current;
      const vw = window.innerWidth;
      let count: number;
      if (track && track.offsetWidth > vw + 4) {
        // phone: pan the string so each photo reaches the centre in turn
        const W = track.offsetWidth;
        const x = p * (W - vw);
        track.style.transform = `translate3d(${-x}px,0,0)`;
        count = T.filter((t) => t * W < x + vw * 0.72).length;
      } else {
        if (track) track.style.transform = "";
        count = Math.min(N, Math.floor(p * (N + 0.4) + 0.15));
      }
      if (count !== last) {
        last = count;
        setShown(count);
      }
    };
    const st = ScrollTrigger.create({
      trigger: root.current,
      start: "top top",
      end: `+=${N * 60}%`,
      pin: true,
      anticipatePin: 1,
      onUpdate: (self) => update(self.progress),
      onRefresh: (self) => update(self.progress),
    });
    update(st.progress);
    requestAnimationFrame(refreshTriggers);
    return () => st.kill();
  }, [animated]);

  const visibleCount = animated ? shown : N;
  const reach = visibleCount === 0 ? 0.04 : T[visibleCount - 1] + 0.1; // lights are on up to here

  return (
    <section
      ref={root}
      className={`fanlights ${animated ? "is-animated" : "is-static"}`}
      aria-labelledby="fl-h"
    >
      <div className="fl-sky" aria-hidden="true" />
      <div ref={trackRef} className="fl-track">
        {/* back string — decoration */}
        <svg
          className="fl-string is-back"
          viewBox="0 0 1000 400"
          preserveAspectRatio="none"
          aria-hidden="true"
        >
          <path
            d={`M0 ${Y0 + 250} Q500 ${Y0 + 250 + 2 * 50} 1000 ${Y0 + 250}`}
          />
        </svg>
        {Array.from({ length: 15 }, (_, k) => {
          const t = (k + 0.5) / 15;
          const y = Y0 + 250 + 4 * 50 * t * (1 - t);
          return (
            <span
              key={`b${k}`}
              className={`fl-bulb is-back ${!animated || t <= reach ? "is-lit" : ""}`}
              style={{
                left: `${t * 100}%`,
                top: y,
                animationDelay: `${(k % 5) * 0.37}s`,
              }}
              aria-hidden="true"
            />
          );
        })}

        {/* front string with the photos */}
        <svg
          className="fl-string"
          viewBox="0 0 1000 400"
          preserveAspectRatio="none"
          aria-hidden="true"
        >
          <path d={`M0 ${Y0} Q500 ${Y0 + 2 * SAG} 1000 ${Y0}`} />
        </svg>
        {Array.from({ length: BULBS }, (_, k) => {
          const t = (k + 0.5) / BULBS;
          if (T.some((pt) => Math.abs(pt - t) < 0.025)) return null; // a photo clip sits here
          return (
            <span
              key={k}
              className={`fl-bulb ${!animated || t <= reach ? "is-lit" : ""}`}
              style={{
                left: `${t * 100}%`,
                top: yAt(t),
                animationDelay: `${(k % 7) * 0.29}s`,
              }}
              aria-hidden="true"
            />
          );
        })}

        <ol className="fl-cards">
          {PHOTOS.map((ph, i) => {
            const on = !animated || i < visibleCount;
            const wide = ph.w > ph.h;
            return (
              <li
                key={ph.src}
                className={`fl-card ${on ? "is-on" : ""} ${wide ? "is-wide" : ""}`}
                style={{
                  left: `${T[i] * 100}%`,
                  top: yAt(T[i]) - 6,
                  ["--tilt" as string]: `${ph.tilt}deg`,
                  ["--d" as string]: `${(i % 3) * 0.6}s`,
                }}
                aria-hidden={animated && !on ? true : undefined}
              >
                <span
                  className={`fl-bulb is-clip ${on ? "is-lit" : ""}`}
                  aria-hidden="true"
                />
                <figure className="fl-drop">
                  <div className="fl-sway">
                    <div className="fl-photo">
                      <img
                        src={ph.src}
                        alt={ph.alt}
                        width={ph.w}
                        height={ph.h}
                        loading="lazy"
                      />
                    </div>
                    <figcaption>
                      <b>{ph.caption}</b>
                      <small>{ph.place}</small>
                    </figcaption>
                  </div>
                </figure>
              </li>
            );
          })}
        </ol>
      </div>

      <header className="fl-head">
        <p className="fl-kicker">From the fan boy behind this tribute</p>
        <h2 id="fl-h">
          My captain, <em>my moments</em>
        </h2>
      </header>
      {animated && (
        <p className="fl-count" aria-hidden="true">
          <b>{pad(Math.max(1, visibleCount))}</b> / {pad(N)}
          {visibleCount < N && <span>Scroll to light up the next one ↓</span>}
        </p>
      )}
    </section>
  );
}
