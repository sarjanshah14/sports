import { card, cardSize } from "@/lib/card";
import { publicEvent } from "@/lib/public-data";

export const size = cardSize;
export const contentType = "image/png";
export const alt = "Event card";

export default async function Image({ params }: { params: { code: string } }) {
  const pe = await publicEvent(params.code);
  if (!pe) return card({ kicker: "Hostel sports", title: "Not found", lines: [], foot: "" });
  const champs = pe.sports.filter((s) => s.champion).map((s) => `${s.sport.name}: ${s.champion}`);
  const live = pe.all.filter((m) => m.status === "live").length;
  return card({
    kicker: "Fixtures · results · every draw",
    title: pe.ev.name,
    lines: [live ? `${live} matches on now` : `${pe.all.filter((m) => m.status === "done" && m.b).length} matches played`, ...champs],
    foot: `Code ${pe.ev.code}`,
  });
}
