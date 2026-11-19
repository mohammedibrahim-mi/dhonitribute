// Interpretations of public leadership examples — NOT direct quotations from Dhoni.
// Research leads: EMA Partners, Crickatha and Medium articles listed in sources.ts.
// Copy is original and must not reproduce those articles.

export type LessonIcon = "field" | "armband" | "scoreboard" | "stumps" | "ballPath" | "pitch";

export type LeadershipLesson = {
  number: number;
  title: string;
  cricketContext: string;
  workplaceApplication: string;
  action: string;
  icon: LessonIcon;
};

export const leadershipLessons: LeadershipLesson[] = [
  {
    number: 1,
    title: "Stay calm when pressure rises",
    cricketContext: "High-stakes finishes and close matches.",
    workplaceApplication:
      "Pause, identify the real problem, separate facts from noise and communicate the next action clearly.",
    action: "Before a difficult meeting, write down the decision that must be made and the evidence needed.",
    icon: "scoreboard",
  },
  {
    number: 2,
    title: "Trust your team",
    cricketContext: "Backing players with defined roles and opportunities.",
    workplaceApplication: "Give capable teammates ownership instead of micromanaging every task.",
    action: "Delegate an outcome, explain constraints and agree on check-in points.",
    icon: "field",
  },
  {
    number: 3,
    title: "Make decisions with the information available",
    cricketContext: "Field placements, bowling changes and reading match conditions.",
    workplaceApplication:
      "Gather enough evidence, understand trade-offs and decide before delay becomes more costly.",
    action: "Record the options, risks and decision owner for an important project choice.",
    icon: "pitch",
  },
  {
    number: 4,
    title: "Take responsibility",
    cricketContext: "Captains are accountable for team direction and difficult moments.",
    workplaceApplication: "Own mistakes, explain what changed and focus on corrective action rather than blame.",
    action: "In a project review, state what you could have done differently.",
    icon: "armband",
  },
  {
    number: 5,
    title: "Put the team before personal recognition",
    cricketContext: "Dhoni's public image is often associated with sharing credit.",
    workplaceApplication: "Celebrate contributors and make team success visible.",
    action: "Name the people and work behind a successful delivery.",
    icon: "field",
  },
  {
    number: 6,
    title: "Adapt to changing conditions",
    cricketContext: "Different formats, match situations and roles require different approaches.",
    workplaceApplication: "Revisit plans when customer needs, technology or constraints change.",
    action: "Review assumptions at every project milestone.",
    icon: "ballPath",
  },
  {
    number: 7,
    title: "Give people clarity",
    cricketContext: "Players perform better when they understand their role and situation.",
    workplaceApplication: "Define ownership, expected outcomes and decision boundaries.",
    action: "Give every project task one directly responsible owner.",
    icon: "armband",
  },
  {
    number: 8,
    title: "Learn from setbacks",
    cricketContext: "A long career includes losses, criticism and changing form.",
    workplaceApplication: "Turn failure into a review of process, preparation and assumptions.",
    action: "Run a blameless retrospective with one measurable improvement.",
    icon: "stumps",
  },
  {
    number: 9,
    title: "Lead by example",
    cricketContext: "Preparation, discipline and commitment shape team standards.",
    workplaceApplication: "Demonstrate the behaviours you expect from others.",
    action: "If punctuality matters, model it consistently.",
    icon: "pitch",
  },
  {
    number: 10,
    title: "Know when to step back",
    cricketContext: "Leadership transitions and changing team responsibilities.",
    workplaceApplication:
      "Build successors, share context and avoid making the organisation dependent on one person.",
    action: "Document a recurring process and let another teammate own it.",
    icon: "armband",
  },
  {
    number: 11,
    title: "Keep the bigger picture in view",
    cricketContext: "A captain balances the current ball, the over and the match.",
    workplaceApplication: "Balance immediate delivery with long-term product, people and customer outcomes.",
    action: "For every urgent task, identify the longer-term goal it supports.",
    icon: "scoreboard",
  },
];
