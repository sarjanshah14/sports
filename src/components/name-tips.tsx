"use client";

import { useEffect, useRef, useState } from "react";

type Tip = { text: string; x: number; y: number };

/**
 * Shows "Full Name · Rm 312" for any known name under the pointer (desktop hover) or finger (phone tap),
 * anywhere on the page: match rows, logs, brackets, champions. It reads the text under the pointer
 * instead of wrapping names in markup, so every page gets it without changes.
 */
export function NameTips({ tips }: { tips: Record<string, string> }) {
  const [tip, setTip] = useState<Tip | null>(null);
  const last = useRef("");

  useEffect(() => {
    const labels = Object.keys(tips).filter((l) => l.length >= 3).sort((a, b) => b.length - a.length);
    const isLetter = (c: string | undefined) => !!c && /\p{L}/u.test(c);

    const hit = (x: number, y: number): Tip | null => {
      const d = document as Document & { caretPositionFromPoint?: (x: number, y: number) => { offsetNode: Node; offset: number } | null };
      let node: Node | undefined;
      let off = 0;
      if (d.caretPositionFromPoint) {
        const p = d.caretPositionFromPoint(x, y);
        node = p?.offsetNode;
        off = p?.offset ?? 0;
      } else if (document.caretRangeFromPoint) {
        const r = document.caretRangeFromPoint(x, y);
        node = r?.startContainer;
        off = r?.startOffset ?? 0;
      }
      if (!node || node.nodeType !== Node.TEXT_NODE) return null;
      const text = node.nodeValue ?? "";
      for (const l of labels) {
        for (let i = text.indexOf(l); i >= 0; i = text.indexOf(l, i + 1)) {
          if (off < i || off > i + l.length || isLetter(text[i - 1]) || isLetter(text[i + l.length])) continue;
          const r = document.createRange();
          r.setStart(node, i);
          r.setEnd(node, i + l.length);
          const box = [...r.getClientRects()].find((b) => x >= b.left - 2 && x <= b.right + 2 && y >= b.top - 2 && y <= b.bottom + 2);
          if (box) return { text: tips[l], x: box.left + box.width / 2, y: box.top };
        }
      }
      return null;
    };

    const show = (t: Tip | null) => {
      const key = t ? `${t.text}|${Math.round(t.x)}|${Math.round(t.y)}` : "";
      if (key !== last.current) {
        last.current = key;
        setTip(t);
      }
    };
    let type = "mouse";
    const down = (e: PointerEvent) => (type = e.pointerType);
    const move = (e: PointerEvent) => {
      type = e.pointerType;
      if (type === "mouse") show(hit(e.clientX, e.clientY));
    };
    const click = (e: MouseEvent) => {
      if (type !== "mouse") show(hit(e.clientX, e.clientY)); // phones: tap a name, tap anywhere else to close
    };
    const clear = () => show(null);
    addEventListener("pointerdown", down, { passive: true });
    addEventListener("pointermove", move, { passive: true });
    addEventListener("click", click);
    addEventListener("scroll", clear, { passive: true });
    return () => {
      removeEventListener("pointerdown", down);
      removeEventListener("pointermove", move);
      removeEventListener("click", click);
      removeEventListener("scroll", clear);
    };
  }, [tips]);

  if (!tip) return null;
  const left = Math.min(Math.max(tip.x, 110), (typeof window === "undefined" ? 1000 : window.innerWidth) - 110);
  return (
    <div
      role="tooltip"
      style={{ left, top: tip.y - 8 }}
      className="pointer-events-none fixed z-50 max-w-[220px] -translate-x-1/2 -translate-y-full rounded-md bg-ink px-2.5 py-1.5 text-center font-mono text-[11px] leading-snug text-paper shadow-lg"
    >
      {tip.text}
    </div>
  );
}
