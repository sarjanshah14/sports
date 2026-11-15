import { Importer } from "@/components/importer";

export default function ImportPage({ params }: { params: { code: string } }) {
  return (
    <div className="mt-8 max-w-3xl">
      <Importer code={params.code} />
      <p className="mt-10 text-sm text-mute">
        Importing again later is safe: people already in this event (same phone number) are skipped, so only new sign-ups get added.
      </p>
    </div>
  );
}
