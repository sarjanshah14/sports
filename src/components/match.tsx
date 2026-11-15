import type { Match } from "@/lib/mock-event";

const abbr = (full: string) => {
  const [f, l] = full.split(" ");
  return l ? `${f} ${l[0]}.` : f;
};
const isMe = (side: string | undefined, me?: string) => !!me && !!side && (side.includes(me) || side.includes(abbr(me)));

export function LiveTag({ className = "" }: { className?: string }) {
  return (
    <span className={`inline-flex items-center gap-1.5 font-mono text-[11px] font-semibold uppercase tracking-label text-accent ${className}`}>
      <span className="live-dot size-1.5 rounded-full bg-accent" />
      Live
    </span>
  );
}

function scores(m: Match) {
  if (!m.score) return [undefined, undefined];
  const [a, b] = m.score.split("–");
  return [a, b];
}

function Side({ name, won, lost, me, flip }: { name: string; won: boolean; lost: boolean; me: boolean; flip?: boolean }) {
  return (
    <span className={`flex min-w-0 items-center gap-2 ${flip ? "flex-row-reverse" : ""} ${won ? "font-semibold text-ink" : lost ? "text-mute" : "text-ink"}`}>
      <span className={`size-1.5 shrink-0 rounded-[1px] ${won ? "bg-win" : "bg-transparent"}`} />
      <span className={`truncate ${me ? "underline decoration-accent decoration-2 underline-offset-4" : ""}`}>{name}</span>
    </span>
  );
}

export function MatchRow({ m, unit, compact, highlight }: { m: Match; unit: string; compact?: boolean; highlight?: string }) {
  const done = m.status === "done";
  const [sa, sb] = scores(m);
  const unitLabel = m.unit ? `${unit} ${m.unit}` : "";

  if (!m.b) {
    return (
      <div className={`flex items-center gap-3 ${compact ? "mt-1" : "py-3"}`}>
        {!compact && <span className="num w-14 shrink-0 text-sm text-mute">—</span>}
        <span className="flex-1 truncate text-ink">{m.a}</span>
        <span className="label">Bye → Round {m.round + 1}</span>
      </div>
    );
  }

  const left = m.status === "live" ? <LiveTag /> : m.status === "next" ? <span className="label text-ink">Next</span> : <span className="num text-sm text-mute">{m.time}</span>;

  const mobile = (
    <div className={`flex items-stretch gap-3 ${compact ? "mt-1.5" : "py-3"} ${compact ? "" : "lg:hidden"}`}>
      {!compact && (
        <div className="flex w-14 shrink-0 flex-col justify-center gap-1">
          {left}
          <span className="label normal-case tracking-normal">{unitLabel}</span>
        </div>
      )}
      <div className={`flex min-w-0 flex-1 flex-col gap-1 ${m.status === "live" && !compact ? "border-l-2 border-accent pl-3" : ""}`}>
        <Side name={m.a} won={done && m.winner === "a"} lost={done && m.winner === "b"} me={isMe(m.a, highlight)} />
        <Side name={m.b} won={done && m.winner === "b"} lost={done && m.winner === "a"} me={isMe(m.b, highlight)} />
      </div>
      <div className="num flex w-8 shrink-0 flex-col items-end justify-center gap-1 text-[15px]">
        {done && sa ? (
          <>
            <span className={m.winner === "a" ? "font-semibold" : "text-mute"}>{sa}</span>
            <span className={m.winner === "b" ? "font-semibold" : "text-mute"}>{sb}</span>
          </>
        ) : compact ? (
          <span className="text-xs text-mute">{m.status === "live" ? "" : m.time}</span>
        ) : null}
      </div>
      {compact && m.status === "live" && <LiveTag className="self-center" />}
    </div>
  );

  if (compact) return mobile;

  return (
    <>
      {mobile}
      <div className={`hidden grid-cols-[88px_1fr_120px_1fr_88px] items-center gap-4 py-3.5 lg:grid ${m.status === "live" ? "bg-accent/[0.06]" : ""}`}>
        <span className="pl-1">{left}</span>
        <span className="flex justify-end text-right">
          <Side name={m.a} won={done && m.winner === "a"} lost={done && m.winner === "b"} me={false} flip />
        </span>
        <span className="num flex items-center justify-center gap-2 text-lg">
          {done && sa ? (
            <>
              <span className={m.winner === "a" ? "font-semibold" : "text-mute"}>{sa}</span>
              <span className="text-mute">:</span>
              <span className={m.winner === "b" ? "font-semibold" : "text-mute"}>{sb}</span>
            </>
          ) : done ? (
            <span className="label">Result</span>
          ) : (
            <span className="font-display text-base font-bold uppercase text-mute">vs</span>
          )}
        </span>
        <Side name={m.b} won={done && m.winner === "b"} lost={done && m.winner === "a"} me={false} />
        <span className="label text-right normal-case tracking-normal">{unitLabel}</span>
      </div>
    </>
  );
}
