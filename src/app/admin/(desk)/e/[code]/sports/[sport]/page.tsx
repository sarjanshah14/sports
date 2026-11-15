import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { DrawButton, Folded, FormatPicker, PairList, TeamsEditor } from "@/components/sport-setup";
import { eventByCode } from "@/lib/db";
import { METHODS } from "@/lib/draw";
import { competitorCount, loadSport } from "@/lib/sport-data";
import { sportBySlug } from "@/lib/sports";

const when = (iso: string) => new Date(iso).toLocaleString("en-IN", { timeZone: "Asia/Kolkata", day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" });

export default async function SportSetup({ params }: { params: { code: string; sport: string } }) {
  if (!sportBySlug(params.sport)) notFound();
  const ev = (await eventByCode(params.code))!;
  const st = await loadSport(ev, params.sport);
  const { sport } = st;
  const live = (kind: string) => st.draws.find((d) => d.kind === kind && !d.replaced_at);
  const pairsDraw = live("pairs");
  const roundDraw = live("round");
  const n = sport.kind === "doubles" && !pairsDraw ? Math.floor(st.entrants.length / 2) : competitorCount(st);
  const sideName = new Map(st.sides.map((s) => [s.id, s.name]));
  const r1 = st.matches.filter((m) => m.round === 1 || m.stage === "group");
  const byes = r1.filter((m) => m.status === "bye").length;
  const teamsShort = sport.kind === "team" && st.sides.reduce((t, s) => t + s.members.length, 0) < st.entrants.length;

  const ready1 = sport.kind === "singles" ? st.entrants.length >= 2 : st.sides.length >= 2;
  const blocked = !ready1
    ? sport.kind === "doubles"
      ? "Draw the pairs first (step 1)."
      : sport.kind === "team"
        ? "Add at least two teams first (step 1)."
        : "Need at least two players."
    : !st.saved
      ? "Save a format first (step 2)."
      : undefined;

  return (
    <div className="mt-6 max-w-3xl">
      <Link href={`/admin/e/${ev.code}/sports`} className="label inline-flex items-center gap-1.5 hover:text-ink">
        <ArrowLeft size={13} /> Sports
      </Link>
      <h1 className="mt-2 font-display text-6xl font-black uppercase leading-[0.85]">{sport.name}</h1>
      <p className="mt-2 text-sm text-mute">
        {st.entrants.length} entered · {sport.kind === "singles" ? "singles" : sport.kind === "doubles" ? "doubles, random pairs" : "teams from the auction"}
      </p>

      <ol className="mt-8 space-y-10">
        <Step n={1} title="Who's playing" done={ready1 && !teamsShort} status={stepOneStatus()}>
          {sport.kind === "singles" && (
            <p className="text-sm text-mute">
              Everyone still entered is in the draw.{" "}
              <Link href={`/admin/e/${ev.code}/people?sport=${sport.slug}`} className="text-ink underline decoration-accent underline-offset-4">
                Check the list
              </Link>{" "}
              before drawing; withdraw anyone who has pulled out.
            </p>
          )}
          {sport.kind === "doubles" && (
            <div className="space-y-4">
              <p className="text-sm text-mute">Pairs are drawn at random so two strong players can&apos;t pick each other. The draw is recorded with its seed.</p>
              {pairsDraw?.output.leftover && (
                <p className="rounded-lg border border-accent/40 px-3 py-2 text-sm">
                  <b className="font-medium">{pairsDraw.output.leftover}</b> has no partner (odd number of players). Add a late sign-up and redraw, or leave them out.
                </p>
              )}
              {pairsDraw && (
                <Folded title="Pairs" count={st.sides.length}>
                  <ol className="columns-1 gap-6 text-sm sm:columns-2">
                    {st.sides.map((s, i) => (
                      <li key={s.id} className="break-inside-avoid py-1">
                        <span className="num mr-2 text-mute">{i + 1}</span>
                        {s.name}
                      </li>
                    ))}
                  </ol>
                </Folded>
              )}
              <DrawButton code={ev.code} slug={sport.slug} kind="pairs" redo={!!pairsDraw} label="Draw pairs" />
            </div>
          )}
          {sport.kind === "team" && (
            <TeamsEditor
              code={ev.code}
              slug={sport.slug}
              people={st.entrants}
              teams={st.sides.map((s) => ({ id: s.id, name: s.name, captain: s.captain, members: s.members }))}
              locked={!!roundDraw}
            />
          )}
        </Step>

        <Step n={2} title="Format" done={st.saved} status={st.saved ? METHODS.find((m) => m.id === st.settings.method)?.name : "Compare the options and pick one"}>
          <FormatPicker code={ev.code} slug={sport.slug} n={n} unit={sport.unit} initial={st.settings} saved={st.saved} locked={!!roundDraw} />
        </Step>

        <Step n={3} title="Draw" done={!!roundDraw} status={roundDraw ? `Drawn ${when(roundDraw.created_at)}` : "One tap, recorded for everyone to see"}>
          {roundDraw ? (
            <div className="space-y-4">
              <div className="grid grid-cols-3 gap-2 rounded-xl border hair p-4 text-sm">
                <Fact k="Seed" v={roundDraw.seed} />
                <Fact k={roundDraw.output.groups ? "Groups" : "Matches"} v={roundDraw.output.groups ? roundDraw.output.groups.length : r1.length - byes} />
                <Fact k={roundDraw.output.groups ? "Group games" : "Byes"} v={roundDraw.output.groups ? r1.length : byes} />
              </div>
              {roundDraw.output.groups ? (
                <div className="grid gap-2 sm:grid-cols-2">
                  {roundDraw.output.groups.map((g, i) => (
                    <div key={i} className="rounded-xl border hair p-3">
                      <p className="label mb-1">Group {String.fromCharCode(65 + i)}</p>
                      <ol className="text-sm">
                        {g.map((name) => (
                          <li key={name}>{name}</li>
                        ))}
                      </ol>
                    </div>
                  ))}
                </div>
              ) : (
                <Folded title="Round 1" count={r1.length}>
                  <PairList rows={r1.map((m) => ({ key: m.id, a: sideName.get(m.side_a ?? "") ?? "?", b: m.side_b ? sideName.get(m.side_b) ?? "?" : null, tag: String(m.no) }))} />
                </Folded>
              )}
              <DrawButton code={ev.code} slug={sport.slug} kind="round" redo label="Draw again" />
            </div>
          ) : (
            <DrawButton code={ev.code} slug={sport.slug} kind="round" redo={false} label="Draw round 1" disabled={blocked} />
          )}
        </Step>
      </ol>

      {st.draws.length > 0 && (
        <section className="mt-12">
          <Folded title="Draw record" count={st.draws.length}>
            <ul className="divide-y divide-rule/10 text-sm">
              {st.draws.map((d) => (
                <li key={d.id} className="py-2.5">
                  <p className="flex flex-wrap justify-between gap-2">
                    <span className={d.replaced_at ? "text-mute line-through" : ""}>
                      {d.kind === "pairs" ? "Pairs" : `Round ${d.round}`} · seed <span className="num">{d.seed}</span>
                    </span>
                    <span className="num text-mute">{when(d.created_at)}</span>
                  </p>
                  {d.replaced_at && <p className="mt-0.5 text-xs text-accent">Redone {when(d.replaced_at)}: {d.note}</p>}
                </li>
              ))}
            </ul>
          </Folded>
        </section>
      )}
    </div>
  );

  function stepOneStatus() {
    if (sport.kind === "singles") return `${st.entrants.length} players`;
    if (sport.kind === "doubles") return pairsDraw ? `${st.sides.length} pairs drawn` : `${st.entrants.length} players, not paired yet`;
    const placed = st.sides.reduce((t, s) => t + s.members.length, 0);
    return `${st.sides.length} ${st.sides.length === 1 ? "team" : "teams"} · ${placed}/${st.entrants.length} placed`;
  }
}

function Step({ n, title, status, done, children }: { n: number; title: string; status?: string; done: boolean; children: React.ReactNode }) {
  return (
    <li>
      <div className="mb-4 flex items-baseline gap-3 border-b-2 border-ink pb-2">
        <span className={`num grid size-6 shrink-0 place-items-center rounded-full text-xs ${done ? "bg-ink text-paper" : "border border-rule/30 text-mute"}`}>{n}</span>
        <h2 className="font-display text-2xl font-extrabold uppercase leading-none">{title}</h2>
        <span className="ml-auto truncate text-right text-sm text-mute">{status}</span>
      </div>
      {children}
    </li>
  );
}

function Fact({ k, v }: { k: string; v: string | number }) {
  return (
    <span>
      <span className="label block text-[10px]">{k}</span>
      <span className="num text-lg">{v}</span>
    </span>
  );
}
