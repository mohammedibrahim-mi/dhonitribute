"use client";

import { useEffect } from "react";
import Lenis from "lenis";
import { getGsap, prefersReducedMotion, refreshTriggers } from "@/lib/motion";

/**
 * Inertial smooth scrolling (Lenis) driven by GSAP's ticker, so every
 * ScrollTrigger pin/scrub stays in sync. Native scrolling is untouched for
 * reduced-motion visitors and on touch devices (Lenis default).
 */
export default function SmoothScroll() {
  useEffect(() => {
    if (prefersReducedMotion()) return;
    const { gsap, ScrollTrigger } = getGsap();
    const lenis = new Lenis({ duration: 1.15, easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)) });
    lenis.on("scroll", ScrollTrigger.update);
    (window as unknown as { __lenis?: Lenis }).__lenis = lenis;
    const raf = (time: number) => lenis.raf(time * 1000);
    gsap.ticker.add(raf);
    gsap.ticker.lagSmoothing(0);

    // In-page anchor links scroll through Lenis
    const onClick = (e: MouseEvent) => {
      const a = (e.target as HTMLElement).closest('a[href^="#"]') as HTMLAnchorElement | null;
      if (!a) return;
      const id = a.getAttribute("href");
      if (!id || id === "#") return;
      const el = document.querySelector(id);
      if (!el) return;
      e.preventDefault();
      lenis.scrollTo(el as HTMLElement, { offset: 0 });
      history.replaceState(null, "", id);
    };
    document.addEventListener("click", onClick);

    // Recalculate pins once fonts and images have settled
    const refresh = () => refreshTriggers();
    document.fonts?.ready.then(refresh);
    window.addEventListener("load", refresh);
    // warm up the 3D library early so each 3D section is ready before you reach it
    const warm = window.setTimeout(() => {
      import("three").catch(() => {});
      import("three/examples/jsm/geometries/RoundedBoxGeometry.js").catch(() => {});
    }, 900);

    return () => {
      document.removeEventListener("click", onClick);
      window.removeEventListener("load", refresh);
      window.clearTimeout(warm);
      gsap.ticker.remove(raf);
      lenis.destroy();
      delete (window as unknown as { __lenis?: Lenis }).__lenis;
    };
  }, []);

  return null;
}
