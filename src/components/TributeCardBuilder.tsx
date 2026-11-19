"use client";

import { useEffect, useRef, useState } from "react";
import { Download, Loader2, Sparkles } from "lucide-react";
import { imageById } from "@/data/gallery";
import { cardPhotos, cardWishes } from "@/data/cardOptions";
import { NAME_MAX, cardFilename, checkName } from "@/lib/validation";
import {
  CARD_H,
  CARD_W,
  canvasToBlob,
  cardThemes,
  ensureCardFonts,
  loadImage,
  renderCard,
  type CardTheme,
} from "@/lib/cardRenderer";
import Reveal from "./Reveal";

const PREVIEW_NAME = "Your name";

export default function TributeCardBuilder() {
  const [rawName, setRawName] = useState("");
  const [theme, setTheme] = useState<CardTheme>("classic-gold");
  const [photoId, setPhotoId] = useState(cardPhotos[0].imageId);
  const [wishId, setWishId] = useState(cardWishes[0].id);
  const [touched, setTouched] = useState(false);
  const [photo, setPhoto] = useState<HTMLImageElement | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState<{ text: string; error?: boolean }>({ text: "" });
  const [creator, setCreator] = useState<HTMLImageElement | null>(null);
  const [generated, setGenerated] = useState(false);
  const [pulse, setPulse] = useState(0);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const cache = useRef<Map<string, HTMLImageElement>>(new Map());

  const choice = cardPhotos.find((p) => p.imageId === photoId) ?? cardPhotos[0];
  const wish = cardWishes.find((w) => w.id === wishId) ?? cardWishes[0];
  const check = checkName(rawName);
  const showError = touched && !check.ok && rawName.length > 0;
  const length = Array.from(rawName.trim()).length;
  const nameForCard = check.ok ? check.value : PREVIEW_NAME;

  const cardInput = (name: string, img: HTMLImageElement) => ({
    name,
    theme,
    photo: img,
    focusX: choice.focusX,
    focusY: choice.focusY,
    insetTop: choice.insetTop,
    title: wish.title,
    message: wish.message.replace("{name}", name),
    creator,
  });

  // The creator's photo for the card footer (optional — the card still renders without it)
  useEffect(() => {
    let alive = true;
    loadImage("/images/creator.webp")
      .then((img) => alive && setCreator(img))
      .catch(() => {});
    return () => {
      alive = false;
    };
  }, []);

  // Load fonts once, and the selected photo whenever it changes (cached)
  useEffect(() => {
    let alive = true;
    (async () => {
      setLoading(true);
      try {
        await ensureCardFonts();
        const cached = cache.current.get(photoId);
        if (cached) {
          if (alive) setPhoto(cached);
          return;
        }
        const img = imageById(photoId);
        if (!img) throw new Error("This photo is not available.");
        const loaded = await loadImage(img.src);
        cache.current.set(photoId, loaded);
        if (alive) setPhoto(loaded);
      } catch (e) {
        if (alive) setStatus({ text: e instanceof Error ? e.message : "Could not prepare the card.", error: true });
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => {
      alive = false;
    };
  }, [photoId]);

  // Live preview
  useEffect(() => {
    if (!photo || !canvasRef.current) return;
    try {
      renderCard(canvasRef.current, cardInput(nameForCard, photo));
    } catch (e) {
      setStatus({ text: e instanceof Error ? e.message : "Preview failed.", error: true });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [photo, theme, wishId, nameForCard, creator]);

  const generate = () => {
    setTouched(true);
    if (!check.ok) {
      setStatus({ text: check.error, error: true });
      document.getElementById("card-name")?.focus();
      return;
    }
    setGenerated(true);
    setPulse((n) => n + 1);
    setStatus({ text: `Your card is ready, ${check.value}. Download it below the preview.` });
    if (window.innerWidth < 900) {
      document.querySelector(".card-preview")?.scrollIntoView({ behavior: "smooth", block: "center" });
    }
  };

  const download = async () => {
    setTouched(true);
    if (!check.ok) {
      setStatus({ text: check.error, error: true });
      document.getElementById("card-name")?.focus();
      return;
    }
    if (!photo) return;
    setBusy(true);
    setStatus({ text: "Creating your card…" });
    try {
      const out = document.createElement("canvas");
      renderCard(out, cardInput(check.value, photo));
      const blob = await canvasToBlob(out);
      const filename = cardFilename(check.value);

      // Inside a Claude artifact viewer, downloads go through its `downloads` capability.
      const host = (window as unknown as { claude?: { use: (n: string) => Promise<unknown> } }).claude;
      if (host?.use) {
        const dl = (await host.use("downloads")) as
          | { save: (r: { filename: string; data: Blob }) => Promise<unknown> }
          | null;
        if (dl) {
          try {
            await dl.save({ filename, data: blob });
            setStatus({ text: `Saved ${filename} (${CARD_W} × ${CARD_H} PNG). Share it anywhere.` });
          } catch (err) {
            const code = (err as { code?: string })?.code;
            setStatus(
              code === "declined"
                ? { text: "Download cancelled." }
                : { text: "This viewer couldn't save the file. Try again in a moment.", error: true }
            );
          }
          return;
        }
      }

      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      a.remove();
      setTimeout(() => URL.revokeObjectURL(url), 4000);
      setStatus({ text: `Downloaded ${filename} (${CARD_W} × ${CARD_H} PNG). Share it anywhere.` });
    } catch {
      setStatus({
        text: "Sorry, the card could not be exported in this browser. Please try another browser or take a screenshot of the preview.",
        error: true,
      });
    } finally {
      setBusy(false);
    }
  };

  return (
    <section id="tribute-card" className="section tribute" aria-labelledby="card-title">
      <div className="container">
        <Reveal>
          <p className="eyebrow">Your tribute card</p>
          <h2 id="card-title" className="section-title">
            Create your
            <br />
            <span className="gold">tribute card</span>
          </h2>
          <p className="section-lead">
            Pick a photo, pick a wish, add your name. Download a portrait card for WhatsApp, Instagram Stories and more.
          </p>
        </Reveal>

        <div className="tribute-grid">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              generate();
            }}
            noValidate
          >
            <div className="field">
              <label htmlFor="card-name">Your name</label>
              <input
                id="card-name"
                className="input"
                type="text"
                autoComplete="given-name"
                placeholder="e.g. Mahi"
                value={rawName}
                maxLength={NAME_MAX + 10}
                aria-invalid={showError}
                aria-describedby="card-name-help"
                onChange={(e) => {
                  setRawName(e.target.value);
                  setGenerated(false);
                  if (status.error) setStatus({ text: "" });
                }}
                onBlur={() => setTouched(true)}
              />
              <div className="field-help" id="card-name-help">
                <span className={showError ? "field-error" : undefined}>
                  {showError && !check.ok ? check.error : "Letters, spaces, dots, apostrophes and hyphens."}
                </span>
                <span aria-hidden="true">
                  {length}/{NAME_MAX}
                </span>
              </div>
            </div>

            <fieldset className="field">
              <legend>Photo</legend>
              <div className="photo-opts">
                {cardPhotos.map((p) => {
                  const img = imageById(p.imageId);
                  if (!img) return null;
                  return (
                    <label className="photo-opt" key={p.imageId}>
                      <input
                        type="radio"
                        name="card-photo"
                        value={p.imageId}
                        checked={photoId === p.imageId}
                        onChange={() => setPhotoId(p.imageId)}
                      />
                      <span>
                        <img
                          src={img.thumb}
                          alt=""
                          loading="lazy"
                          style={{ objectPosition: `${p.focusX * 100}% ${p.focusY * 100}%` }}
                        />
                        <em>{p.label}</em>
                      </span>
                    </label>
                  );
                })}
              </div>
            </fieldset>

            <fieldset className="field">
              <legend>Wish</legend>
              <div className="wish-opts">
                {cardWishes.map((w) => (
                  <label className="wish-opt" key={w.id}>
                    <input type="radio" name="card-wish" value={w.id} checked={wishId === w.id} onChange={() => setWishId(w.id)} />
                    <span>
                      <b>{w.label}</b>
                      <small>{w.message.replace("{name}", check.ok ? check.value : "Your name")}</small>
                    </span>
                  </label>
                ))}
              </div>
            </fieldset>

            <fieldset className="field">
              <legend>Card style</legend>
              <div className="styles">
                {(Object.keys(cardThemes) as CardTheme[]).map((key) => (
                  <label className="style-opt" key={key}>
                    <input type="radio" name="card-theme" value={key} checked={theme === key} onChange={() => setTheme(key)} />
                    <span>
                      <i style={{ background: cardThemes[key].swatch }} aria-hidden="true" />
                      {cardThemes[key].label}
                    </span>
                  </label>
                ))}
              </div>
            </fieldset>

            <div className="card-actions">
              <button className="btn btn-primary" type="submit" disabled={loading || !photo}>
                <Sparkles size={18} aria-hidden="true" />
                Generate my card
              </button>
              <button
                className="btn btn-ghost"
                type="button"
                onClick={download}
                disabled={!generated || loading || busy || !photo}
                aria-disabled={!generated}
              >
                {busy ? <Loader2 size={18} className="spin" aria-hidden="true" /> : <Download size={18} aria-hidden="true" />}
                Download
              </button>
            </div>
            <p className={`card-status ${status.error ? "is-error" : ""}`} role="status" aria-live="polite">
              {status.text}
            </p>
            <p className="privacy-note">Your card is made entirely in your browser. Your name is never uploaded or stored.</p>
            <p className="fan-note">
              Every wish is a fan-made message inspired by the leadership legacy of MS Dhoni — not an actual quote or
              message from him.
            </p>
          </form>

          <div className="card-sticky">
            <div className={`card-preview ${generated ? "is-generated" : ""}`}>
              {pulse > 0 && <span key={pulse} className="card-shine" aria-hidden="true" />}
              <canvas
                ref={canvasRef}
                width={CARD_W}
                height={CARD_H}
                role="img"
                aria-label={`Preview of your tribute card for ${nameForCard}: ${wish.title.join(" ")}, ${choice.label} photo, ${cardThemes[theme].label} style`}
              />
              {loading && (
                <div className="card-loading">
                  <Loader2 size={20} className="spin" aria-hidden="true" />
                  &nbsp;Loading photo…
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
