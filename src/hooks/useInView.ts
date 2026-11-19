"use client";

import { useEffect, useRef, useState } from "react";

/**
 * Marks an element as visible once it enters the viewport (fires once).
 * Content is visible by default; the hidden state only applies when the
 * <html> element has the `anim` class (JS on + motion allowed).
 */
export function useInView<T extends Element>(options: IntersectionObserverInit = { threshold: 0.2 }) {
  const ref = useRef<T | null>(null);
  const [inView, setInView] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (!("IntersectionObserver" in window)) {
      setInView(true);
      return;
    }
    const io = new IntersectionObserver((entries) => {
      for (const entry of entries) {
        if (entry.isIntersecting) {
          setInView(true);
          io.disconnect();
        }
      }
    }, options);
    io.observe(el);
    return () => io.disconnect();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return { ref, inView };
}
