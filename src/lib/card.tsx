import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { ImageResponse } from "next/og";

// Share cards (1200×630) for WhatsApp and other link previews, in the site's look.

export const cardSize = { width: 1200, height: 630 };

const INK = "#161411";
const PAPER = "#F3F0E9";
const ACCENT = "#DE3C1C";
const MUTE = "#8F8A82";

let font: Promise<Buffer> | undefined;
const display = () => (font ??= readFile(join(process.cwd(), "src/app/fonts/BigShoulders-800.ttf")));

export async function card({ kicker, title, big, bigLabel, lines, foot }: { kicker: string; title: string; big?: string | null; bigLabel?: string; lines: string[]; foot: string }) {
  return new ImageResponse(
    (
      <div style={{ width: "100%", height: "100%", display: "flex", flexDirection: "column", background: INK, color: PAPER, padding: "56px 64px", fontFamily: "Display" }}>
        <div style={{ display: "flex", justifyContent: "space-between", fontSize: 26, color: MUTE, letterSpacing: 4, textTransform: "uppercase" }}>
          <span>{kicker}</span>
          <div style={{ width: 22, height: 22, borderRadius: 11, background: ACCENT, display: "flex" }} />
        </div>
        <div style={{ display: "flex", fontSize: title.length > 12 ? 120 : 150, lineHeight: 0.9, textTransform: "uppercase", marginTop: 18 }}>{title}</div>
        {big ? (
          <div style={{ display: "flex", flexDirection: "column", marginTop: 26 }}>
            <span style={{ fontSize: 26, color: MUTE, letterSpacing: 4, textTransform: "uppercase" }}>{bigLabel}</span>
            <span style={{ fontSize: big.length > 18 ? 76 : 96, color: ACCENT, textTransform: "uppercase", lineHeight: 1 }}>{big}</span>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", marginTop: 30, gap: 8 }}>
            {lines.slice(0, 4).map((l, i) => (
              <span key={i} style={{ fontSize: 40, color: i === 0 ? PAPER : "#C9C4BA", textTransform: "uppercase" }}>
                {l}
              </span>
            ))}
          </div>
        )}
        <div style={{ display: "flex", marginTop: "auto", justifyContent: "space-between", alignItems: "flex-end", borderTop: `3px solid ${PAPER}`, paddingTop: 18 }}>
          <span style={{ fontSize: 28, color: MUTE, textTransform: "uppercase", letterSpacing: 2 }}>{foot}</span>
          <span style={{ fontSize: 28, textTransform: "uppercase", letterSpacing: 2 }}>Live results →</span>
        </div>
      </div>
    ),
    { ...cardSize, fonts: [{ name: "Display", data: await display(), weight: 800, style: "normal" }] },
  );
}
