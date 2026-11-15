export type SportKind = "singles" | "doubles" | "team";

export type Sport = {
  slug: string;
  name: string;
  kind: SportKind;
  group: "indoor" | "outdoor";
  /** Exact option text from the Google Form; the importer matches on the part before "(". */
  formLabel: string;
  date: string; // ISO day; cricket spans two days
  endDate?: string;
  time?: string;
  venue: string;
  unit: string; // what one "court" is called for this sport
  courts: number; // default number of boards/tables/courts
  slot: number; // default minutes per match incl. changeover
};

export const SPORTS: Sport[] = [
  { slug: "chess", name: "Chess", kind: "singles", group: "indoor", formLabel: "Chess ( 22 December )", date: "2025-12-22", venue: "Common room", unit: "Board", courts: 6, slot: 30 },
  { slug: "carrom", name: "Carrom", kind: "singles", group: "indoor", formLabel: "Carrom ( 22 December )", date: "2025-12-22", venue: "Common room", unit: "Board", courts: 4, slot: 25 },
  { slug: "table-tennis", name: "Table Tennis", kind: "singles", group: "indoor", formLabel: "Table Tennis  ( 23 December )", date: "2025-12-23", venue: "Activity hall", unit: "Table", courts: 4, slot: 15 },
  { slug: "badminton", name: "Badminton", kind: "singles", group: "outdoor", formLabel: "Badminton ( 24 December, Time : After 6 pm )", date: "2025-12-24", time: "After 6 pm", venue: "Badminton court", unit: "Court", courts: 2, slot: 20 },
  { slug: "pickleball", name: "Pickleball", kind: "doubles", group: "outdoor", formLabel: "Pickleball ( 25 December , Time : 10 am to 3 pm )", date: "2025-12-25", time: "10 am – 3 pm", venue: "Pickleball court", unit: "Court", courts: 2, slot: 20 },
  { slug: "volleyball", name: "Volleyball", kind: "team", group: "outdoor", formLabel: "Volleyball ( 26 December, Time : After 6 pm )", date: "2025-12-26", time: "After 6 pm", venue: "Volleyball court", unit: "Court", courts: 1, slot: 40 },
  { slug: "cricket", name: "Cricket", kind: "team", group: "outdoor", formLabel: "Cricket ( 27-28 December )", date: "2025-12-27", endDate: "2025-12-28", venue: "Box turf", unit: "Turf", courts: 1, slot: 90 },
];

export const sportBySlug = (slug: string) => SPORTS.find((s) => s.slug === slug);

/** "Table Tennis  ( 23 December )" -> sport. Tolerates "Carom"/"Carrom" and stray spaces. */
export function sportFromFormLabel(label: string) {
  const key = label.split("(")[0].trim().toLowerCase().replace(/\s+/g, " ").replace("carom", "carrom");
  return SPORTS.find((s) => s.name.toLowerCase() === key);
}

/**
 * Splits a form cell into sport slugs. Commas also appear inside the brackets
 * ("Badminton ( 24 December, Time : After 6 pm )"), so match "Name ( ... )" chunks first,
 * then fall back to plain comma lists ("Chess, Carrom") for hand-made sheets.
 */
export function splitSports(cell: string) {
  const text = cell.trim();
  if (!text) return { slugs: [] as string[], unknown: [] as string[] };
  const parts = text.includes("(") ? text.match(/[^,(]+\([^)]*\)/g) ?? [] : text.split(",");
  const slugs: string[] = [];
  const unknown: string[] = [];
  for (const part of parts) {
    const s = sportFromFormLabel(part);
    if (s) {
      if (!slugs.includes(s.slug)) slugs.push(s.slug);
    }
    else if (part.trim()) unknown.push(part.trim());
  }
  return { slugs, unknown };
}
