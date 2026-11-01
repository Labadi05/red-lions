import Link from "next/link";
import db from "@/lib/db";
import { requireAdmin } from "@/lib/auth";
import { TYPES, formatWhen, nowInJinzhou } from "@/lib/format";
import TeamSplitter from "./TeamSplitter";

export const dynamic = "force-dynamic";

export default async function AdminTeamsPage({ searchParams }) {
  await requireAdmin();
  const { event } = await searchParams;
  const eventId = Number(event) || null;

  const events = db
    .prepare(
      "SELECT id, title, type, starts_at FROM events WHERE starts_at >= ? ORDER BY starts_at ASC LIMIT 8"
    )
    .all(nowInJinzhou());

  const players = db
    .prepare(
      `SELECT p.id, p.number, p.name, p.position, a.status
       FROM players p
       LEFT JOIN users u ON u.player_id = p.id
       LEFT JOIN attendance a ON a.user_id = u.id AND a.event_id = ?
       ORDER BY CAST(p.number AS INTEGER)`
    )
    .all(eventId ?? 0);

  // With an event: only the players who said "Coming". Without: everyone.
  const initialSelected = eventId
    ? players.filter((p) => p.status === "yes").map((p) => p.id)
    : players.map((p) => p.id);

  const pill = (active) =>
    `rounded-full border px-4 py-1.5 text-sm ${
      active ? "border-red-600 bg-red-600 font-semibold" : "border-neutral-700 hover:border-red-600"
    }`;

  return (
    <main className="min-h-screen bg-neutral-950 px-6 py-12 text-white">
      <div className="mx-auto max-w-4xl">
        <Link href="/admin" className="text-sm text-red-400 hover:underline">
          ← Dashboard
        </Link>
        <h1 className="mt-4 text-4xl font-bold">Team split 🔀</h1>
        <p className="mt-2 text-neutral-400">
          Random, balanced teams for internal games or penalty shootouts. One goalkeeper per
          team, and defenders, midfielders and forwards shared out evenly.
        </p>

        <p className="mt-6 text-sm text-neutral-400">Pre-fill the players from:</p>
        <div className="mt-2 flex flex-wrap gap-2">
          <Link href="/admin/teams" className={pill(!eventId)}>
            Everyone
          </Link>
          {events.map((e) => (
            <Link key={e.id} href={`/admin/teams?event=${e.id}`} className={pill(eventId === e.id)}>
              {TYPES[e.type].icon} {e.title} · {formatWhen(e.starts_at)}
            </Link>
          ))}
        </div>
        {eventId && (
          <p className="mt-2 text-xs text-neutral-500">
            Only players who said &quot;Coming&quot; are ticked. You can change it below.
          </p>
        )}

        <div className="mt-6">
          <TeamSplitter
            key={eventId ?? "all"}
            players={players}
            initialSelected={initialSelected}
          />
        </div>
      </div>
    </main>
  );
}