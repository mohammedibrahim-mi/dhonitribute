"use client";

import { useEffect, useState } from "react";
import { Plus, X } from "lucide-react";

const links = [
  { href: "#story", label: "Journey" },
  { href: "#trophies", label: "Hall of Fame" },
  { href: "#journey", label: "Timeline" },
  { href: "#lessons", label: "Lessons" },
  { href: "#tribute-card", label: "Your Card" },
  { href: "#dear-thala", label: "Dear Thala" },
];

/** Thin column header with mix-blend "difference" so it reads on light and dark sections. */
export default function Header() {
  const [open, setOpen] = useState(false);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    let frame = 0;
    const on = () => {
      if (frame) return;
      frame = requestAnimationFrame(() => {
        frame = 0;
        const max = document.documentElement.scrollHeight - innerHeight;
        setProgress(max > 0 ? scrollY / max : 0);
      });
    };
    on();
    addEventListener("scroll", on, { passive: true });
    return () => removeEventListener("scroll", on);
  }, []);

  useEffect(() => {
    if (!open) return;
    const k = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    addEventListener("keydown", k);
    return () => removeEventListener("keydown", k);
  }, [open]);

  return (
    <header className="hdr">
      <div className="hdr-row">
        <a href="#home" className="hdr-logo" aria-label="MS Dhoni tribute — back to top">
          <Plus size={18} strokeWidth={3} aria-hidden="true" />
          <span className="hdr-bar" style={{ transform: `scaleX(${progress})` }} aria-hidden="true" />
        </a>
        <nav aria-label="Main" className="hdr-nav">
          <ul id="hdr-links" className={open ? "is-open" : undefined}>
            {links.map((l) => (
              <li key={l.href}>
                <a href={l.href} onClick={() => setOpen(false)}>
                  {l.label}
                </a>
              </li>
            ))}
          </ul>
        </nav>
        <button
          type="button"
          className="hdr-menu"
          aria-expanded={open}
          aria-controls="hdr-links"
          onClick={() => setOpen((o) => !o)}
        >
          {open ? <X size={16} aria-hidden="true" /> : "Menu"}
          {open && <span className="visually-hidden">Close menu</span>}
        </button>
      </div>
    </header>
  );
}
