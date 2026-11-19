export const NAME_MAX = 28;

export type NameCheck = { ok: true; value: string } | { ok: false; value: string; error: string };

/** Trim, collapse whitespace and validate the visitor's name. Rendered as text only, never HTML. */
export function checkName(raw: string): NameCheck {
  const value = raw.replace(/\s+/g, " ").trim();
  if (!value) return { ok: false, value, error: "Please enter your name to personalise the card." };
  if (Array.from(value).length > NAME_MAX)
    return { ok: false, value, error: `Please keep your name to ${NAME_MAX} characters or fewer.` };
  // Allow letters (any script), marks, numbers, spaces and common name punctuation.
  if (!/^[\p{L}\p{M}\p{N} .'’\-]+$/u.test(value))
    return { ok: false, value, error: "Please use letters, numbers, spaces, apostrophes, dots or hyphens." };
  return { ok: true, value };
}

/** Safe filename: ms-dhoni-tribute-[sanitised-name].png */
export function cardFilename(name: string): string {
  const slug = name
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 40);
  return `ms-dhoni-tribute-${slug || "fan"}.png`;
}
