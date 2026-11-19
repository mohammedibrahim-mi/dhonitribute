"use client";

import { useEffect, useRef } from "react";
import { retirementAnnouncement } from "@/data/site";
import { getGsap, prefersReducedMotion } from "@/lib/motion";
import FanLights from "./FanLights";

const WORD = "DHONI";
const LINES = ["As a fan boy,", "my tribute", "to my captain"];
const DARK_LINES = ["The only captain", "to win all ICC trophies", "in his time"];
const BARS = 8;

export default function HeroIntro() {
  const root = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (prefersReducedMotion() || !root.current) return;
    const { gsap } = getGsap();
    const ctx = gsap.context(() => {
      // Wordmark letters rise in on load
      gsap.from(".wm-letter", { yPercent: 110, duration: 1.3, ease: "expo.out", stagger: 0.07, delay: 0.15 });
      gsap.from(".hero-copy > *", { opacity: 0, y: 18, duration: 1, ease: "power3.out", stagger: 0.1, delay: 0.7 });

      // Big words slide in from the right, one line at a time, as you scroll
      gsap.utils.toArray<HTMLElement>(".hw-line").forEach((line, i) => {
        gsap.fromTo(
          line,
          { xPercent: 70 + i * 15, opacity: 0.15 },
          {
            xPercent: 0,
            opacity: 1,
            ease: "none",
            scrollTrigger: { trigger: ".hero-words", start: `top+=${i * 8}% bottom`, end: "bottom 70%", scrub: 1 },
          }
        );
      });

      // Stripe wipe: horizontal bars close from light to dark while pinned
      const tl = gsap.timeline({
        scrollTrigger: { trigger: ".wipe", start: "top top", end: "+=180%", scrub: 1, pin: true, anticipatePin: 1 },
      });
      tl.fromTo(
        ".wipe-bar",
        { scaleY: 0 },
        { scaleY: 1, ease: "power2.inOut", stagger: { each: 0.06, from: "edges" }, duration: 1 }
      )
        .fromTo(".dl-line", { xPercent: (i) => (i % 2 ? -40 : 40), opacity: 0 }, { xPercent: 0, opacity: 1, stagger: 0.12, duration: 0.8 }, 0.35)
        .fromTo(".dl-eyebrow", { opacity: 0 }, { opacity: 0.75, duration: 0.5 }, 0.3)
        .to(".wipe-hint", { opacity: 0, duration: 0.2 }, 0);
    }, root);
    return () => ctx.revert();
  }, []);

  return (
    <div ref={root}>
      <section id="home" className="hero2 light" aria-labelledby="hero-h1">
        <h1 id="hero-h1" className="wordmark" aria-label="MS Dhoni — a fan-made tribute">
          <span aria-hidden="true">
            {WORD.split("").map((ch, i) => (
              <span className="wm-mask" key={i}>
                <span className="wm-letter">{ch}</span>
              </span>
            ))}
          </span>
        </h1>

        <div className="hero-copy grid12">
          <p className="hero-small">
            Calm presence.
            <br />
            Clinical finish.
          </p>
          <p className="hero-lead">
            {retirementAnnouncement
              ? "The game moves on. The legacy stays."
              : "A fan tribute to the captain who turned pressure into history."}
          </p>
          <a href="#story" className="scroll-hint">
            <span aria-hidden="true" />
            Scroll to discover
          </a>
          {retirementAnnouncement && (
            <p className="hero-src">
              {retirementAnnouncement.summary} ({retirementAnnouncement.date}) —{" "}
              <a href={retirementAnnouncement.sourceUrl} target="_blank" rel="noopener noreferrer">
                {retirementAnnouncement.sourceName}
              </a>
            </p>
          )}
        </div>

        <div className="hero-words" aria-hidden="true">
          {LINES.map((l) => (
            <span className="hw-line" key={l}>
              {l}
            </span>
          ))}
        </div>
      </section>

      <FanLights />

      <section className="wipe" aria-label="The only captain to win all ICC trophies in his time">
        <div className="wipe-bars" aria-hidden="true">
          {Array.from({ length: BARS }, (_, i) => (
            <span className="wipe-bar" key={i} style={{ transformOrigin: i % 2 ? "top" : "bottom" }} />
          ))}
        </div>
        <div className="wipe-text">
          <span className="dl-eyebrow">T20 World Cup 2007 · ODI World Cup 2011 · Champions Trophy 2013</span>
          {DARK_LINES.map((l) => (
            <span className="dl-line" key={l}>
              {l}
            </span>
          ))}
        </div>
        <span className="wipe-hint" aria-hidden="true">
          #7
        </span>
      </section>
    </div>
  );
}
