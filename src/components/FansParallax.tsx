"use client";

import { useEffect, useRef } from "react";
import { aesthetic } from "@/data/trophies";
import { getGsap, prefersReducedMotion } from "@/lib/motion";

// Aesthetic photos as moving columns (not a gallery list)
const columns = [
  ["helmet-salute", "training-run"],
  ["eden-gardens-walkout", "manga-legend"],
  ["helmet-bowed", "trust-the-process"],
];
const speeds = [-12, -34, -20];

export default function FansParallax() {
  const root = useRef<HTMLElement>(null);

  useEffect(() => {
    if (prefersReducedMotion() || !root.current) return;
    const { gsap } = getGsap();
    const ctx = gsap.context(() => {
      gsap.utils.toArray<HTMLElement>(".fp-col").forEach((col, i) => {
        gsap.fromTo(
          col,
          { yPercent: 8 },
          { yPercent: speeds[i], ease: "none", scrollTrigger: { trigger: root.current, start: "top bottom", end: "bottom top", scrub: true } }
        );
      });
      gsap.fromTo(
        ".fp-line",
        { xPercent: (i) => (i ? 30 : -30), opacity: 0 },
        { xPercent: 0, opacity: 1, ease: "none", scrollTrigger: { trigger: ".fp-text", start: "top 90%", end: "top 40%", scrub: 1 } }
      );
    }, root);
    return () => ctx.revert();
  }, []);

  return (
    <section className="fans dark" ref={root} aria-labelledby="fans-h">
      <div className="fp-cols" aria-hidden="true">
        {columns.map((col, i) => (
          <div className="fp-col" key={i}>
            {col.map((id) => {
              const img = aesthetic(id);
              return img ? (
                <div className="fp-img" key={id}>
                  <img src={img.src} alt="" width={img.width} height={img.height} loading="lazy" style={{ objectPosition: img.objectPosition }} />
                </div>
              ) : null;
            })}
          </div>
        ))}
      </div>
      <h2 id="fans-h" className="fp-text">
        <span className="fp-line">The fans tell us</span>
        <span className="fp-line">how much he means.</span>
      </h2>
    </section>
  );
}
