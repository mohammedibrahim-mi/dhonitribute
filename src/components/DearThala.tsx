"use client";

import { useEffect, useRef, useState } from "react";
import { getGsap, lockScroll, prefersReducedMotion, refreshTriggers } from "@/lib/motion";
import { canvasToBlob, loadImage } from "@/lib/cardRenderer";
import { saveBlob } from "@/lib/saveFile";

/**
 * "Dear Thala..." — the emotional ending. A pinned, full-screen letter that reads itself line by
 * line as you scroll, then invites fans to write their own. Letters stay on the fan's device
 * (draft saved locally); they can download a keepsake image, copy the text or share it.
 */

const LINES = [
  "We never knew how many memories one person could create.",
  "We watched you finish games.",
  "We watched you lift trophies.",
  "We watched you stay calm when the world was falling apart.",
  "But somewhere along the way, we didn't just watch cricket.",
  "We grew up with you.",
  "Thank you for every memory, every finish, every smile, every trophy, and every moment that made us believe.",
  "You may leave the field. But you'll never leave our hearts.",
];
const TAGS = "#ThankYouDhoni #EraOf7";
const DRAFT = "dear-thala-draft";
const BODY_MAX = 1200;
const NAME_MAX = 40;

export default function DearThala() {
  const root = useRef<HTMLElement>(null);
  const [animated, setAnimated] = useState(false);
  const [line, setLine] = useState(-1);
  const [done, setDone] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!prefersReducedMotion()) setAnimated(true);
  }, []);

  useEffect(() => {
    if (!animated || !root.current) return;
    const { ScrollTrigger } = getGsap();
    const steps = LINES.length + 1; // + the final screen
    const st = ScrollTrigger.create({
      trigger: root.current,
      start: "top top",
      end: `+=${steps * 70}%`,
      pin: true,
      anticipatePin: 1,
      onUpdate: (self) => {
        const s = Math.floor(self.progress * (steps + 0.6)) - 1; // a beat of title first
        setLine(Math.min(LINES.length - 1, s));
        setDone(s >= LINES.length);
      },
    });
    requestAnimationFrame(refreshTriggers);
    return () => st.kill();
  }, [animated]);

  return (
    <section
      ref={root}
      id="dear-thala"
      className={`dear ${animated ? "is-animated" : "is-static"} ${done ? "is-done" : ""} ${line >= 0 ? "is-reading" : ""}`}
      aria-labelledby="dear-h"
    >
      <div className="dear-glow" aria-hidden="true" />
      <div className="dear-dust" aria-hidden="true">
        {Array.from({ length: 18 }, (_, i) => (
          <span key={i} style={{ left: `${(i * 53) % 100}%`, animationDelay: `${(i * 0.7) % 9}s`, animationDuration: `${9 + (i % 5) * 2}s` }} />
        ))}
      </div>

      <h2 id="dear-h" className="dear-title">
        Dear Thala<span>...</span>
      </h2>

      <div className="dear-lines">
        {LINES.map((l, i) => {
          const last = i === LINES.length - 1;
          const state = !animated ? "is-on" : i === line ? "is-on" : i === line - 1 ? "is-prev" : i < line ? "is-gone" : "";
          return (
            <p key={i} className={`dear-line ${last ? "is-last" : ""} ${state}`} aria-hidden={animated && i !== line ? true : undefined}>
              {l}
            </p>
          );
        })}
      </div>

      <div className="dear-end">
        <p className="dear-tags">{TAGS}</p>
        <button type="button" className="dear-write" onClick={() => setOpen(true)}>
          Write My Letter <span aria-hidden="true">💛</span>
        </button>
        <p className="dear-small">Your letter stays on your device unless you choose to share it.</p>
      </div>

      {animated && (
        <p className="dear-hint" aria-hidden="true">
          Scroll slowly ↓
        </p>
      )}
      {/* full letter for screen readers in the animated version */}
      {animated && <p className="sr-only">{LINES.join(" ")}</p>}

      {open && <Composer onClose={() => setOpen(false)} />}
    </section>
  );
}

function Composer({ onClose }: { onClose: () => void }) {
  const [body, setBody] = useState("");
  const [name, setName] = useState("");
  const [status, setStatus] = useState<{ text: string; error?: boolean }>({ text: "" });
  const [busy, setBusy] = useState(false);
  const area = useRef<HTMLTextAreaElement>(null);

  // restore + autosave the draft on this device
  useEffect(() => {
    try {
      const d = JSON.parse(localStorage.getItem(DRAFT) || "null");
      if (d && typeof d.body === "string") setBody(d.body.slice(0, BODY_MAX));
      if (d && typeof d.name === "string") setName(d.name.slice(0, NAME_MAX));
    } catch {}
    area.current?.focus();
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    lockScroll(true);
    return () => {
      window.removeEventListener("keydown", onKey);
      lockScroll(false);
    };
  }, [onClose]);
  useEffect(() => {
    const id = window.setTimeout(() => {
      try {
        localStorage.setItem(DRAFT, JSON.stringify({ body, name }));
      } catch {}
    }, 400);
    return () => window.clearTimeout(id);
  }, [body, name]);

  const signName = () => name.trim() || "A fan";
  const text = () => `Dear Thala,\n\n${body.trim()}\n\nWith love — ${signName()}\n\n${TAGS}\n(Letter made on a fan tribute · Build with Miv)`;
  const ready = body.trim().length >= 10;

  const download = async () => {
    if (!ready) return setStatus({ text: "Write a few words first.", error: true });
    setBusy(true);
    setStatus({ text: "Preparing your letter…" });
    try {
      const canvas = await renderLetter(body.trim(), name.trim());
      const blob = await canvasToBlob(canvas);
      const slug = (name.trim() || "fan").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || "fan";
      const r = await saveBlob(`dear-thala-${slug}.png`, blob);
      setStatus({ text: r === "saved" ? "Saved! Share it with #ThankYouDhoni." : "Download cancelled." });
    } catch {
      setStatus({ text: "Couldn't create the image in this browser. Try Copy text instead.", error: true });
    } finally {
      setBusy(false);
    }
  };
  const copy = async () => {
    if (!ready) return setStatus({ text: "Write a few words first.", error: true });
    try {
      await navigator.clipboard.writeText(text());
      setStatus({ text: "Copied. Paste it anywhere with #ThankYouDhoni." });
    } catch {
      setStatus({ text: "Copy isn't available here — select the text and copy it manually.", error: true });
    }
  };
  const canShare = typeof navigator !== "undefined" && typeof navigator.share === "function";
  const share = async () => {
    if (!ready) return setStatus({ text: "Write a few words first.", error: true });
    try {
      await navigator.share({ title: "Dear Thala", text: text() });
    } catch {}
  };

  return (
    <div className="dear-compose" role="dialog" aria-modal="true" aria-labelledby="dear-compose-h" data-lenis-prevent>
      <div className="dear-paper">
        <button type="button" className="dear-close" onClick={onClose} aria-label="Close the letter">
          ✕
        </button>
        <p id="dear-compose-h" className="dear-salute">
          Dear Thala,
        </p>
        <label className="sr-only" htmlFor="dear-body">
          Your letter
        </label>
        <textarea
          id="dear-body"
          ref={area}
          value={body}
          maxLength={BODY_MAX}
          onChange={(e) => {
            setBody(e.target.value);
            if (status.error) setStatus({ text: "" });
          }}
          placeholder="Tell him the moment you'll never forget, what he taught you, or simply thank you…"
          rows={9}
        />
        <div className="dear-sign">
          <span>With love —</span>
          <label className="sr-only" htmlFor="dear-name">
            Your name (signs the letter)
          </label>
          <input id="dear-name" value={name} maxLength={NAME_MAX} onChange={(e) => setName(e.target.value)} placeholder="Your name, fan" autoComplete="given-name" />
          <small aria-hidden="true">
            {body.length}/{BODY_MAX}
          </small>
        </div>
        <p className="dear-name-hint">Your letter will be signed “With love — {name.trim() || "your name"}”.</p>
        <p className="dear-paper-tags">{TAGS}</p>
        <div className="dear-actions">
          <button type="button" className="dear-btn is-primary" onClick={download} disabled={busy}>
            {busy ? "Preparing…" : "Download my letter"}
          </button>
          <button type="button" className="dear-btn" onClick={copy}>
            Copy text
          </button>
          {canShare && (
            <button type="button" className="dear-btn" onClick={share}>
              Share
            </button>
          )}
        </div>
        <p className={`dear-status ${status.error ? "is-error" : ""}`} role="status" aria-live="polite">
          {status.text}
        </p>
        <p className="dear-small dark-ink">Saved as a draft on this device only. Nothing is uploaded.</p>
      </div>
    </div>
  );
}

/** Render the letter as a 1080×1350 keepsake image. */
async function renderLetter(body: string, name: string) {
  const W = 1080;
  const H = 1350;
  const DISPLAY = '"Inter Tight", "Helvetica Neue", Arial, sans-serif';
  const BODY = '"Inter", "Helvetica Neue", Arial, sans-serif';
  try {
    await Promise.all([document.fonts.load(`800 80px ${DISPLAY}`), document.fonts.load(`italic 400 34px ${BODY}`), document.fonts.load(`600 30px ${BODY}`)]);
  } catch {}
  const c = document.createElement("canvas");
  c.width = W;
  c.height = H;
  const g = c.getContext("2d")!;
  // night background + paper
  const bg = g.createLinearGradient(0, 0, 0, H);
  bg.addColorStop(0, "#151517");
  bg.addColorStop(1, "#0b0b0c");
  g.fillStyle = bg;
  g.fillRect(0, 0, W, H);
  const glow = g.createRadialGradient(W / 2, H * 0.35, 40, W / 2, H * 0.35, W * 0.8);
  glow.addColorStop(0, "rgba(217,181,109,0.28)");
  glow.addColorStop(1, "rgba(217,181,109,0)");
  g.fillStyle = glow;
  g.fillRect(0, 0, W, H);
  const creator = await loadImage("/images/creator.webp").catch(() => null);
  const px = 70;
  const py = 60;
  const pw = W - px * 2;
  const ph = H - py - 150;
  g.save();
  g.shadowColor = "rgba(0,0,0,0.55)";
  g.shadowBlur = 50;
  g.shadowOffsetY = 18;
  const paper = g.createLinearGradient(0, py, 0, py + ph);
  paper.addColorStop(0, "#fbf6ea");
  paper.addColorStop(1, "#f1e7d0");
  g.fillStyle = paper;
  g.fillRect(px, py, pw, ph);
  g.restore();
  // ruled lines
  g.strokeStyle = "rgba(120, 96, 50, 0.12)";
  g.lineWidth = 2;
  for (let y = py + 250; y < py + ph - 220; y += 52) {
    g.beginPath();
    g.moveTo(px + 60, y);
    g.lineTo(px + pw - 60, y);
    g.stroke();
  }
  // heading
  g.fillStyle = "#1c1a16";
  g.font = `800 84px ${DISPLAY}`;
  g.fillText("Dear Thala,", px + 60, py + 150);
  // body (shrink to fit)
  const maxW = pw - 120;
  const top = py + 238;
  const bottom = py + ph - 250;
  let size = 36;
  let lines: string[] = [];
  for (; size >= 22; size -= 2) {
    g.font = `italic 400 ${size}px ${BODY}`;
    lines = wrap(g, body, maxW);
    if (lines.length * size * 1.45 <= bottom - top) break;
  }
  g.fillStyle = "#2b261d";
  const lh = size * 1.45;
  const maxLines = Math.floor((bottom - top) / lh);
  if (lines.length > maxLines) {
    lines = lines.slice(0, maxLines);
    lines[maxLines - 1] = lines[maxLines - 1].replace(/\s*\S*$/, "") + "…";
  }
  lines.forEach((l, i) => g.fillText(l, px + 60, top + size + i * lh));
  // sign-off: "With love — name"
  g.font = `600 32px ${BODY}`;
  g.fillStyle = "#5c5242";
  const lead = "With love — ";
  g.fillText(lead, px + 60, py + ph - 130);
  const lw = g.measureText(lead).width;
  let ns = 50;
  const fan = name || "A fan";
  do {
    g.font = `800 ${ns}px ${DISPLAY}`;
    ns -= 2;
  } while (g.measureText(fan).width > pw - 120 - lw - 170 && ns > 24);
  g.fillStyle = "#1c1a16";
  g.fillText(fan, px + 60 + lw, py + ph - 130);
  g.font = `400 22px ${BODY}`;
  g.fillStyle = "#8a7a5c";
  g.fillText("a fan's letter, written for MS Dhoni", px + 60, py + ph - 92);
  // seal
  const sx = px + pw - 140;
  const sy = py + ph - 145;
  const seal = g.createRadialGradient(sx - 20, sy - 20, 10, sx, sy, 78);
  seal.addColorStop(0, "#f0d38f");
  seal.addColorStop(1, "#b88a2e");
  g.fillStyle = seal;
  g.beginPath();
  g.arc(sx, sy, 72, 0, Math.PI * 2);
  g.fill();
  g.strokeStyle = "rgba(90,60,10,0.45)";
  g.lineWidth = 4;
  g.beginPath();
  g.arc(sx, sy, 60, 0, Math.PI * 2);
  g.stroke();
  g.fillStyle = "#5a3d08";
  g.font = `800 64px ${DISPLAY}`;
  g.textAlign = "center";
  g.fillText("7", sx, sy + 23);
  // footer
  g.textAlign = "left";
  g.font = `600 26px ${BODY}`;
  g.fillStyle = "#9a7a3a";
  g.fillText(TAGS, px + 60, py + ph - 50);
  // footer band: the creator + "Build with Miv"
  const fy = py + ph + 75;
  const R = 38;
  let tx = px;
  if (creator) {
    const side = Math.min(creator.naturalWidth, creator.naturalHeight);
    g.save();
    g.beginPath();
    g.arc(px + R, fy, R, 0, Math.PI * 2);
    g.closePath();
    g.clip();
    g.drawImage(creator, (creator.naturalWidth - side) / 2, Math.max(0, creator.naturalHeight * 0.08), side, side, px, fy - R, R * 2, R * 2);
    g.restore();
    g.strokeStyle = "#d9b56d";
    g.lineWidth = 3;
    g.beginPath();
    g.arc(px + R, fy, R, 0, Math.PI * 2);
    g.stroke();
    tx = px + R * 2 + 20;
  }
  g.textAlign = "left";
  g.fillStyle = "#f3f1ec";
  g.font = `800 34px ${DISPLAY}`;
  g.fillText("Build with Miv", tx, fy + 2);
  g.font = `400 20px ${BODY}`;
  g.fillStyle = "rgba(243,241,236,0.6)";
  g.fillText("Fan-made MS Dhoni tribute · Miv Apps", tx, fy + 32);
  g.textAlign = "right";
  g.font = `600 22px ${BODY}`;
  g.fillStyle = "#d9b56d";
  g.fillText("Written by a fan, with love", W - px, fy + 10);
  return c;
}

function wrap(g: CanvasRenderingContext2D, text: string, maxW: number) {
  const out: string[] = [];
  for (const para of text.split(/\n+/)) {
    let line = "";
    for (const w of para.split(/\s+/)) {
      const t = line ? `${line} ${w}` : w;
      if (g.measureText(t).width > maxW && line) {
        out.push(line);
        line = w;
      } else line = t;
    }
    out.push(line);
  }
  return out;
}
