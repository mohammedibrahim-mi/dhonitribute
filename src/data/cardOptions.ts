// Tribute card choices. Every wish is a fan-made message inspired by his
// public career — never presented as a quote or message from MS Dhoni.

export type CardPhoto = {
  imageId: string;
  label: string;
  /** focal point 0–1 for the cover crop */
  focusX: number;
  focusY: number;
  /** fraction of the top edge to crop away (logos/watermarks) */
  insetTop?: number;
};

export const cardPhotos: CardPhoto[] = [
  { imageId: "champions-trophy-blazer", label: "Champions Trophy", focusX: 0.45, focusY: 0.3, insetTop: 0.16 },
  { imageId: "johannesburg-2007", label: "2007 champion", focusX: 0.5, focusY: 0.28 },
  { imageId: "world-cup-2011-closeup", label: "2011 World Cup", focusX: 0.4, focusY: 0.4 },
  { imageId: "dubai-2021", label: "Yellow crown", focusX: 0.4, focusY: 0.4 },
  { imageId: "test-mace-whites", label: "No. 1 in whites", focusX: 0.5, focusY: 0.28 },
  { imageId: "helmet-salute", label: "Helmet salute", focusX: 0.4, focusY: 0.38 },
];

export type CardWish = {
  id: string;
  label: string;
  /** Big title, two lines: [white line, accent line] */
  title: [string, string];
  /** {name} is replaced with the visitor's name (drawn as plain text) */
  message: string;
};

export const cardWishes: CardWish[] = [
  {
    id: "legacy",
    label: "A legacy that inspires",
    title: ["A LEGACY THAT", "INSPIRES"],
    message: "{name}, keep leading with courage, humility and belief.",
  },
  {
    id: "calm",
    label: "Stay calm",
    title: ["CALM UNDER", "PRESSURE"],
    message: "{name}, when the game gets tight, stay calm. Your finish is coming.",
  },
  {
    id: "process",
    label: "Trust the process",
    title: ["TRUST THE", "PROCESS"],
    message: "{name}, trust the process. Do the work, and the results will follow.",
  },
  {
    id: "front",
    label: "Lead from the front",
    title: ["LEAD FROM", "THE FRONT"],
    message: "{name}, step up when it matters most and let your work do the talking.",
  },
  {
    id: "team",
    label: "Back your team",
    title: ["BACK YOUR", "TEAM"],
    message: "{name}, back your people, own the big moments and stay humble in victory.",
  },
];
