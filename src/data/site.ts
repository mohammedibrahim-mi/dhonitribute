// Site-wide settings.

export const site = {
  title: "MS Dhoni Tribute — The Captain, The Calm, The Legacy",
  description:
    "A fan-made tribute to MS Dhoni: his achievements, iconic cricket moments, qualities and leadership lessons for life and work.",
  creditName: "Miv Apps",
  creditLine: "Built by Miv Apps",
  // Set after deployment, e.g. "https://dhoni-tribute.example.com"
  url: "",
  heroImageId: "eden-gardens-walkout",
  cardImageId: "champions-trophy-blazer",
  // The supplied card photo has a team logo and hashtag in its top corners — crop them out.
  // Set to 0 if you swap in a clean, licensed photo.
  cardImageInsetTop: 0.16,
  /**
   * Shows "To verify before launch" badges next to facts and an image-rights
   * notice in the gallery. Turn OFF only after every fact and image is cleared.
   */
  showFactStatus: true,
};

/**
 * Retirement announcement — spec §1 and §5.
 *
 * Leave this as `null` until an official statement (Dhoni, CSK or BCCI) or a
 * reliable report quoting one confirms the exact date and wording.
 * As of 18 Nov 2026, reports only said he was "unlikely" to play IPL 2027;
 * no official announcement was found.
 *
 * When confirmed, fill it in. The hero then switches to
 * "The game moves on. The legacy stays." and shows the date + source.
 */
export const retirementAnnouncement: null | {
  date: string; // e.g. "17 November 2026"
  summary: string; // e.g. "Announced his retirement from all forms of cricket."
  sourceName: string;
  sourceUrl: string;
} = null;

export const navItems = [
  { href: "#home", label: "Home" },
  { href: "#journey", label: "Journey" },
  { href: "#achievements", label: "Achievements" },
  { href: "#qualities", label: "Qualities" },
  { href: "#moments", label: "Moments" },
  { href: "#leadership", label: "Leadership" },
  { href: "#gallery", label: "Gallery" },
  { href: "#tribute-card", label: "Create Card" },
] as const;
