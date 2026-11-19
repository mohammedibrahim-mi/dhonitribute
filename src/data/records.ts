// Career records shown in the word-wall section. Figures supplied by the site owner and
// cross-checked (Nov 2026) against public scorecard summaries. International career ended
// Aug 2020; IPL figures are unchanged through 2026 (278 matches, 5,439 runs).
// Corrections from the supplied list: T20I highest score (56 vs England) was in 2017, and IPL
// sixes/fours are 264/375. IPL catch totals differ between sources, so only stumpings are shown.

export type RecordBox = { value: string; label: string; note?: string };
export type RecordFormat = { id: string; tab: string; title: string; sub: string; boxes: RecordBox[] };

export const recordFormats: RecordFormat[] = [
  {
    id: "odi",
    tab: "ODI",
    title: "One Day Internationals",
    sub: "2004 – 2019",
    boxes: [
      { value: "350", label: "Matches" },
      { value: "10,773", label: "Runs" },
      { value: "183*", label: "Highest score", note: "vs Sri Lanka, 2005" },
      { value: "50.57", label: "Average" },
      { value: "10", label: "Hundreds" },
      { value: "73", label: "Fifties" },
      { value: "229", label: "Sixes" },
      { value: "826", label: "Fours" },
      { value: "444", label: "Dismissals" },
      { value: "321", label: "Catches" },
      { value: "123", label: "Stumpings" },
      { value: "2", label: "ICC titles as captain", note: "2011 WC · 2013 CT" },
    ],
  },
  {
    id: "test",
    tab: "Test",
    title: "Test cricket",
    sub: "2005 – 2014",
    boxes: [
      { value: "90", label: "Matches" },
      { value: "4,876", label: "Runs" },
      { value: "224", label: "Highest score", note: "vs Australia, 2013" },
      { value: "38.09", label: "Average" },
      { value: "6", label: "Hundreds" },
      { value: "33", label: "Fifties" },
      { value: "78", label: "Sixes" },
      { value: "544", label: "Fours" },
      { value: "294", label: "Dismissals" },
      { value: "256", label: "Catches" },
      { value: "38", label: "Stumpings" },
      { value: "27", label: "Wins as captain", note: "Retired from Tests, 2014" },
    ],
  },
  {
    id: "t20i",
    tab: "T20I",
    title: "T20 Internationals",
    sub: "2006 – 2019",
    boxes: [
      { value: "98", label: "Matches" },
      { value: "1,617", label: "Runs" },
      { value: "56", label: "Highest score", note: "vs England, 2017" },
      { value: "37.60", label: "Average" },
      { value: "2", label: "Fifties" },
      { value: "52", label: "Sixes" },
      { value: "116", label: "Fours" },
      { value: "91", label: "Dismissals" },
      { value: "57", label: "Catches" },
      { value: "34", label: "Stumpings" },
      { value: "1", label: "T20 World Cup as captain", note: "2007" },
    ],
  },
  {
    id: "ipl",
    tab: "IPL",
    title: "Indian Premier League",
    sub: "2008 – present",
    boxes: [
      { value: "278", label: "Matches" },
      { value: "5,439", label: "Runs" },
      { value: "84*", label: "Highest score" },
      { value: "38.30", label: "Average" },
      { value: "24", label: "Fifties" },
      { value: "264", label: "Sixes" },
      { value: "375", label: "Fours" },
      { value: "47", label: "Stumpings" },
      { value: "5", label: "Titles as captain" },
    ],
  },
  {
    id: "icc",
    tab: "ICC",
    title: "Major ICC trophies as captain",
    sub: "The only captain to win all three white-ball ICC trophies",
    boxes: [
      { value: "2007", label: "ICC T20 World Cup" },
      { value: "2011", label: "ICC Cricket World Cup" },
      { value: "2013", label: "ICC Champions Trophy" },
    ],
  },
];
