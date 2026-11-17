import { notFound } from "next/navigation";
import { EventTabs } from "@/components/client";
import { NameTips } from "@/components/name-tips";
import { eventByCode } from "@/lib/db";
import { publicEvent } from "@/lib/public-data";

export default async function EventDesk({ children, params }: { children: React.ReactNode; params: { code: string } }) {
  const ev = await eventByCode(params.code);
  if (!ev) notFound();
  const pe = await publicEvent(ev.code);
  return (
    <>
      {pe && <NameTips tips={pe.tips} />}
      <div className="pt-6 md:pt-10">
        <p className="label">
          Code <span className="text-ink">{ev.code}</span>
        </p>
        <p className="mt-1 font-display text-2xl font-extrabold uppercase leading-none md:text-3xl">{ev.name}</p>
      </div>
      <EventTabs code={ev.code} />
      {children}
    </>
  );
}
