// Top 10 lessons from the book "Think and Win Like Dhoni" by Sfurti Sahare (Jaico Publishing
// House, 2016). The book is built around five mental traits — the right attitude, goals,
// following the process, living in the moment, and leadership. Everything below is summarised
// in our own words; the only direct words are one short question Dhoni asked the author, as
// she reports it. Takeaways and "Try this" lines are ours, not quotes from Dhoni or the author.

export type LeadershipStory = {
  number: number;
  kicker: string; // the theme in the book
  title: string; // the lesson
  story: string; // what the book tells
  work: string; // what it means at work
  tryThis: string; // one small action
  imageId: string; // gallery id
};

export const bookLessons: LeadershipStory[] = [
  {
    number: 1,
    kicker: "It isn't luck",
    title: "Train the mind, not just the muscles",
    story:
      "The author set out to answer people who called him lucky. Sourav Ganguly told her the difference was his mental programming: talent and backing can make you successful, but a mind built to win makes you a winner.",
    work: "Skills get you in the room. Mindset decides what you do there when things get hard.",
    tryThis: "Spend ten minutes this week practising a mental skill (focus, calm or self-talk) the way you'd practise a technical one.",
    imageId: "helmet-bowed",
  },
  {
    number: 2,
    kicker: "The right attitude",
    title: "It's not what happens, it's how you react",
    story:
      "Ranchi had little cricket infrastructure, and an early break was lost to jaundice and a hand injury. His coach feared it would break him; Dhoni simply said another chance would come. Injured before the 2014 Asia Cup, he used the time to rest and be with family.",
    work: "Setbacks are the same for everyone. The response is what separates performers.",
    tryThis: "Next time something goes wrong, ask the author's question: how would Dhoni react to this?",
    imageId: "long-hair-ranchi",
  },
  {
    number: 3,
    kicker: "Follow the process",
    title: "Fear isn't part of the process",
    story:
      "Nervous about a job interview, the author asked Dhoni how to apply his favourite phrase. He replied with a question: “Is fear a part of the process?” Preparation, rest, arriving on time and giving your 100% are. Worry and overthinking are not.",
    work: "Separate the steps that move the work from the noise that only drains you.",
    tryThis: "Before a big day, list what's in your process. Cross out everything that isn't, then do the rest.",
    imageId: "training-run",
  },
  {
    number: 4,
    kicker: "A fearless fighter",
    title: "When the chance comes, play without fear",
    story:
      "In April 2005, still a newcomer after a quiet first series, he was sent in at No. 3 against Pakistan and hit 148. He had slept well the night before his debut, because he needed to be fresh. The book calls fear an illusion that grows the more you feed it.",
    work: "Opportunities often arrive before you feel ready. Readiness is a decision.",
    tryThis: "Write your fear down in one line, put it aside, and go do the task anyway.",
    imageId: "bat-raised-walk",
  },
  {
    number: 5,
    kicker: "Captain Cool",
    title: "Calm is a skill you can learn",
    story:
      "He has said he wasn't calm as a young player; he hated losing and struggled with his emotions, then decided aggression wasted energy and practised calm until it stuck. The book shows him treating pressure as a chance to prove himself, not a threat.",
    work: "A calm leader keeps the team thinking clearly when everyone else is reacting.",
    tryThis: "In the next tense moment, slow your breathing and name only the very next decision.",
    imageId: "captain-cool-night",
  },
  {
    number: 6,
    kicker: "That gut feeling",
    title: "Trust instinct built on a calm mind",
    story:
      "The last over of the 2007 T20 World Cup final to Joginder Sharma, a field set for Kieron Pollard in the 2010 IPL final, the ball tossed to Suresh Raina ahead of more experienced options. The book quotes Sunil Gavaskar's view that intuition is what a calm mind produces.",
    work: "Do the homework first. Then, when it's time to decide, back your read and commit.",
    tryThis: "On your next judgement call, decide within a set time and note why. Review it later.",
    imageId: "pointing-keeper",
  },
  {
    number: 7,
    kicker: "Goals",
    title: "Set small goals, one match at a time",
    story:
      "Ask him about the fifth match of a series and he'd say he hadn't thought that far. In 2011, the book reports, the team prepared for one game, gave it everything, then left it behind. No talk of winning the cup, only of playing well.",
    work: "Big goals are reached through small, believable steps that keep you focused today.",
    tryThis: "Break this quarter's goal into the one thing you must finish this week.",
    imageId: "nets-at-dusk",
  },
  {
    number: 8,
    kicker: "Grab the opportunity",
    title: "If it doesn't knock, create it",
    story:
      "He became a wicketkeeper because his school team needed one, pushed his coach to let him bat higher, and waited at an academy for just five minutes with the ball, which kept stretching longer. Gully games, club games and even football in the rain were all practice.",
    work: "Waiting to be picked is slow. Asking, showing up and doing the extra work speeds it up.",
    tryThis: "Ask for the opportunity you've been waiting for, specifically, this week.",
    imageId: "training-catch",
  },
  {
    number: 9,
    kicker: "A peaceful walk home",
    title: "Live in the moment, then let it go",
    story:
      "Win or lose, he moves on quickly. After the 2015 World Cup semi-final he simply said only one team could win that day. The book links his calm to living in the present: one priority on the field, and real time off with bikes and dogs to recharge.",
    work: "Carrying yesterday's result into today's work only crowds the mind.",
    tryThis: "End each workday by closing it: note what's done, set tomorrow's first task, then switch off.",
    imageId: "fireworks-smile",
  },
  {
    number: 10,
    kicker: "The chosen leader",
    title: "Give away the credit, keep the responsibility",
    story:
      "He let Sachin Tendulkar own the 2011 moment, handed Sourav Ganguly the captaincy in his last Test, backed young players like Rohit Sharma and Shikhar Dhawan, kept team meetings short because players knew their jobs, and recalled Ian Bell in 2011 in the spirit of the game.",
    work: "Leaders build people who don't need managing, and share the wins generously.",
    tryThis: "After your next success, name the people who made it happen, publicly.",
    imageId: "signed-celebration",
  },
];

export const bookSource = {
  title: "Think and Win Like Dhoni",
  author: "Sfurti Sahare",
  publisher: "Jaico Publishing House",
  year: 2016,
};
