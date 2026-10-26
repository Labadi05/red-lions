import Link from "next/link";
import { notFound } from "next/navigation";
import db from "@/lib/db";
import { requireAdmin } from "@/lib/auth";
import { TYPES, formatWhen } from "@/lib/format";
import CheckinForm from "./CheckinForm";
import { removeCheckins } from "./actions";

export const dynamic = "force-dynamic";

export default async function CheckinPage({ params }) {
  await requireAdmin();
  const { id } = await params;

  const event = db.prepare("SELECT * FROM events WHERE id = ?").get(Number(id));
  if (!event) notFound();

  const saved = db.prepare("SELECT * FROM checkins WHERE event_id = ?").all(event.id);
  const savedById = Object.fromEntries(saved.map((s) => [s.player_id, s]));
  const hasSaved = saved.length > 0;

  const players = db
    .prepare(
      `SELECT p.id, p.number, p.name, a.status
       FROM players p
       LEFT JOIN users u ON u.player_id = p.id
       LEFT JOIN attendance a ON a.user_id = u.id AND a.event_id = ?
       ORDER BY CAST(p.number AS INTEGER)`
    )
    .all(event.id);

  // First time: pre-tick everyone who said Coming (just a starting point)
  const rows = players.map((p) => ({
    ...p,
    attended: hasSaved ? savedById[p.id]?.attended === 1 : p.status === "yes",
  }));

  return (
    <main className="min-h-screen bg-neutral-950 px-6 py-12 text-white">
      <div className="mx-auto max-w-3xl">
        <Link href="/admin/events" className="text-sm text-red-400 hover:underline">
          ← Events
        </Link>
        <h1 className="mt-4 text-4xl font-bold">Check-in ✔️</h1>
        <p className="mt-2 text-neutral-400">
          {TYPES[event.type].icon} {event.title} · {formatWhen(event.starts_at)}
        </p>
        <p className="mt-1 text-sm text-neutral-500">
          Tick the players who actually came. Once saved, this event counts in the
          attendance ranking.
          {hasSaved ? " (Already checked in. You can edit it.)" : ""}
        </p>

        <div className="mt-8">
          <CheckinForm eventId={event.id} rows={rows} />
        </div>

        {hasSaved && (
          <form action={removeCheckins} className="mt-10">
            <input type="hidden" name="eventId" value={event.id} />
            <button className="rounded-lg border border-red-900 px-3 py-1.5 text-xs text-red-400 hover:bg-red-950">
              Don&apos;t count this event (remove check-in)
            </button>
          </form>
        )}
      </div>
    </main>
  );
}