"use client";

import { useEffect, useState } from "react";

/** True when the visitor prefers reduced motion. */
export function useReducedMotion(): boolean {
  const [reduced, setReduced] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => setReduced(mq.matches);
    update();
    mq.addEventListener("change", update);
    return () => mq.removeEventListener("change", update);
  }, []);
  return reduced;
}

/** True on devices with a fine pointer that can hover (desktop). Pointer effects are off on touch. */
export function useFinePointer(): boolean {
  const [fine, setFine] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia("(hover: hover) and (pointer: fine)");
    const update = () => setFine(mq.matches);
    update();
    mq.addEventListener("change", update);
    return () => mq.removeEventListener("change", update);
  }, []);
  return fine;
}

/** Low-power heuristic: few CPU cores or data-saver on. Used to disable tilt/particles. */
export function useLowPower(): boolean {
  const [low, setLow] = useState(false);
  useEffect(() => {
    const nav = navigator as Navigator & { connection?: { saveData?: boolean } };
    const cores = nav.hardwareConcurrency ?? 8;
    setLow(cores <= 4 || Boolean(nav.connection?.saveData));
  }, []);
  return low;
}
