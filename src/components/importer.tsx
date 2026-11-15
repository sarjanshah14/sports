"use client";

import Link from "next/link";
import { useState } from "react";
import { AlertTriangle, Check, FileSpreadsheet, X } from "lucide-react";
import { importPeople } from "@/app/admin/actions";
import { parseCsv, parseSheet, type Report } from "@/lib/import";
import { SPORTS } from "@/lib/sports";

const cellText = (v: unknown) => {
  if (v instanceof Date) {
    const p = (n: number) => String(n).padStart(2, "0");
    return `${p(v.getDate())}/${p(v.getMonth() + 1)}/${v.getFullYear()} ${p(v.getHours())}:${p(v.getMinutes())}:${p(v.getSeconds())}`;
  }
  return v == null ? "" : String(v);
};

async function readFile(file: File): Promise<string[][]> {
  if (/\.xlsx$/i.test(file.name)) {
    const { readSheet } = await import("read-excel-file/browser");
    const rows = (await readSheet(file)) as unknown[][];
    return rows.map((r) => r.map(cellText));
  }
  if (/\.(csv|txt)$/i.test(file.name)) return parseCsv(await file.text());
  throw new Error("Use an .xlsx or .csv file. In Google Sheets: File → Download → .xlsx.");
}

export function Importer({ code }: { code: string }) {
  const [report, setReport] = useState<Report | null>(null);
  const [fileName, setFileName] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState<{ added: number; already: string[] } | null>(null);
  const [drag, setDrag] = useState(false);

  async function load(file: File) {
    setError("");
    setDone(null);
    try {
      setFileName(file.name);
      setReport(parseSheet(await readFile(file)));
    } catch (e) {
      setReport(null);
      setError(e instanceof Error ? e.message : "Couldn't read that file.");
    }
  }

  async function useDummy() {
    const text = await (await fetch("/api/dummy-master")).text();
    await load(new File([text], "dummy-master.csv"));
  }

  async function run() {
    if (!report) return;
    setBusy(true);
    try {
      setDone(await importPeople(code, report.people));
      setReport(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Import failed.");
    } finally {
      setBusy(false);
    }
  }

  if (done)
    return (
      <div className="rounded-xl border-2 border-ink p-6">
        <p className="flex items-center gap-2 font-display text-3xl font-extrabold uppercase">
          <Check className="text-accent" /> {done.added} added
        </p>
        {done.already.length > 0 && (
          <p className="mt-2 text-sm text-mute">
            {done.already.length} already in this event (same phone), skipped: {done.already.slice(0, 8).join(", ")}
            {done.already.length > 8 && ` and ${done.already.length - 8} more`}.
          </p>
        )}
        <div className="mt-5 flex gap-2">
          <Link href={`/admin/e/${code}/people`} className="btn">
            See participants
          </Link>
          <button onClick={() => setDone(null)} className="btn-quiet">
            Import another file
          </button>
        </div>
      </div>
    );

  return (
    <div className="space-y-8">
      {!report && (
        <label
          onDragOver={(e) => (e.preventDefault(), setDrag(true))}
          onDragLeave={() => setDrag(false)}
          onDrop={(e) => {
            e.preventDefault();
            setDrag(false);
            const f = e.dataTransfer.files[0];
            if (f) load(f);
          }}
          className={`flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed px-6 py-14 text-center transition ${drag ? "border-accent bg-accent/5" : "border-rule/25 hover:border-ink"}`}
        >
          <FileSpreadsheet size={28} strokeWidth={1.5} />
          <span className="mt-3 font-display text-2xl font-extrabold uppercase">Drop the master sheet</span>
          <span className="mt-1 text-sm text-mute">.xlsx or .csv, straight from the Google Form responses</span>
          <input type="file" accept=".xlsx,.csv" className="sr-only" onChange={(e) => e.target.files?.[0] && load(e.target.files[0])} />
        </label>
      )}
      {!report && (
        <p className="text-sm text-mute">
          No sheet yet?{" "}
          <button onClick={useDummy} className="text-ink underline decoration-accent underline-offset-4">
            Load the 300 dummy residents
          </button>{" "}
          to try it out.
        </p>
      )}
      {error && <p className="text-sm text-accent">{error}</p>}

      {report && (
        <>
          <div className="flex flex-wrap items-end justify-between gap-4 border-b-2 border-ink pb-4">
            <div>
              <p className="label">{fileName}</p>
              <p className="mt-1 font-display text-5xl font-black uppercase leading-none">
                {report.people.length} <span className="text-mute">people</span>
              </p>
            </div>
            <div className="flex gap-2">
              <button onClick={() => setReport(null)} className="btn-quiet">
                <X size={15} /> Different file
              </button>
              <button onClick={run} disabled={busy || !report.people.length} className="btn">
                {busy ? "Importing…" : `Import ${report.people.length}`}
              </button>
            </div>
          </div>

          <div className="grid gap-8 md:grid-cols-2">
            <section className="min-w-0">
              <h3 className="label mb-2">Per sport</h3>
              <ul className="border-t hair">
                {SPORTS.map((s) => (
                  <li key={s.slug} className="flex justify-between border-b hair py-2 text-sm">
                    <span>{s.name}</span>
                    <span className="num">
                      {report.perSport[s.slug]}
                      {s.kind === "doubles" && <span className="text-mute"> → {Math.floor(report.perSport[s.slug] / 2)} pairs{report.perSport[s.slug] % 2 ? " + 1" : ""}</span>}
                    </span>
                  </li>
                ))}
              </ul>
            </section>
            <section className="min-w-0">
              <h3 className="label mb-2">Columns found</h3>
              <ul className="border-t hair">
                {report.columns.map((c) => (
                  <li key={c.label} className="flex justify-between gap-4 border-b hair py-2 text-sm">
                    <span className="shrink-0">{c.label}</span>
                    <span className={`min-w-0 truncate text-right ${c.header ? "text-mute" : "text-accent"}`}>{c.header ?? "not found"}</span>
                  </li>
                ))}
                <li className="flex justify-between gap-4 border-b hair py-2 text-sm">
                  <span className="shrink-0">Sports</span>
                  <span className="min-w-0 truncate text-right text-mute">{report.sportColumns.join(" + ") || "not found"}</span>
                </li>
              </ul>
            </section>
          </div>

          {(report.notes.length > 0 || report.skipped.length > 0) && (
            <section>
              <h3 className="label mb-2 flex items-center gap-1.5 text-accent">
                <AlertTriangle size={13} /> Check these ({report.notes.length + report.skipped.length})
              </h3>
              <ul className="max-h-80 overflow-auto border-t hair text-sm">
                {report.skipped.map((s) => (
                  <li key={`s${s.row}`} className="grid grid-cols-[56px_1fr] border-b hair py-2">
                    <span className="num text-mute">Row {s.row}</span>
                    <span>Not imported: {s.reason}</span>
                  </li>
                ))}
                {report.notes.map((n, i) => (
                  <li key={i} className="grid grid-cols-[56px_1fr] border-b hair py-2">
                    <span className="num text-mute">Row {n.row}</span>
                    <span>
                      <b className="font-medium">{n.name}</b>: {n.msg}
                    </span>
                  </li>
                ))}
              </ul>
            </section>
          )}
        </>
      )}
    </div>
  );
}
