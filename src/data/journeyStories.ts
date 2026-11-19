// The three-part journey story (text by the site owner). One wording change for accuracy:
// in Journey 02 the 2013 Champions Trophy is told as a flashback ("Back in 2013 … had led"),
// because CSK's suspension came later (2016–17). `em` beats are the short, punchy lines.

export type StoryBeat = { text: string; em?: boolean };
export type JourneyStory = {
  id: string;
  number: string;
  title: string;
  era: string;
  bg: string; // gallery id, used as a cinematic background
  beats: StoryBeat[];
  closing: string;
};

export const journeyStories: JourneyStory[] = [
  {
    id: "rise",
    number: "01",
    title: "From Ranchi to the world stage",
    era: "2004 – 2011 · The rise of a legend",
    bg: "final-six-front",
    beats: [
      {
        text: "It began in Ranchi, far away from the spotlight, where a young boy dreamed of making it big. No superstar background. No shortcuts. Just talent, determination, and a belief that he belonged on the biggest stage.",
      },
      {
        text: "When he stepped into international cricket, he was different. Fearless, unpredictable, and unapologetically himself. His long hair, explosive batting, and ability to finish games soon made the world take notice.",
      },
      {
        text: "In 2007, a young captain was handed the responsibility of leading India in the inaugural T20 World Cup. Few expected what would happen next. He took a young team, trusted his instincts, and brought India a world title that changed the future of Indian cricket.",
      },
      { text: "But the dream was far from over.", em: true },
      {
        text: "In 2011, on home soil, with a billion hearts waiting, he walked into the biggest moment of his career. The pressure was immense. The nation was waiting. And when the ball disappeared into the Mumbai night, history was made.",
      },
      { text: "The captain finished the game himself. India lifted the World Cup after 28 years.", em: true },
      {
        text: "From the streets of Ranchi to the top of the world, he didn't just become a cricketer. He became a memory that an entire generation would carry forever.",
      },
    ],
    closing: "He didn't chase greatness. He became it.",
  },
  {
    id: "test",
    number: "02",
    title: "When the world turned, he didn't",
    era: "2013 – 2017 · The test of a leader",
    bg: "helmet-bowed",
    beats: [
      {
        text: "He had built a dynasty in Chennai. A team that wasn't just a franchise, but a family. A city that had adopted him as its own. The yellow jersey had become a symbol of dominance, loyalty, and belief.",
      },
      { text: "Then everything stopped.", em: true },
      {
        text: "Chennai Super Kings were suspended. Two years away from the IPL. A team that had ruled the tournament was suddenly forced to watch from the sidelines. The yellow disappeared from the battlefield, and the future was uncertain.",
      },
      {
        text: "But a leader is not defined by the trophies he lifts. He is defined by the way he stands when there are no trophies to lift.",
        em: true,
      },
      {
        text: "While the world questioned, Dhoni continued to carry India. Back in 2013, under immense pressure in England, he had led India to the Champions Trophy, completing an extraordinary collection of ICC white-ball titles — the T20 World Cup, the ODI World Cup, and the Champions Trophy.",
      },
      { text: "Three trophies. Three different battles. One captain.", em: true },
      {
        text: "The CSK chapter was put on hold, but the legacy of its captain never faded. He didn't chase sympathy. He didn't make noise. He simply kept going.",
      },
      { text: "Sometimes, the strongest comeback begins in silence.", em: true },
    ],
    closing: "They took away the jersey. They could never take away the leader.",
  },
  {
    id: "return",
    number: "03",
    title: "The return of Thala",
    era: "2018 – 2023 · The comeback that became history",
    bg: "sparks-walkout",
    beats: [
      { text: "Two years away. Two years of waiting. Then, in 2018, the yellow army came home.", em: true },
      {
        text: "Chennai Super Kings returned to the IPL, and Dhoni returned to the place where he belonged. People wondered if the old magic was still there. Whether the team could reclaim its throne. Whether the captain still had one more chapter left.",
      },
      { text: "He answered in the only way he knew. With a trophy.", em: true },
      {
        text: "CSK won the IPL in their comeback season, turning their return into one of the most unforgettable stories in the tournament's history. Yellow was back. The whistles were back. Thala was back.",
      },
      { text: "But he wasn't finished.", em: true },
      {
        text: "In 2021, when doubts once again surrounded the team, he led Chennai to another championship. And in 2023, through injuries, age, pressure, and the weight of an entire season, he took them to one more title.",
      },
      { text: "Three championships after the return. 2018. 2021. 2023.", em: true },
      {
        text: "At 41, he became the oldest captain to lift the IPL trophy, proving that greatness isn't measured by speed, age, or statistics. It's measured by the ability to rise when the moment demands it.",
      },
      {
        text: "He didn't return to prove he was still the same. He returned to prove that legends don't need to be the same to remain legendary.",
      },
    ],
    closing: "They thought it was the end of the story. Thala turned it into another beginning. 💛",
  },
];
