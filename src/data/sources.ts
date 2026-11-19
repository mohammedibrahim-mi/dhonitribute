// Shared source links. Each factual item references one of these.
// "needs-check" means: well-documented public fact, but not yet confirmed
// against an official ICC / BCCI / IPL / CSK record for this site.

export type FactStatus = "verified" | "needs-check";

export const sources = {
  cricinfoProfile: {
    name: "ESPNcricinfo — MS Dhoni profile",
    url: "https://www.espncricinfo.com/cricketers/ms-dhoni-28081",
  },
  icc: {
    name: "ICC — official site",
    url: "https://www.icc-cricket.com/",
  },
  bcci: {
    name: "BCCI — official site",
    url: "https://www.bcci.tv/",
  },
  ipl: {
    name: "IPL — Chennai Super Kings",
    url: "https://www.iplt20.com/teams/chennai-super-kings",
  },
  retirement2020: {
    name: "Scroll.in — Dhoni announces international retirement (15 Aug 2020), incl. BCCI confirmation",
    url: "https://scroll.in/field/970453/live-updates-tributes-pour-in-as-ms-dhoni-announces-retirement-from-international-cricket",
  },
  padmaAwards: {
    name: "Padma Awards — Government of India",
    url: "https://padmaawards.gov.in/",
  },
  emaPartners: {
    name: "EMA Partners — 11 Leadership Lessons from Indian Cricket Icon MS Dhoni",
    url: "https://www.ema-partners.com/insights/11-leadership-lessons-indian-cricket-icon-ms-dhoni",
  },
  crickatha: {
    name: "Crickatha — Dhoni profile",
    url: "https://crickatha.com/dhoni/",
  },
  book: {
    name: "Sfurti Sahare, Think and Win Like Dhoni (Jaico Publishing House, 2016)",
    url: "https://www.jaicobooks.com/",
  },
  medium: {
    name: "Medium — Leadership Lessons from MS Dhoni: Applying Cricketing Wisdom to the Professional World",
    url: "https://sharvishi9118.medium.com/leadership-lessons-from-ms-dhoni-applying-cricketing-wisdom-to-the-professional-world-70a68ca77aa1",
  },
} as const;

export type SourceKey = keyof typeof sources;
