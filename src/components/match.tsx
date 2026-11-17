import type { PublicMatch } from "@/lib/public-data";

export function LiveTag({ className = "" }: { className?: string }) {
  return (
    <span className={`inline-flex items-center gap-1.5 font-mono text-[11px] font-semibold uppercase tracking-label text-accent ${className}`}>
      <span className="live-dot size-1.5 rounded-full bg-accent" />
      Live
    </span>
  );
}

function Side({ name, won, lost, me, flip }: { name: string; won: boolean; lost: boolean; me: boolean; flip?: boolean }) {
  return (
    <span className={`flex min-w-0 items-start gap-2 ${flip ? "flex-row-reverse" : ""} ${won ? "font-semibold text-ink" : lost ? "text-mute" : "text-ink"}`}>
      <span className={`mt-[0.55em] size-1.5 shrink-0 rounded-[1px] ${won ? "bg-win" : "bg-transparent"}`} />
      <span className={`min-w-0 ${flip ? "text-right" : ""} ${me ? "underline decoration-accent decoration-2 underline-offset-4" : ""}`}>{name}</span>
    </span>
  );
}

/** One match. Phones: two stacked lines. Wide screens: a single scoreboard line. */
export function MatchRow({ m, unit, compact, me }: { m: PublicMatch; unit: string; compact?: boolean; me?: string | null }) {
  const done = m.status === "done";
  const wo = done && m.score === "W/O";
  const unitLabel = m.court ? `${unit} ${m.court}` : "";
  const isMe = (side: string | null) => !!me && side === me;

  if (!m.b) {
    return (
      <div className={`flex items-center gap-3 ${compact ? "mt-1" : "py-3"}`}>
        {!compact && <span className="num w-14 shrink-0 text-xs text-mute">#{m.no}</span>}
        <span className={`min-w-0 flex-1 ${isMe(m.a) ? "underline decoration-accent decoration-2 underline-offset-4" : ""}`}>{m.a}</span>
        <span className="label">{wo ? "Walkover" : "Bye"} → next round</span>
      </div>
    );
  }

  const left = m.status === "live" ? <LiveTag /> : <span className="num text-xs text-mute">#{m.no}</span>;
  const aWon = done && m.winner === "a";
  const bWon = done && m.winner === "b";
  const neither = done && !m.winner;

  const mobile = (
    <div className={`flex items-stretch gap-3 ${compact ? "mt-1.5" : "py-3 lg:hidden"}`}>
      {!compact && (
        <div className="flex w-14 shrink-0 flex-col justify-center gap-1">
          {left}
          {unitLabel && <span className="label normal-case tracking-normal">{unitLabel}</span>}
        </div>
      )}
      <div className={`flex min-w-0 flex-1 flex-col gap-1 ${m.status === "live" && !compact ? "border-l-2 border-accent pl-3" : ""}`}>
        <Side name={m.a} won={aWon} lost={bWon || neither} me={isMe(m.a)} />
        <Side name={m.b} won={bWon} lost={aWon || neither} me={isMe(m.b)} />
      </div>
      <div className="num flex shrink-0 flex-col items-end justify-center gap-1 text-[15px]">
        {done && m.sets ? (
          <>
            <span className={aWon ? "font-semibold" : "text-mute"}>{m.sets.a}</span>
            <span className={bWon ? "font-semibold" : "text-mute"}>{m.sets.b}</span>
          </>
        ) : done ? (
          <span className="label">{wo ? "W/O" : neither ? "No-show" : "Played"}</span>
        ) : compact && m.status === "live" ? (
          <LiveTag />
        ) : null}
      </div>
    </div>
  );
  if (compact) return mobile;

  return (
    <>
      {mobile}
      <div className={`hidden grid-cols-[72px_minmax(0,1fr)_140px_minmax(0,1fr)_80px] items-center gap-4 py-3.5 lg:grid ${m.status === "live" ? "bg-accent/[0.06]" : ""}`}>
        <span className="pl-1">{left}</span>
        <span className="flex justify-end text-right">
          <Side name={m.a} won={aWon} lost={bWon || neither} me={isMe(m.a)} flip />
        </span>
        <span className="num flex items-center justify-center gap-2 text-base">
          {done && m.sets ? (
            <>
              <span className={aWon ? "font-semibold" : "text-mute"}>{m.sets.a}</span>
              <span className="text-mute">:</span>
              <span className={bWon ? "font-semibold" : "text-mute"}>{m.sets.b}</span>
            </>
          ) : done ? (
            <span className="label">{wo ? "W/O" : neither ? "No-show" : "Played"}</span>
          ) : (
            <span className="font-display text-base font-bold uppercase text-mute">vs</span>
          )}
        </span>
        <Side name={m.b} won={bWon} lost={aWon || neither} me={isMe(m.b)} />
        <span className="label text-right normal-case tracking-normal">{unitLabel}</span>
      </div>
    </>
  );
}
