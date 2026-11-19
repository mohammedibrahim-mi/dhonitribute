"use client";

import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

let registered = false;

/** Register GSAP plugins once (client only). */
export function getGsap() {
  if (!registered && typeof window !== "undefined") {
    gsap.registerPlugin(ScrollTrigger);
    // Phones show/hide the address bar while scrolling, which fires "resize". Re-measuring every
    // pin on that resize makes the page jump inside pinned sections — ignore it.
    ScrollTrigger.config({ ignoreMobileResize: true });
    registered = true;
  }
  return { gsap, ScrollTrigger };
}

/** True when the visitor prefers reduced motion — all scroll choreography is skipped. */
export function prefersReducedMotion(): boolean {
  if (typeof window === "undefined") return false;
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

/**
 * Re-measure every ScrollTrigger in page (DOM) order. Pins are created at slightly different
 * moments after hydration, so they are sorted by where their section sits in the document before
 * measuring — otherwise a pin lower down can be measured before the pins above it, and sections
 * overlap or the page jumps. Calls in the same frame are merged into one refresh.
 */
let refreshQueued = false;
export function refreshTriggers() {
  if (refreshQueued) return;
  refreshQueued = true;
  requestAnimationFrame(() => {
    refreshQueued = false;
    const { ScrollTrigger } = getGsap();
    ScrollTrigger.sort((a: ScrollTrigger, b: ScrollTrigger) => {
      const ea = a.trigger as Element | undefined;
      const eb = b.trigger as Element | undefined;
      if (!ea || !eb || ea === eb) return 0;
      return ea.compareDocumentPosition(eb) & Node.DOCUMENT_POSITION_FOLLOWING ? -1 : 1;
    });
    ScrollTrigger.refresh();
  });
}

/** Scroll the page to an absolute Y position, through Lenis when it is running. */
export function scrollToY(y: number, immediate = false) {
  const lenis = (window as unknown as { __lenis?: { scrollTo: (t: number, o?: object) => void } }).__lenis;
  if (lenis) lenis.scrollTo(y, { immediate, duration: immediate ? 0 : 1.4, force: true });
  else window.scrollTo({ top: y, behavior: immediate || prefersReducedMotion() ? "auto" : "smooth" });
}

/** Pause / resume page smooth-scrolling (for full-screen overlays). */
export function lockScroll(lock: boolean) {
  const lenis = (window as unknown as { __lenis?: { stop: () => void; start: () => void } }).__lenis;
  if (lock) lenis?.stop();
  else lenis?.start();
}
