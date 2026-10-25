import Link from "next/link";
import { notFound } from "next/navigation";
import db from "@/lib/db";
import { requireAdmin } from "@/lib/auth";
import { formatWhen } from "@/lib/format";
import LineupForm from "./LineupForm";

export const dynamic = "force-dynamic";

export default async function LineupPage({ params }) {
  await requireAdmin();
  const { id } = await params;

  const event = db
    .prepare("SELECT * FROM events WHERE id = ? AND type = 'match'")
    .get(Number(id));
  if (!event) notFound();

  const players = db
    .prepare(
      `SELECT p.id, p.number, p.name, a.status
       FROM players p
       LEFT JOIN users u ON u.player_id = p.id
       LEFT JOIN attendance a ON a.user_id = u.id AND a.event_id = ?
       ORDER BY CAST(p.number AS INTEGER)`
    )
    .all(event.id);

  return (
    <main className="min-h-screen bg-neutral-950 px-6 py-12 text-white">
      <div className="mx-auto max-w-5xl">
        <Link href="/admin/events" className="text-sm text-red-400 hover:underline">
          ← Events
        </Link>
        <h1 className="mt-4 text-4xl font-bold">Lineup 📋</h1>
        <p className="mt-2 text-neutral-400">
          {event.title} · {formatWhen(event.starts_at)}
        </p>
        <p className="mt-1 text-sm text-neutral-500">
          ✅ coming · ❓ maybe · ❌ can&apos;t come · no icon = no reply yet
        </p>

        <div className="mt-8">
          <LineupForm
            event={{
              id: event.id,
              title: event.title,
              formation: event.formation,
              lineup: event.lineup,
              bench: event.bench,
              lineup_published: event.lineup_published,
            }}
            players={players}
          />
        </div>
      </div>
    </main>
  );
}