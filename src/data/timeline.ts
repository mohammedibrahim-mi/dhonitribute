import type { FactStatus, SourceKey } from "./sources";

export type TimelineKind = "debut" | "icc" | "captaincy" | "ipl" | "retirement" | "honour" | "milestone";

export type TimelineItem = {
  year: string;
  date: string;
  title: string;
  description: string;
  detail: string;
  kind: TimelineKind;
  imageId?: string;
  source: SourceKey;
  status: FactStatus;
};

// International cricket, Test cricket, captaincy and IPL are kept distinct (spec §6).
export const timeline: TimelineItem[] = [
  {
    year: "2004",
    date: "December 2004",
    title: "International debut",
    description: "Made his ODI debut for India against Bangladesh in Chittagong.",
    detail:
      "A wicketkeeper-batter from Ranchi with long hair and a fearless swing. The start was quiet — the arrival was not far away.",
    kind: "debut",
    imageId: "long-hair-ranchi",
    source: "cricinfoProfile",
    status: "needs-check",
  },
  {
    year: "2005",
    date: "April 2005",
    title: "Announcing himself",
    description: "Struck a maiden ODI hundred, 148 against Pakistan in Visakhapatnam.",
    detail:
      "Promoted up the order, he took the attack apart. India had found a batter who could change a game in a handful of overs.",
    kind: "milestone",
    source: "cricinfoProfile",
    status: "needs-check",
  },
  {
    year: "2007",
    date: "24 September 2007",
    title: "T20 World Cup champions",
    description: "In his first tournament as captain, led India to the inaugural ICC Men's T20 World Cup title in Johannesburg.",
    detail:
      "A young side, a new format and a captain who trusted instinct. The final over went to Joginder Sharma — a call that defined his style.",
    kind: "icc",
    imageId: "johannesburg-2007",
    source: "icc",
    status: "needs-check",
  },
  {
    year: "2009",
    date: "December 2009",
    title: "No. 1 in Tests",
    description: "India rose to the top of the ICC Test rankings under his captaincy.",
    detail:
      "The white-ball captain proved he could lead in whites too. India held the ICC Test mace as the world's top-ranked Test side.",
    kind: "captaincy",
    imageId: "test-mace-whites",
    source: "icc",
    status: "needs-check",
  },
  {
    year: "2010",
    date: "April & June 2010",
    title: "First IPL title, then the Asia Cup",
    description: "Captained Chennai Super Kings to their first IPL title, then led India to the Asia Cup in Sri Lanka.",
    detail:
      "Two trophies in two months — one in yellow, one in blue. The habit of winning was forming on both fronts.",
    kind: "ipl",
    imageId: "first-ipl-crown",
    source: "ipl",
    status: "needs-check",
  },
  {
    year: "2011",
    date: "2 April 2011",
    title: "World Cup champions",
    description: "India won the ICC Cricket World Cup at the Wankhede Stadium in Mumbai; Dhoni finished the final with a six.",
    detail:
      "He promoted himself up the order in the final and stayed to the end. The winning six became one of Indian cricket's most replayed moments.",
    kind: "icc",
    imageId: "world-cup-2011-closeup",
    source: "icc",
    status: "needs-check",
  },
  {
    year: "2013",
    date: "23 June 2013",
    title: "Champions Trophy",
    description: "Led India to the ICC Champions Trophy title at Edgbaston.",
    detail:
      "A rain-shortened final, a young side and tight margins. With this win, his India teams had won the T20 World Cup, the World Cup and the Champions Trophy.",
    kind: "icc",
    imageId: "champions-trophy-blazer",
    source: "icc",
    status: "needs-check",
  },
  {
    year: "2014",
    date: "30 December 2014",
    title: "Retired from Test cricket",
    description: "Announced his retirement from Test cricket during India's tour of Australia.",
    detail:
      "He stepped away from Tests mid-series, without ceremony. He continued to play ODIs and T20Is for India.",
    kind: "retirement",
    source: "cricinfoProfile",
    status: "needs-check",
  },
  {
    year: "2017",
    date: "January 2017",
    title: "Stepped down as limited-overs captain",
    description: "Gave up the ODI and T20I captaincy and continued to play for India under Virat Kohli.",
    detail:
      "A rare act in sport: a successful captain choosing to hand over and keep playing as a senior member of the team.",
    kind: "captaincy",
    source: "bcci",
    status: "needs-check",
  },
  {
    year: "2018",
    date: "2018",
    title: "CSK's comeback title & Padma Bhushan",
    description: "Led CSK to the IPL title in their first season back, and received the Padma Bhushan, India's third-highest civilian award.",
    detail:
      "The franchise returned after a two-year absence and won it all. The same year, the nation honoured him at Rashtrapati Bhavan.",
    kind: "ipl",
    imageId: "padma-bhushan",
    source: "padmaAwards",
    status: "needs-check",
  },
  {
    year: "2020",
    date: "15 August 2020",
    title: "Retired from international cricket",
    description: "Announced his retirement from international cricket on Instagram, effective from 19:29 IST. The BCCI confirmed it was from international cricket only.",
    detail:
      "No farewell match and no press conference — a short video and a single line. He continued to play in the IPL for Chennai Super Kings.",
    kind: "retirement",
    source: "retirement2020",
    status: "verified",
  },
  {
    year: "2021–23",
    date: "2021 and 2023",
    title: "IPL titles four and five",
    description: "Captained CSK to IPL titles in 2021 and 2023.",
    detail:
      "After a difficult 2020 season, CSK came back to win in Dubai in 2021. In 2023, Ravindra Jadeja hit the winning runs in the final.",
    kind: "ipl",
    imageId: "jadeja-2023",
    source: "ipl",
    status: "needs-check",
  },
  {
    year: "2024",
    date: "March 2024",
    title: "Handed over the CSK captaincy",
    description: "Passed the CSK captaincy to Ruturaj Gaikwad and continued as a player.",
    detail:
      "Building a successor and stepping back — leadership as a transition, not a title.",
    kind: "captaincy",
    source: "ipl",
    status: "needs-check",
  },
];
