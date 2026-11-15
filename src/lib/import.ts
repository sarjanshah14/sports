import { SPORTS, splitSports, sportBySlug } from "./sports";

// Turns a raw sheet (first row = headers) into clean people, plus a report of
// everything the committee should look at before importing. Runs in the browser.

export type Person = {
  name: string;
  phone: string;
  room: string;
  cricket_role: string;
  volleyball_role: string;
  tshirt_size: string;
  tshirt_name: string;
  tshirt_number: string;
  photo_url: string;
  submitted_at: string;
  sports: string[];
};

type Field = Exclude<keyof Person, "sports">;

/** Header matchers. Loose on purpose: the form may get reworded next year. */
const FIELDS: { field: Field; label: string; test: (h: string) => boolean }[] = [
  { field: "name", label: "Name", test: (h) => h.includes("name") && !h.includes("shirt") },
  { field: "phone", label: "Phone", test: (h) => h.includes("contact") || h.includes("phone") || h.includes("mobile") },
  { field: "room", label: "Room", test: (h) => h.includes("room") },
  { field: "cricket_role", label: "Cricket role", test: (h) => h.includes("role") && h.includes("cricket") },
  { field: "volleyball_role", label: "Volleyball role", test: (h) => h.includes("role") && h.includes("volley") },
  { field: "tshirt_size", label: "T-shirt size", test: (h) => h.includes("size") },
  { field: "tshirt_name", label: "T-shirt name", test: (h) => h.includes("shirt") && h.includes("name") },
  { field: "tshirt_number", label: "T-shirt number", test: (h) => h.includes("shirt") && (h.includes("number") || h.includes("no")) },
  { field: "photo_url", label: "Photo", test: (h) => h.includes("photo") },
  { field: "submitted_at", label: "Timestamp", test: (h) => h.includes("timestamp") },
];

export type Report = {
  people: Person[];
  columns: { label: string; header: string | null }[];
  sportColumns: string[];
  skipped: { row: number; reason: string }[];
  notes: { row: number; name: string; msg: string }[];
  perSport: Record<string, number>;
};

const norm = (h: string) => h.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
export const cleanName = (s: string) => s.trim().replace(/\s+/g, " ").toLowerCase().replace(/(^|[\s'-])\p{L}/gu, (c) => c.toUpperCase());
export const cleanPhone = (s: string) => s.replace(/\D/g, "").slice(-10);

export function parseSheet(rows: string[][]): Report {
  const headerAt = rows.findIndex((r) => r.some((c) => FIELDS[0].test(norm(c))));
  const headers = (rows[headerAt] ?? []).map(norm);
  const raw = rows[headerAt] ?? [];
  const col: Partial<Record<Field, number>> = {};
  for (const f of FIELDS) {
    const i = headers.findIndex((h, i) => f.test(h) && !Object.values(col).includes(i));
    if (i >= 0) col[f.field] = i;
  }
  const sportCols = headers.map((h, i) => (h.includes("sport") ? i : -1)).filter((i) => i >= 0);

  const report: Report = {
    people: [],
    columns: FIELDS.map((f) => ({ label: f.label, header: col[f.field] !== undefined ? raw[col[f.field]!] : null })),
    sportColumns: sportCols.map((i) => raw[i]),
    skipped: [],
    notes: [],
    perSport: {},
  };
  if (headerAt < 0) {
    report.skipped.push({ row: 1, reason: "No header row with a name column was found." });
    return report;
  }

  const byPhone = new Map<string, number>();
  rows.slice(headerAt + 1).forEach((r, k) => {
    const rowNo = headerAt + k + 2; // 1-based, as Excel shows it
    const get = (f: Field) => (col[f] !== undefined ? String(r[col[f]!] ?? "").trim() : "");
    if (r.every((c) => !String(c ?? "").trim())) return;
    const name = cleanName(get("name"));
    if (!name) return void report.skipped.push({ row: rowNo, reason: "No name" });

    const sports: string[] = [];
    for (const i of sportCols) {
      const { slugs, unknown } = splitSports(String(r[i] ?? ""));
      for (const s of slugs) if (!sports.includes(s)) sports.push(s);
      for (const u of unknown) report.notes.push({ row: rowNo, name, msg: `Unknown sport “${u}”, left out` });
    }
    if (!sports.length) return void report.skipped.push({ row: rowNo, reason: `${name} picked no sport` });

    const indoor = sports.filter((s) => sportBySlug(s)!.group === "indoor").length;
    const outdoor = sports.length - indoor;
    if (indoor > 2) report.notes.push({ row: rowNo, name, msg: `${indoor} indoor sports (max 2)` });
    if (outdoor > 3) report.notes.push({ row: rowNo, name, msg: `${outdoor} outdoor sports (max 3)` });

    const phone = cleanPhone(get("phone"));
    if (get("phone") && phone.length !== 10) report.notes.push({ row: rowNo, name, msg: `Phone “${get("phone")}” doesn't look like 10 digits` });

    const person: Person = {
      name,
      phone,
      room: get("room"),
      cricket_role: sports.includes("cricket") ? get("cricket_role") : "",
      volleyball_role: sports.includes("volleyball") ? get("volleyball_role") : "",
      tshirt_size: get("tshirt_size").toUpperCase(),
      tshirt_name: get("tshirt_name"),
      tshirt_number: get("tshirt_number"),
      photo_url: get("photo_url"),
      submitted_at: get("submitted_at"),
      sports,
    };

    // Google Forms: people resubmit to change their sports. The later row wins.
    const prev = phone ? byPhone.get(phone) : undefined;
    if (prev !== undefined) {
      report.notes.push({ row: rowNo, name, msg: `Submitted again (same phone as ${report.people[prev].name}); kept this later entry` });
      report.people[prev] = person;
    } else {
      if (phone) byPhone.set(phone, report.people.length);
      report.people.push(person);
    }
  });

  for (const s of SPORTS) report.perSport[s.slug] = report.people.filter((p) => p.sports.includes(s.slug)).length;
  return report;
}

/** Minimal RFC 4180 CSV reader: quotes, escaped quotes, commas and newlines inside quotes. */
export function parseCsv(text: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let cell = "";
  let quoted = false;
  const endRow = () => {
    row.push(cell);
    rows.push(row);
    row = [];
    cell = "";
  };
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (quoted) {
      if (c === '"' && text[i + 1] === '"') {
        cell += '"';
        i++;
      } else if (c === '"') quoted = false;
      else cell += c;
    } else if (c === '"') quoted = true;
    else if (c === ",") {
      row.push(cell);
      cell = "";
    } else if (c === "\n" || c === "\r") {
      if (c === "\r" && text[i + 1] === "\n") i++;
      endRow();
    } else cell += c;
  }
  if (cell || row.length) endRow();
  return rows;
}
