import Link from "next/link";
import { notFound } from "next/navigation";
import db from "@/lib/db";
import { requireAdmin } from "@/lib/auth";
import { formatWhen } from "@/lib/format";
import StatsForm from "./StatsForm";

export const dynamic = "force-dynamic";

export default async function MatchStatsPage({ params }) {
  await requireAdmin();
  const { id } = await params;

  const event = db
    .prepare("SELECT * FROM events WHERE id = ? AND type = 'match'")
    .get(Number(id));
  if (!event) notFound();

  const saved = db.prepare("SELECT * FROM match_stats WHERE event_id = ?").all(event.id);
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

  // First time: pre-tick "Played" for everyone who said they were coming
  const rows = players.map((p) => {
    const s = savedById[p.id];
    return {
      id: p.id,
      number: p.number,
      name: p.name,
      status: p.status,
      played: s ? s.played === 1 : !hasSaved && p.status === "yes",
      goals: s?.goals ?? 0,
      assists: s?.assists ?? 0,
      motm: s?.motm === 1,
    };
  });

  return (
    <main className="min-h-screen bg-neutral-950 px-6 py-12 text-white">
      <div className="mx-auto max-w-4xl">
        <Link href="/admin/events" className="text-sm text-red-400 hover:underline">
          ← Events
        </Link>
        <h1 className="mt-4 text-4xl font-bold">Match stats 📊</h1>
        <p className="mt-2 text-neutral-400">
          {event.title} · {formatWhen(event.starts_at)}
          {event.score_for !== null && ` · ${event.score_for} – ${event.score_against}`}
       </p>
        <p className="mt-1 text-sm text-neutral-500">
          Tick everyone who played, then add goals and assists. The ✅ shows who said they
          were coming, so it is only a hint.
        </p>

        <div className="mt-8">
          <StatsForm eventId={event.id} rows={rows} />
        </div>
      </div>
    </main>
  );
}