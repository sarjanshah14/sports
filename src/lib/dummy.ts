import { SPORTS, sportFromFormLabel } from "./sports";

// ponytail: prototype-only data. Phase 2 replaces this with rows imported from the master Excel.

/** Same columns, same order, same spelling as the hostel Google Form export. */
export const FORM_COLUMNS = [
  "Timestamp",
  "Player Name",
  "Contact Number ",
  "Room",
  "Indoor Sports (Max 2)",
  "Outdoor Sports (Max 3)",
  "Select your role in Cricket",
  "Select your role in volleyball",
  "Player Tshirt Size",
  "Player Tshirt Name",
  "Player Tshirt Number",
  "Player Photograph",
] as const;

export type FormRow = Record<(typeof FORM_COLUMNS)[number], string>;

export type Participant = {
  id: string;
  name: string;
  phone: string;
  room: string;
  sports: string[]; // slugs
  cricketRole?: string;
  volleyballRole?: string;
  size: string;
  shirtName: string;
  shirtNumber: string;
  photo: string;
};

function mulberry32(seed: number) {
  return () => {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const FIRST = "Aarav Aditya Ayush Arjun Dhruv Het Harsh Jay Jainil Kavya Krish Kunal Manan Meet Neel Nirav Om Parth Pranav Rahul Rohan Rudra Sahil Sarthak Shlok Smit Tirth Vivan Vedant Yash Yug Dev Darshan Hitansh Moksh Naman Priyansh Raj Ronak Shivam Tanmay Utsav Vatsal Zeel Aryan Ishaan Kabir Mihir Nisarg Pujan".split(" ");
const LAST = "Shah Mehta Doshi Patel Desai Joshi Parikh Modi Gandhi Trivedi Bhatt Vora Sheth Kothari Dave Pandya Thakkar Chauhan Sanghvi Jain Agarwal Rathod Soni Vyas Mistry".split(" ");
const CRICKET_ROLES = ["Batsman", "Bowler", "All-Rounder", "Wicket-Keeper"];
const VOLLEY_ROLES = ["Setter", "Spiker", "Blocker", "Libero", "All-Rounder"];
const SIZES = ["S", "M", "M", "L", "L", "XL", "XXL"];

// Rough sign-up rates chosen to match last year's numbers (TT ~90, pickleball ~116, cricket ~200).
const RATE: Record<string, number> = { chess: 0.18, carrom: 0.2, "table-tennis": 0.3, badminton: 0.23, pickleball: 0.39, volleyball: 0.27, cricket: 0.67 };

export function makeFormRows(count = 300, seed = 2025): FormRow[] {
  const r = mulberry32(seed);
  const pick = <T,>(a: T[]) => a[Math.floor(r() * a.length)];
  const used = new Set<string>();
  const rows: FormRow[] = [];
  let t = Date.UTC(2025, 10, 21, 17, 24); // 21/11/2025 22:54 IST

  while (rows.length < count) {
    const first = pick(FIRST);
    const last = pick(LAST);
    const name = `${first} ${r() < 0.1 ? last.toLowerCase() : last}`; // real forms have messy casing
    if (used.has(name.toLowerCase())) continue;
    used.add(name.toLowerCase());

    const chosen = SPORTS.filter((s) => r() < RATE[s.slug]);
    const indoor = chosen.filter((s) => s.group === "indoor").slice(0, 2);
    const outdoor = chosen.filter((s) => s.group === "outdoor").slice(-3);
    if (!indoor.length && !outdoor.length) continue;

    t += Math.floor(r() * 50 * 60 * 1000);
    const d = new Date(t + 5.5 * 3600 * 1000);
    const pad = (n: number) => String(n).padStart(2, "0");
    const stamp = `${pad(d.getUTCDate())}/${pad(d.getUTCMonth() + 1)}/${d.getUTCFullYear()} ${pad(d.getUTCHours())}:${pad(d.getUTCMinutes())}:${pad(d.getUTCSeconds())}`;
    const has = (slug: string) => outdoor.some((s) => s.slug === slug);
    const num = Math.floor(r() * 99) + 1;

    rows.push({
      Timestamp: stamp,
      "Player Name": name,
      "Contact Number ": String(Math.floor(6e9 + r() * 4e9)),
      Room: `${Math.floor(r() * 7) + 1}${pad(Math.floor(r() * 24) + 1)}`,
      "Indoor Sports (Max 2)": indoor.map((s) => s.formLabel).join(", "),
      "Outdoor Sports (Max 3)": outdoor.map((s) => s.formLabel).join(", "),
      "Select your role in Cricket": has("cricket") ? pick(CRICKET_ROLES) : "",
      "Select your role in volleyball": has("volleyball") ? pick(VOLLEY_ROLES) : "",
      "Player Tshirt Size": pick(SIZES),
      "Player Tshirt Name": r() < 0.2 ? first[0] + last[0] : first,
      "Player Tshirt Number": r() < 0.15 ? pad(num % 10) : String(num),
      "Player Photograph": `https://drive.google.com/open?id=1${Math.floor(r() * 1e16).toString(36)}${Math.floor(r() * 1e16).toString(36)}`,
    });
  }
  return rows;
}

/** Splits "Chess ( 22 December ), Table Tennis  ( 23 December )" safely: commas also appear inside the brackets. */
export function splitSports(cell: string) {
  return (cell.match(/[^,(]+\([^)]*\)/g) ?? []).map((s) => sportFromFormLabel(s)?.slug).filter(Boolean) as string[];
}

export function toParticipant(row: FormRow, i: number): Participant {
  return {
    id: `p${i + 1}`,
    name: row["Player Name"].trim().replace(/\b\w/g, (c) => c.toUpperCase()),
    phone: row["Contact Number "],
    room: row.Room,
    sports: [...splitSports(row["Indoor Sports (Max 2)"]), ...splitSports(row["Outdoor Sports (Max 3)"])],
    cricketRole: row["Select your role in Cricket"] || undefined,
    volleyballRole: row["Select your role in volleyball"] || undefined,
    size: row["Player Tshirt Size"],
    shirtName: row["Player Tshirt Name"],
    shirtNumber: row["Player Tshirt Number"],
    photo: row["Player Photograph"],
  };
}

export const PARTICIPANTS: Participant[] = makeFormRows().map(toParticipant);

export const entrants = (slug: string) => PARTICIPANTS.filter((p) => p.sports.includes(slug));
