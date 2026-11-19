// Client-side Canvas renderer for the 1080 × 1350 tribute card (spec §12).
// The name is drawn with fillText — it is never interpreted as HTML.

export const CARD_W = 1080;
export const CARD_H = 1350;

export type CardTheme = "classic-gold" | "india-blue" | "stadium-night";

export const cardThemes: Record<
  CardTheme,
  { label: string; bgTop: string; bgBottom: string; accent: string; beam: string; swatch: string }
> = {
  "classic-gold": {
    label: "Classic Gold",
    bgTop: "#0b1220",
    bgBottom: "#05070d",
    accent: "#d9b56d",
    beam: "rgba(255, 226, 160, 0.10)",
    swatch: "linear-gradient(135deg,#0b1220,#d9b56d)",
  },
  "india-blue": {
    label: "India Blue",
    bgTop: "#0a2a55",
    bgBottom: "#050b18",
    accent: "#6fb2ff",
    beam: "rgba(140, 195, 255, 0.12)",
    swatch: "linear-gradient(135deg,#0a2a55,#1976d2)",
  },
  "stadium-night": {
    label: "Stadium Night",
    bgTop: "#121a2b",
    bgBottom: "#020306",
    accent: "#f4d35e",
    beam: "rgba(255, 255, 255, 0.09)",
    swatch: "linear-gradient(135deg,#020306,#f4d35e)",
  },
};

export type CardInput = {
  name: string;
  /** Two-line title: [white, accent] */
  title?: [string, string];
  /** Greeting with the name already filled in */
  message?: string;
  theme: CardTheme;
  photo: HTMLImageElement;
  /** 0–1 focal point of the photo, so the face isn't cropped */
  focusX?: number;
  focusY?: number;
  /** Fraction of the photo's top edge to exclude (e.g. to crop out logos/watermarks). */
  insetTop?: number;
  /** Small round creator photo shown beside "Built by Miv Apps". */
  creator?: HTMLImageElement | null;
};

const DISPLAY = '"Bebas Neue", "Oswald", Impact, sans-serif';
const BODY = '"Inter", system-ui, sans-serif';

export function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    // Same-origin images keep the canvas untainted. External hosts must send CORS headers.
    img.crossOrigin = "anonymous";
    img.decoding = "async";
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error("The card photo could not be loaded."));
    img.src = src;
  });
}

export async function ensureCardFonts(): Promise<void> {
  if (!("fonts" in document)) return;
  try {
    await Promise.all([
      document.fonts.load(`80px ${DISPLAY}`),
      document.fonts.load(`600 40px ${BODY}`),
      document.fonts.load(`400 30px ${BODY}`),
      document.fonts.load(`italic 400 24px ${BODY}`),
    ]);
  } catch {
    /* fall back to system fonts */
  }
}

function coverRect(img: HTMLImageElement, w: number, h: number, fx = 0.5, fy = 0.35, insetTop = 0) {
  const top = img.naturalHeight * insetTop;
  const availH = img.naturalHeight - top;
  const scale = Math.max(w / img.naturalWidth, h / availH);
  const sw = w / scale;
  const sh = h / scale;
  const sx = Math.min(Math.max(0, img.naturalWidth * fx - sw / 2), img.naturalWidth - sw);
  const sy = Math.min(Math.max(top, img.naturalHeight * fy - sh / 2), img.naturalHeight - sh);
  return { sx, sy, sw, sh };
}

/** Wrap text into lines that fit maxWidth. Falls back to character breaks for long words. */
function wrap(ctx: CanvasRenderingContext2D, text: string, maxWidth: number): string[] {
  const words = text.split(" ");
  const lines: string[] = [];
  let line = "";
  for (const word of words) {
    const test = line ? `${line} ${word}` : word;
    if (ctx.measureText(test).width <= maxWidth) {
      line = test;
      continue;
    }
    if (line) lines.push(line);
    if (ctx.measureText(word).width <= maxWidth) {
      line = word;
    } else {
      let chunk = "";
      for (const ch of Array.from(word)) {
        if (ctx.measureText(chunk + ch).width > maxWidth) {
          lines.push(chunk);
          chunk = ch;
        } else chunk += ch;
      }
      line = chunk;
    }
  }
  if (line) lines.push(line);
  return lines;
}

export function renderCard(canvas: HTMLCanvasElement, input: CardInput): void {
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas is not supported in this browser.");
  canvas.width = CARD_W;
  canvas.height = CARD_H;
  const t = cardThemes[input.theme];
  const pad = 84;

  // Background
  const bg = ctx.createLinearGradient(0, 0, 0, CARD_H);
  bg.addColorStop(0, t.bgTop);
  bg.addColorStop(1, t.bgBottom);
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, CARD_W, CARD_H);

  // Photo (top portion)
  const photoH = 760;
  const { sx, sy, sw, sh } = coverRect(input.photo, CARD_W, photoH, input.focusX, input.focusY, input.insetTop);
  ctx.drawImage(input.photo, sx, sy, sw, sh, 0, 0, CARD_W, photoH);

  // Light beams
  ctx.save();
  ctx.globalCompositeOperation = "screen";
  for (const [x, a] of [
    [180, -0.32],
    [900, 0.32],
  ] as const) {
    ctx.save();
    ctx.translate(x, -40);
    ctx.rotate(a);
    const beam = ctx.createLinearGradient(0, 0, 0, 900);
    beam.addColorStop(0, t.beam);
    beam.addColorStop(1, "rgba(0,0,0,0)");
    ctx.fillStyle = beam;
    ctx.beginPath();
    ctx.moveTo(-30, 0);
    ctx.lineTo(30, 0);
    ctx.lineTo(180, 900);
    ctx.lineTo(-180, 900);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
  }
  ctx.restore();

  // Fade photo into background
  const fade = ctx.createLinearGradient(0, photoH * 0.35, 0, photoH + 10);
  fade.addColorStop(0, "rgba(0,0,0,0)");
  fade.addColorStop(1, t.bgBottom);
  ctx.fillStyle = fade;
  ctx.fillRect(0, 0, CARD_W, photoH + 10);
  const topFade = ctx.createLinearGradient(0, 0, 0, 220);
  topFade.addColorStop(0, "rgba(5,7,13,0.75)");
  topFade.addColorStop(1, "rgba(5,7,13,0)");
  ctx.fillStyle = topFade;
  ctx.fillRect(0, 0, CARD_W, 220);

  // Top label
  ctx.textBaseline = "alphabetic";
  ctx.fillStyle = t.accent;
  ctx.font = `600 26px ${BODY}`;
  ctx.letterSpacing = "6px";
  ctx.fillText("A FAN-MADE TRIBUTE", pad, 104);
  ctx.letterSpacing = "0px";

  // Main title
  ctx.fillStyle = "#F5F7FA";
  ctx.font = `128px ${DISPLAY}`;
  let y = 690;
  const [t1, t2] = input.title ?? ["A LEGACY THAT", "INSPIRES"];
  ctx.fillText(t1, pad, y);
  y += 118;
  ctx.fillStyle = t.accent;
  ctx.fillText(t2, pad, y);

  // Divider
  y += 40;
  ctx.fillStyle = t.accent;
  ctx.fillRect(pad, y, 120, 4);

  // Personal greeting (name drawn as plain text)
  y += 76;
  ctx.fillStyle = "#F5F7FA";
  let size = 50;
  const greeting = input.message ?? `${input.name}, keep leading with courage, humility and belief.`;
  let lines: string[];
  do {
    ctx.font = `600 ${size}px ${BODY}`;
    lines = wrap(ctx, greeting, CARD_W - pad * 2);
    if (lines.length <= 3) break;
    size -= 4;
  } while (size > 32);
  const lh = size * 1.22;
  for (const line of lines.slice(0, 4)) {
    ctx.fillText(line, pad, y);
    y += lh;
  }

  // Tribute line
  y += 18;
  ctx.fillStyle = "#AAB4C3";
  ctx.font = `400 32px ${BODY}`;
  for (const line of wrap(ctx, "Thank you, MS Dhoni, for the memories and the lessons.", CARD_W - pad * 2)) {
    ctx.fillText(line, pad, y);
    y += 42;
  }

  // Fan-made note (no quotation attributed to Dhoni)
  y = Math.min(Math.max(y + 22, 1176), 1196);
  ctx.fillStyle = "rgba(255,255,255,0.10)";
  ctx.fillRect(pad, y - 34, CARD_W - pad * 2, 1);
  ctx.fillStyle = "#AAB4C3";
  ctx.font = `italic 400 22px ${BODY}`;
  ctx.fillText("A fan-made wish inspired by his legacy. Not a quote or message from MS Dhoni.", pad, y);

  // Footer: creator avatar + "Built by Miv Apps"
  const R = 36;
  const cy = CARD_H - 82;
  let tx = pad;
  if (input.creator) {
    const cx = pad + R;
    ctx.save();
    ctx.beginPath();
    ctx.arc(cx, cy, R, 0, Math.PI * 2);
    ctx.closePath();
    ctx.clip();
    const c = input.creator;
    const side = Math.min(c.naturalWidth, c.naturalHeight);
    // square crop biased to the top (face)
    ctx.drawImage(c, (c.naturalWidth - side) / 2, Math.max(0, c.naturalHeight * 0.08), side, side, cx - R, cy - R, R * 2, R * 2);
    ctx.restore();
    ctx.strokeStyle = t.accent;
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(cx, cy, R + 2, 0, Math.PI * 2);
    ctx.stroke();
    tx = pad + R * 2 + 22;
  }
  ctx.fillStyle = "#F5F7FA";
  ctx.font = `600 28px ${BODY}`;
  ctx.fillText("Built by Miv Apps", tx, cy - 2);
  ctx.fillStyle = "#AAB4C3";
  ctx.font = `400 20px ${BODY}`;
  ctx.fillText("A fan-made tribute", tx, cy + 28);
  ctx.fillStyle = t.accent;
  ctx.font = `44px ${DISPLAY}`;
  ctx.textAlign = "right";
  ctx.fillText("#7", CARD_W - pad, cy + 18);
  ctx.textAlign = "left";
}

export function canvasToBlob(canvas: HTMLCanvasElement): Promise<Blob> {
  return new Promise((resolve, reject) => {
    try {
      canvas.toBlob((blob) => (blob ? resolve(blob) : reject(new Error("Export failed."))), "image/png");
    } catch (e) {
      reject(e instanceof Error ? e : new Error("Export failed."));
    }
  });
}
