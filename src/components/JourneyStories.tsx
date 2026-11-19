"use client";

import { useEffect, useRef, useState } from "react";
import { journeyStories } from "@/data/journeyStories";
import { imageById } from "@/data/gallery";
import { getGsap, prefersReducedMotion, refreshTriggers, scrollToY } from "@/lib/motion";

/**
 * The journey story — one pinned, full-screen stage holding three stories. Each story is shown
 * whole (title on the left, the full story on the right); scrolling switches from story 1 to 2 to 3
 * with a cross-fade of photo and text. The dots on the counter jump between stories.
 * Reduced motion: the three stories are laid out one after another.
 */
const N = journeyStories.length;
const pad = (n: number) => String(n).padStart(2, "0");

export default function JourneyStories() {
  const root = useRef<HTMLDivElement>(null);
  const stRef = useRef<{ start: number; end: number } | null>(null);
  const [animated, setAnimated] = useState(false);
  const [index, setIndex] = useState(0);
  const [prog, setProg] = useState(0);

  useEffect(() => {
    if (!prefersReducedMotion()) setAnimated(true);
  }, []);

  useEffect(() => {
    if (!animated || !root.current) return;
    const { ScrollTrigger } = getGsap();
    let last = -1;
    const st = ScrollTrigger.create({
      trigger: root.current,
      start: "top top",
      end: `+=${N * 90}%`,
      pin: true,
      anticipatePin: 1,
      onRefresh: (self) => (stRef.current = { start: self.start, end: self.end }),
      onUpdate: (self) => {
        stRef.current = { start: self.start, end: self.end };
        const i = Math.min(N - 1, Math.floor(self.progress * N * 0.9999));
        if (i !== last) {
          last = i;
          setIndex(i);
        }
        setProg(self.progress);
      },
    });
    requestAnimationFrame(refreshTriggers);
    return () => st.kill();
  }, [animated]);

  const goTo = (i: number) => {
    const st = stRef.current;
    if (!st) return;
    scrollToY(st.start + ((st.end - st.start) * (i + 0.35)) / N);
  };

  return (
    <div ref={root} id="story" className={`jstories ${animated ? "is-animated" : "is-static"}`}>
      <h2 className="sr-only">The journey — three stories</h2>
      {journeyStories.map((s, i) => {
        const img = imageById(s.bg);
        const on = !animated || i === index;
        return (
          <section
            key={s.id}
            className={`jstory ${on ? "is-on" : ""} ${animated && i < index ? "is-past" : ""}`}
            aria-labelledby={`js-${s.id}`}
            aria-hidden={animated && !on ? true : undefined}
          >
            <div className="js-bg" aria-hidden="true">
              <div className="js-bg-inner">
                {img && (
                  <img
                    src={img.src}
                    alt=""
                    width={img.width}
                    height={img.height}
                    style={{ objectPosition: img.objectPosition }}
                    loading={i ? "lazy" : "eager"}
                  />
                )}
              </div>
            </div>
            <div className="js-shade" aria-hidden="true" />

            <div className="js-grid">
              <header className="js-head">
                <p className="js-num">Journey {s.number}</p>
                <h3 id={`js-${s.id}`} className="js-title">
                  {s.title}
                </h3>
                <p className="js-era">{s.era}</p>
              </header>

              <div className="js-reader">
                {s.beats.map((b, k) => (
                  <p key={k} className={`js-beat ${b.em ? "is-em" : ""}`} style={{ transitionDelay: on && animated ? `${0.25 + k * 0.06}s` : "0s" }}>
                    {b.text}
                  </p>
                ))}
                <p className="js-closing" style={{ transitionDelay: on && animated ? `${0.3 + s.beats.length * 0.06}s` : "0s" }}>
                  {s.closing}
                </p>
              </div>
            </div>
          </section>
        );
      })}

      {animated && (
        <div className="js-counter">
          <b aria-hidden="true">{pad(index + 1)}</b>
          <span className="js-track" aria-hidden="true">
            <i style={{ transform: `scaleX(${Math.max(0.02, prog)})` }} />
          </span>
          <b aria-hidden="true">{pad(N)}</b>
          <nav className="js-dots" aria-label="Stories">
            {journeyStories.map((s, i) => (
              <button
                key={s.id}
                type="button"
                className={i === index ? "is-on" : ""}
                onClick={() => goTo(i)}
                aria-current={i === index ? "step" : undefined}
                aria-label={`Journey ${s.number}: ${s.title}`}
              />
            ))}
          </nav>
          {index < N - 1 && <span className="js-hint">Scroll for journey {pad(index + 2)} ↓</span>}
        </div>
      )}
    </div>
  );
}
