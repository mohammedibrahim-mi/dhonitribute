import { gallery, type TributeImage } from "./gallery";

// Display order for the trophy cabinet: the defining titles first, then the rest.
const order = [
  "johannesburg-2007",
  "first-ipl-crown",
  "world-cup-2011-closeup",
  "champions-trophy-blazer",
  "test-mace-whites",
  "test-mace-blazer",
  "thala-chinna-thala",
  "dubai-2021",
  "jadeja-2023",
  "clt20-silver",
  "yellow-army-global",
];

const trophyImages = gallery.filter((g) => g.kind === "trophy");

export const trophies: TributeImage[] = [
  ...order.map((id) => trophyImages.find((g) => g.id === id)).filter((g): g is TributeImage => Boolean(g)),
  ...trophyImages.filter((g) => !order.includes(g.id)),
];

export const aesthetic = (id: string) => gallery.find((g) => g.id === id && g.kind === "aesthetic");
