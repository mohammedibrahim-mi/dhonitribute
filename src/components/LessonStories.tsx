"use client";

import { useEffect, useRef, useState } from "react";
import { bookLessons, bookSource } from "@/data/stories";
import { imageById } from "@/data/gallery";
import { getGsap, prefersReducedMotion, refreshTriggers } from "@/lib/motion";

const pad = (n: number) => String(n).padStart(2, "0");

/**
 * Top 10 lessons from the book "Think and Win Like Dhoni" — one lesson per panel, scrolled horizontally.
 * Animated: the section pins and vertical scroll drives the track sideways.
 * Reduced motion: a native horizontal scroller with snap points.
 */
export default function LessonStories() {
  const root = useRef<HTMLElement>(null);
  const track = useRef<HTMLDivElement>(null);
  const [animated, setAnimated] = useState(false);
  const [index, setIndex] = useState(0);
  const [progress, setProgress] = useState(0);
  const total = bookLessons.length;

  useEffect(() => {
    if (!prefersReducedMotion()) setAnimated(true);
  }, []);

  useEffect(() => {
    if (!animated || !root.current || !track.current) return;
    const { gsap } = getGsap();
    const el = track.current;
    const distance = () => Math.max(0, el.scrollWidth - window.innerWidth);
    const ctx = gsap.context(() => {
      gsap.to(el, {
        x: () => -distance(),
        ease: "none",
        scrollTrigger: {
          trigger: root.current,
          start: "top top",
          end: () => `+=${distance()}`,
          pin: true,
      anticipatePin: 1,
          scrub: 0.6,
          invalidateOnRefresh: true,
          onUpdate: (self) => {
            setProgress(self.progress);
            setIndex(Math.min(total - 1, Math.round(self.progress * (total - 1))));
          },
        },
      });
      gsap.utils.toArray<HTMLElement>(".st-panel").forEach((p) => {
        const img = p.querySelector(".st-img img");
        if (img) gsap.fromTo(img, { scale: 1.15 }, { scale: 1, ease: "none", scrollTrigger: { trigger: root.current, start: "top top", end: () => `+=${distance()}`, scrub: true } });
      });
    }, root);
    requestAnimationFrame(refreshTriggers);
    return () => ctx.revert();
  }, [animated, total]);

  // Native scroller: track the visible panel for the counter
  const onNativeScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const t = e.currentTarget;
    const p = t.scrollWidth > t.clientWidth ? t.scrollLeft / (t.scrollWidth - t.clientWidth) : 0;
    setProgress(p);
    setIndex(Math.min(total - 1, Math.round(p * (total - 1))));
  };

  return (
    <section
      id="lessons"
      className={`stories dark ${animated ? "is-animated" : "is-static"}`}
      ref={root}
      aria-labelledby="st-h"
    >
      <div className="st-top">
        <div className="st-head">
          <p className="eyebrow2">10 lessons · from the book</p>
          <h2 id="st-h" className="st-h">
            Dhoni Life Lessons
          </h2>
          <p className="st-sub">Top 10 lessons from the book by {bookSource.author}, for your work and life</p>
        </div>
        <div className="st-meta" aria-hidden="true">
          <span className="st-count">
            {pad(index + 1)} <i>/ {pad(total)}</i>
          </span>
          <span className="st-bar">
            <b style={{ transform: `scaleX(${Math.max(0.04, progress)})` }} />
          </span>
          <span className="st-hint">{animated ? "Scroll →" : "Swipe →"}</span>
        </div>
      </div>

      <div
        className="st-viewport"
        onScroll={animated ? undefined : onNativeScroll}
        tabIndex={animated ? undefined : 0}
        aria-label={animated ? undefined : "Ten lessons, scroll horizontally"}
      >
        <div className="st-track" ref={track}>
          {bookLessons.map((s) => {
            const img = imageById(s.imageId);
            return (
              <article className="st-panel" key={s.number} aria-labelledby={`st-${s.number}`}>
                {img && (
                  <figure className="st-img">
                    <img
                      src={img.src}
                      alt={img.alt}
                      width={img.width}
                      height={img.height}
                      loading="lazy"
                      style={{ objectPosition: img.objectPosition }}
                    />
                  </figure>
                )}
                <div className="st-body">
                  <p className="st-kicker">
                    <span>{pad(s.number)}</span> {s.kicker}
                  </p>
                  <h3 id={`st-${s.number}`} className="st-title">
                    {s.title}
                  </h3>
                  <p className="st-story">{s.story}</p>
                  <div className="st-work">
                    <p>
                      <b>At work</b> {s.work}
                    </p>
                    <p>
                      <b>Try this</b> {s.tryThis}
                    </p>
                  </div>
                </div>
              </article>
            );
          })}
          <aside className="st-panel st-end">
            <p className="st-endline">Ten lessons. One way of thinking.</p>
            <p className="st-credit">
              Lessons summarised in our own words from <cite>{bookSource.title}</cite> by {bookSource.author} (
              {bookSource.publisher}, {bookSource.year}). Takeaways and &ldquo;Try this&rdquo; prompts are fan
              interpretations, not quotes from MS Dhoni or the author.
            </p>
          </aside>
        </div>
      </div>
    </section>
  );
}
