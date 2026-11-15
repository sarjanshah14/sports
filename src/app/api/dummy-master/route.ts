import { FORM_COLUMNS, makeFormRows } from "@/lib/dummy";

// Download the fake master sheet (same columns as the Google Form) to test the importer with.
export function GET() {
  const esc = (v: string) => (/[",\n]/.test(v) ? `"${v.replace(/"/g, '""')}"` : v);
  const csv = [FORM_COLUMNS.join(","), ...makeFormRows().map((r) => FORM_COLUMNS.map((c) => esc(r[c])).join(","))].join("\n");
  return new Response(csv, {
    headers: { "content-type": "text/csv; charset=utf-8", "content-disposition": 'attachment; filename="dummy-master.csv"' },
  });
}
