import type { FactStatus, SourceKey } from "./sources";

export type Achievement = {
  id: string;
  title: string;
  year: string;
  description: string;
  category: "international" | "ipl" | "honour";
  trophy: "cup" | "tall" | "mace" | "star" | "medal";
  source: SourceKey;
  status: FactStatus;
};

export const achievements: Achievement[] = [
  // International captaincy
  {
    id: "t20wc-2007",
    title: "ICC Men's T20 World Cup",
    year: "2007",
    description: "Won the inaugural edition in South Africa in his first tournament as India captain.",
    category: "international",
    trophy: "tall",
    source: "icc",
    status: "needs-check",
  },
  {
    id: "asia-2010",
    title: "Asia Cup",
    year: "2010",
    description: "India won the Asia Cup in Sri Lanka under his captaincy.",
    category: "international",
    trophy: "cup",
    source: "cricinfoProfile",
    status: "needs-check",
  },
  {
    id: "wc-2011",
    title: "ICC Cricket World Cup",
    year: "2011",
    description: "India's first ODI World Cup title since 1983, won at home in Mumbai.",
    category: "international",
    trophy: "cup",
    source: "icc",
    status: "needs-check",
  },
  {
    id: "ct-2013",
    title: "ICC Champions Trophy",
    year: "2013",
    description: "Won in England with a young side, unbeaten through the tournament.",
    category: "international",
    trophy: "tall",
    source: "icc",
    status: "needs-check",
  },
  {
    id: "asia-2016",
    title: "Asia Cup",
    year: "2016",
    description: "India won the T20-format Asia Cup in Bangladesh under his captaincy.",
    category: "international",
    trophy: "cup",
    source: "cricinfoProfile",
    status: "needs-check",
  },
  {
    id: "test-no1",
    title: "No. 1 Test ranking",
    year: "2009",
    description: "India became the top-ranked Test side and held the ICC Test mace.",
    category: "international",
    trophy: "mace",
    source: "icc",
    status: "needs-check",
  },
  // Chennai Super Kings
  {
    id: "ipl-titles",
    title: "IPL champions (5 titles)",
    year: "2010–2023",
    description: "Five IPL titles as Chennai Super Kings captain: 2010, 2011, 2018, 2021 and 2023.",
    category: "ipl",
    trophy: "cup",
    source: "ipl",
    status: "needs-check",
  },
  {
    id: "clt20",
    title: "Champions League T20 (2 titles)",
    year: "2010 & 2014",
    description: "CSK won the Champions League T20 twice under his captaincy, in 2010 and 2014.",
    category: "ipl",
    trophy: "tall",
    source: "cricinfoProfile",
    status: "needs-check",
  },
  // Honours
  {
    id: "khel-ratna",
    title: "Rajiv Gandhi Khel Ratna",
    year: "2008",
    description: "India's highest sporting honour (now the Major Dhyan Chand Khel Ratna).",
    category: "honour",
    trophy: "star",
    source: "cricinfoProfile",
    status: "needs-check",
  },
  {
    id: "padma-shri",
    title: "Padma Shri",
    year: "2009",
    description: "India's fourth-highest civilian award.",
    category: "honour",
    trophy: "medal",
    source: "padmaAwards",
    status: "needs-check",
  },
  {
    id: "padma-bhushan",
    title: "Padma Bhushan",
    year: "2018",
    description: "India's third-highest civilian award, received in his Territorial Army uniform.",
    category: "honour",
    trophy: "medal",
    source: "padmaAwards",
    status: "needs-check",
  },
];

// Headline figures for the count-up row. Final values are rendered in the HTML.
export const highlightStats = [
  { value: 3, label: "ICC titles as captain", note: "2007 · 2011 · 2013" },
  { value: 5, label: "IPL titles with CSK", note: "as captain" },
  { value: 2, label: "Asia Cups", note: "2010 · 2016" },
  { value: 2, label: "Champions League T20s", note: "2010 · 2014" },
];
