// "The Journey" — an interactive career timeline. Each milestone is a chapter.
// Facts: public scorecards and reports (checked Nov 2026). "Fan note" lines are written by the
// makers of this tribute in their own voice — they are not quotes from MS Dhoni or any named person.
// Media: each chapter uses a photo from the site's collection; the "moment" film is a motion
// sequence built from that photo, with synthesized stadium sound. Add a `video` (mp4/webm you
// have the rights to) and it will be played instead.

export type JourneyStat = { value: string; label: string };
export type JourneyChapter = {
  id: string;
  year: string;
  moment: string; // what happened
  experience: string; // the feeling — chapter headline
  story: string;
  stats: JourneyStat[];
  fanNote: string;
  imageId: string;
  beats: [string, string, string]; // captions for the "play the moment" film
  sound: { swell: number; crack?: boolean }; // synthesized crowd intensity 0..1, bat crack on the last beat
  video?: string;
};

export const journey: JourneyChapter[] = [
  {
    id: "2004",
    year: "2004",
    moment: "International debut",
    experience: "The beginning",
    story:
      "A long-haired wicketkeeper from Ranchi made his ODI debut against Bangladesh in Chittagong — and was run out without scoring. Four months later he hit 148 against Pakistan and never looked back.",
    stats: [
      { value: "0", label: "Runs on ODI debut, 23 Dec 2004" },
      { value: "148", label: "vs Pakistan, April 2005" },
      { value: "Ranchi", label: "Where it all began" },
    ],
    fanNote: "We didn't know his name yet. We'd never forget it.",
    imageId: "long-hair-ranchi",
    beats: ["23 December 2004. Chittagong.", "A long-haired keeper from Ranchi walks out.", "Run out for a duck. Every story starts somewhere."],
    sound: { swell: 0.18 },
  },
  {
    id: "2007",
    year: "2007",
    moment: "T20 World Cup",
    experience: "The rise of a leader",
    story:
      "In his first tournament as captain, a young side reached the final against Pakistan in Johannesburg. With 13 needed off the last over, he handed the ball to Joginder Sharma. Misbah's scoop found Sreesanth's hands. India won the first T20 World Cup.",
    stats: [
      { value: "5 runs", label: "Winning margin in the final" },
      { value: "1st", label: "Ever T20 World Cup" },
      { value: "13", label: "Pakistan needed off the last over" },
    ],
    fanNote: "That night we learned what calm under pressure looks like.",
    imageId: "johannesburg-2007",
    beats: ["24 September 2007. Johannesburg.", "13 needed off the last over. The ball goes to Joginder.", "Misbah scoops. Sreesanth holds on. Champions."],
    sound: { swell: 0.5, crack: true },
  },
  {
    id: "2008",
    year: "2008",
    moment: "Chennai Super Kings era",
    experience: "Yellow becomes home",
    story:
      "At the first IPL auction, Chennai bought him for US$1.5 million — the costliest player that day. Chennai became home, Thala became his name, and five IPL titles followed.",
    stats: [
      { value: "$1.5M", label: "Auction price, 2008" },
      { value: "5", label: "IPL titles as captain" },
      { value: "#7", label: "The shirt a city wears" },
    ],
    fanNote: "He came from Ranchi. Chennai made him family.",
    imageId: "full-house-shot",
    beats: ["February 2008. The first IPL auction.", "Chennai bid US$1.5 million.", "Yellow became home."],
    sound: { swell: 0.35 },
  },
  {
    id: "2011",
    year: "2011",
    moment: "World Cup victory",
    experience: "The shot that stopped time",
    story:
      "In the final at the Wankhede, he promoted himself ahead of an in-form Yuvraj Singh, made an unbeaten 91, and finished it with a six off Nuwan Kulasekara. India's first World Cup in 28 years.",
    stats: [
      { value: "91*", label: "Off 79 balls in the final" },
      { value: "28", label: "Years since 1983" },
      { value: "PoM", label: "Player of the Match, final" },
    ],
    fanNote: "Everyone remembers where they were when the ball landed.",
    imageId: "final-six-wide",
    beats: ["2 April 2011. Wankhede, Mumbai.", "Four needed. Kulasekara to Dhoni.", "Six. Twenty-eight years end in one swing."],
    sound: { swell: 0.7, crack: true },
  },
  {
    id: "2013",
    year: "2013",
    moment: "Champions Trophy",
    experience: "The only captain to win all 3 ICC white-ball trophies",
    story:
      "Rain cut the final at Edgbaston to 20 overs a side. India defended 129 and beat England by five runs — completing the set: T20 World Cup, ODI World Cup and Champions Trophy.",
    stats: [
      { value: "3 / 3", label: "ICC white-ball titles" },
      { value: "5 runs", label: "Margin in the final" },
      { value: "20 overs", label: "Rain-shortened final" },
    ],
    fanNote: "Three trophies. One captain. A set no one else has completed.",
    imageId: "champions-trophy-blazer",
    beats: ["23 June 2013. Edgbaston.", "Rain cuts the final to 20 overs.", "India win by five runs. The set is complete."],
    sound: { swell: 0.5, crack: true },
  },
  {
    id: "2018",
    year: "2018",
    moment: "The comeback year",
    experience: "The roar returns",
    story:
      "Back after a two-year suspension, Chennai's experienced side — mocked as the 'Dad's Army' — won the IPL. That September, at the Asia Cup, he led India once more against Afghanistan: his 200th ODI as captain.",
    stats: [
      { value: "IPL", label: "Title on return from suspension" },
      { value: "200", label: "ODIs as India captain" },
      { value: "Asia Cup", label: "India champions, 2018" },
    ],
    fanNote: "Two years away. One season to remind everyone.",
    imageId: "sparks-walkout",
    beats: ["2018. Chennai is back.", "They called them the 'Dad's Army'.", "Champions again. The roar returns."],
    sound: { swell: 0.6, crack: true },
  },
  {
    id: "2023",
    year: "2023",
    moment: "IPL comeback victory",
    experience: "Impossible? Not for Dhoni.",
    story:
      "A year after finishing ninth, Chennai reached the final in Ahmedabad. Rain pushed it to a reserve day; ten were needed off the last two balls. Ravindra Jadeja hit a six and a four — title number five.",
    stats: [
      { value: "5th", label: "IPL title" },
      { value: "9th → 1st", label: "From 2022 to 2023" },
      { value: "6, 4", label: "Jadeja's last two balls" },
    ],
    fanNote: "We'd stopped believing. He never did.",
    imageId: "jadeja-2023",
    beats: ["May 2023. Ahmedabad. Reserve day.", "Ten needed off the last two balls.", "Six. Four. Title number five."],
    sound: { swell: 0.7, crack: true },
  },
  {
    id: "final",
    year: "2025/26",
    moment: "The final chapter",
    experience: "The legacy lives forever",
    story:
      "Retained by Chennai as an uncapped player, he led the side again in 2025. In 2026 he didn't play a game, but after Chennai's last home match he walked a lap of honour at Chepauk. No goodbye has been announced — and none is needed.",
    stats: [
      { value: "16", label: "Seasons played in yellow (2008–25)" },
      { value: "5", label: "IPL titles" },
      { value: "∞", label: "Memories" },
    ],
    fanNote: "However this chapter ends, we were lucky to watch it.",
    imageId: "number-seven-wave",
    beats: ["18 May 2026. Chepauk.", "One slow lap. A stadium on its feet.", "Whatever comes next, the legacy stays."],
    sound: { swell: 0.45 },
  },
];
