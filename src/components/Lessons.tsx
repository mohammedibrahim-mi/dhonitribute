"use client";

import { useEffect, useRef } from "react";
import { leadershipLessons } from "@/data/leadershipLessons";
import { getGsap, prefersReducedMotion } from "@/lib/motion";

/** Eleven lessons, one line each. Each row brightens as it crosses the middle of the screen. */
export default function Lessons() {
  const root = useRef<HTMLElement>(null);

  useEffect(() => {
    if (prefersReducedMotion() || !root.current) return;
    const { gsap } = getGsap();
    const ctx = gsap.context(() => {
      gsap.utils.toArray<HTMLElement>(".ls-row").forEach((row) => {
        gsap.fromTo(
          row,
          { opacity: 0.18 },
          { opacity: 1, ease: "none", scrollTrigger: { trigger: row, start: "top 85%", end: "top 50%", scrub: true } }
        );
        gsap.fromTo(
          row.querySelector(".ls-title"),
          { x: 60 },
          { x: 0, ease: "none", scrollTrigger: { trigger: row, start: "top bottom", end: "top 50%", scrub: true } }
        );
      });
    }, root);
    return () => ctx.revert();
  }, []);

  return (
    <section id="lessons" className="lessons dark" ref={root} aria-labelledby="ls-h">
      <div className="ls-head grid12">
        <p className="eyebrow2">Leadership lessons</p>
        <h2 id="ls-h" className="ls-h">
          From the field
          <br />
          to your work.
        </h2>
        <p className="ls-note">Fan interpretations of public examples — not quotations from Dhoni.</p>
      </div>
      <ol className="ls-list">
        {leadershipLessons.map((l) => (
          <li className="ls-row" key={l.number}>
            <span className="ls-num">{String(l.number).padStart(2, "0")}</span>
            <span className="ls-title">{l.title}</span>
            <span className="ls-try">{l.action}</span>
          </li>
        ))}
      </ol>
    </section>
  );
}
