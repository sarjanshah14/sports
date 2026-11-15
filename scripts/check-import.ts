// Self-check for the sheet importer. Run: npm run check
import assert from "node:assert/strict";
import { FORM_COLUMNS, makeFormRows } from "../src/lib/dummy";
import { parseCsv, parseSheet } from "../src/lib/import";
import { splitSports } from "../src/lib/sports";

const rows = makeFormRows();
const esc = (v: string) => (/[",\n]/.test(v) ? `"${v.replace(/"/g, '""')}"` : v);
const csv = [FORM_COLUMNS.join(","), ...rows.map((r) => FORM_COLUMNS.map((c) => esc(r[c])).join(","))].join("\r\n");

const grid = parseCsv(csv);
assert.equal(grid.length, rows.length + 1);
assert.equal(grid[1][4], rows[0]["Indoor Sports (Max 2)"]);

const rep = parseSheet(grid);
assert.equal(rep.people.length, rows.length);
assert.ok(rep.columns.every((c) => c.header), "every field found a column");
assert.equal(rep.sportColumns.length, 2);
assert.equal(rep.perSport.cricket, rows.filter((r) => r["Outdoor Sports (Max 3)"].includes("Cricket")).length);

// Commas inside brackets, Carom spelling, plain lists
assert.deepEqual(splitSports("Badminton ( 24 December, Time : After 6 pm ), Cricket ( 27-28 December )").slugs, ["badminton", "cricket"]);
assert.deepEqual(splitSports("Carom ( 22 December )").slugs, ["carrom"]);
assert.deepEqual(splitSports("Chess, table tennis, Kabaddi"), { slugs: ["chess", "table-tennis"], unknown: ["Kabaddi"] });

// Resubmission: same phone twice, later row wins; blank rows and nameless rows handled
const dup = parseSheet([
  ["Timestamp", "Player Name", "Contact Number ", "Indoor Sports (Max 2)"],
  ["1", "ayush  doshi", "+91 98247 18663", "Chess ( 22 December )"],
  ["", "", "", ""],
  ["2", "Ayush Doshi", "9824718663", "Carrom ( 22 December )"],
  ["3", "", "9999999999", "Chess ( 22 December )"],
]);
assert.equal(dup.people.length, 1);
assert.deepEqual(dup.people[0].sports, ["carrom"]);
assert.equal(dup.people[0].phone, "9824718663");
assert.equal(dup.skipped.length, 1);
console.log(`import ok: ${rep.people.length} people, ${rep.notes.length} notes`);
