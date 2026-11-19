export type Quality = {
  id: string;
  number: string;
  title: string;
  summary: string;
  example: string;
  lesson: string;
  imageId: string;
};

export const qualities: Quality[] = [
  {
    id: "calm",
    number: "01",
    title: "Calm under pressure",
    summary:
      "His face rarely told you the score. When a chase got tight, the panic stayed outside his crease.",
    example:
      "In the 2011 World Cup final, with India under pressure in the chase, he walked in ahead of the in-form Yuvraj Singh and batted through to the finish.",
    lesson: "Calm is contagious. A steady leader lets the team stop reacting and start thinking about the next ball.",
    imageId: "helmet-bowed",
  },
  {
    id: "trust",
    number: "02",
    title: "Trust in people",
    summary:
      "He backed players with clear roles and let them grow into them, often before the wider world believed in them.",
    example:
      "In the 2007 T20 World Cup final, he handed the last over to the relatively inexperienced Joginder Sharma — and stood by the decision.",
    lesson: "Delegate with clarity, then give people room to deliver.",
    imageId: "thala-chinna-thala",
  },
  {
    id: "decisions",
    number: "03",
    title: "Decision-making",
    summary:
      "He read the match, weighed the options and committed. Not every call worked — but he made them, and owned them.",
    example:
      "His field placements and bowling changes were often unconventional, built on reading a batter's intent rather than following the textbook.",
    lesson: "Decide with the information you have, before delay becomes more costly than being wrong.",
    imageId: "johannesburg-2007",
  },
  {
    id: "humility",
    number: "04",
    title: "Humility",
    summary:
      "After big wins, he was known for handing the trophy to younger teammates and standing at the edge of the celebration.",
    example:
      "Trophy presentations under his captaincy often ended with the silverware in a newcomer's hands, while he stepped to the side of the photograph.",
    lesson: "Share the credit. Take the responsibility.",
    imageId: "jadeja-2023",
  },
  {
    id: "adaptability",
    number: "05",
    title: "Adaptability",
    summary:
      "Wicketkeeper, attacking batter, finisher, captain, senior player, mentor — he kept changing his role as the game and team changed.",
    example:
      "After stepping down as India's limited-overs captain in 2017, and as CSK captain in 2024, he continued to contribute as a player.",
    lesson: "Keep learning as the environment changes. Your role today won't be your role forever.",
    imageId: "training-run",
  },
  {
    id: "courage",
    number: "06",
    title: "Courage & accountability",
    summary:
      "A captain is judged on defeats as well as wins. He fronted up after the hard days too.",
    example:
      "Through heavy overseas Test defeats, he faced the questions himself and kept the focus on process rather than blame.",
    lesson: "Own the outcome, learn from it and move forward.",
    imageId: "celkon-kohli",
  },
];
