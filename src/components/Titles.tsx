"use client";

import { useEffect, useRef } from "react";
import { getGsap, prefersReducedMotion } from "@/lib/motion";

const rows = [
  { big: "2007", small: "ICC T20 World Cup" },
  { big: "2011", small: "ICC Cricket World Cup" },
  { big: "2013", small: "ICC Champions Trophy" },
  { big: "5×", small: "IPL titles with CSK" },
];

/** Light section: giant numbers drift sideways in opposite directions as you scroll. */
export default function Titles() {
  const root = useRef<HTMLElement>(null);

  useEffect(() => {
    if (prefersReducedMotion() || !root.current) return;
    const { gsap } = getGsap();
    const ctx = gsap.context(() => {
      gsap.utils.toArray<HTMLElement>(".tt-row").forEach((row, i) => {
        gsap.fromTo(
          row,
          { xPercent: i % 2 ? -18 : 18 },
          { xPercent: i % 2 ? 6 : -6, ease: "none", scrollTrigger: { trigger: row, start: "top bottom", end: "bottom top", scrub: true } }
        );
      });
      gsap.from(".tt-intro > *", {
        opacity: 0,
        y: 30,
        stagger: 0.12,
        duration: 1,
        ease: "power3.out",
        scrollTrigger: { trigger: ".tt-intro", start: "top 80%" },
      });
    }, root);
    return () => ctx.revert();
  }, []);

  return (
    <section id="titles" className="titles light" ref={root} aria-labelledby="titles-h">
      <div className="tt-intro grid12">
        <p className="eyebrow2">He won</p>
        <h2 id="titles-h" className="tt-h">
          Three ICC titles.
          <br />
          Five IPL crowns.
        </h2>
      </div>
      <ul className="tt-list">
        {rows.map((r) => (
          <li className="tt-row" key={r.big}>
            <span className="tt-big">{r.big}</span>
            <span className="tt-small">{r.small}</span>
          </li>
        ))}
      </ul>
      <p className="tt-foot grid12">
        <span>The trophies tell us how many times he won.</span>
      </p>
    </section>
  );
}
