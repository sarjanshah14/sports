import { card, cardSize } from "@/lib/card";
import { publicEvent, sportView } from "@/lib/public-data";
import { sportBySlug } from "@/lib/sports";

export const size = cardSize;
export const contentType = "image/png";
export const alt = "Results card";

export default async function Image({ params }: { params: { code: string; sport: string } }) {
  const pe = await publicEvent(params.code);
  const sport = sportBySlug(params.sport);
  if (!pe || !sport) return card({ kicker: "Hostel sports", title: "Not found", lines: [], foot: "" });
  const v = sportView(pe, params.sport);
  const recent = pe.all
    .filter((m) => m.sport === params.sport && m.status === "done" && m.b && m.winner)
    .sort((a, b) => b.updated.localeCompare(a.updated))
    .slice(0, 3)
    .map((m) => `${m.winner === "a" ? m.a : m.b} beat ${m.winner === "a" ? m.b : m.a}${m.sets ? `  ${m.sets.a.split(" ").map((x, i) => `${x}-${m.sets!.b.split(" ")[i]}`).join(", ")}` : ""}`);
  const cur = v.summary.current;
  return card({
    kicker: pe.ev.name,
    title: sport.name,
    big: v.summary.champion,
    bigLabel: "Champion",
    lines: cur ? [`${cur.label} · ${cur.done}/${cur.total} played`, ...recent] : [`${v.summary.entries} entered`, "Draw coming soon"],
    foot: `Code ${pe.ev.code}`,
  });
}
