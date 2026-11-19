export type ThemeId = "classic" | "csk" | "india";

export const THEMES: { id: ThemeId; name: string; tag: string; swatch: [string, string] }[] = [
  { id: "classic", name: "Classic", tag: "Black & gold", swatch: ["#0e0e0f", "#d9b56d"] },
  { id: "csk", name: "Yellove", tag: "CSK golden yellow & white", swatch: ["#f9c80e", "#ffffff"] },
  { id: "india", name: "Men in Blue", tag: "India blue & saffron", swatch: ["#1f5fff", "#ff9a3c"] },
];

export const THEME_KEY = "dhoni-theme";
export const THEME_EVENT = "dhoni-theme-change";

export function currentTheme(): ThemeId {
  if (typeof document === "undefined") return "classic";
  const t = document.documentElement.dataset.theme as ThemeId | undefined;
  return t && THEMES.some((x) => x.id === t) ? t : "classic";
}

export function setThemeAttr(id: ThemeId) {
  const root = document.documentElement;
  if (id === "classic") delete root.dataset.theme;
  else root.dataset.theme = id;
  try {
    localStorage.setItem(THEME_KEY, id);
  } catch {}
  window.dispatchEvent(new CustomEvent(THEME_EVENT, { detail: id }));
}

/** Read a colour token (e.g. "--dark") from the current theme. */
export function cssVar(name: string, fallback = "#000000") {
  if (typeof window === "undefined") return fallback;
  const v = getComputedStyle(document.documentElement).getPropertyValue(name).trim();
  return v || fallback;
}

/** Call `fn` now and whenever the theme changes; returns an unsubscribe function. */
export function onTheme(fn: () => void) {
  fn();
  window.addEventListener(THEME_EVENT, fn);
  return () => window.removeEventListener(THEME_EVENT, fn);
}

/** Inline script for <head>: apply the saved theme before first paint (no flash). */
export const themeBootScript = `try{var t=localStorage.getItem("${THEME_KEY}");if(t==="csk"||t==="india")document.documentElement.dataset.theme=t;}catch(e){}`;
