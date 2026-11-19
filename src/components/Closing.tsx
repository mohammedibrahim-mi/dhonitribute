"use client";

import { useEffect, useRef } from "react";
import { getGsap, prefersReducedMotion } from "@/lib/motion";

/** Pinned closing line: each word brightens as you scroll, then invites the card. */
export default function Closing() {
  const root = useRef<HTMLElement>(null);
  const text = "The innings may change. The lessons stay.";

  useEffect(() => {
    if (prefersReducedMotion() || !root.current) return;
    const { gsap } = getGsap();
    const ctx = gsap.context(() => {
      gsap.fromTo(
        ".cl-w",
        { opacity: 0.1 },
        { opacity: 1, stagger: 0.1, ease: "none", scrollTrigger: { trigger: root.current, start: "top top", end: "+=120%", scrub: 1, pin: true, anticipatePin: 1 } }
      );
    }, root);
    return () => ctx.revert();
  }, []);

  return (
    <section className="closing2 dark" ref={root} aria-label="Closing">
      <p className="cl-text">
        {text.split(" ").map((w, i) => (
          <span className="cl-w" key={i}>
            {w}{" "}
          </span>
        ))}
      </p>
      <a className="btn btn-primary cl-cta" href="#tribute-card">
        Create your tribute card
      </a>
    </section>
  );
}
