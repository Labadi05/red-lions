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
        <h1 className="mt-4 text-4xl font-bold">Teams 🔀</h1>
        <p className="mt-2 text-neutral-400">
          Pick the teams yourself for an internal game or a penalty shootout. Only the penalty
          shooting order can be shuffled at random.
        </p>

        <p className="mt-6 text-sm text-neutral-400">Show who said they are coming for:</p>
        <div className="mt-2 flex flex-wrap gap-2">
          <Link href="/admin/teams" className={pill(!eventId)}>
            Nobody in particular
          </Link>
          {events.map((e) => (
            <Link key={e.id} href={`/admin/teams?event=${e.id}`} className={pill(eventId === e.id)}>
              {TYPES[e.type].icon} {e.title} · {formatWhen(e.starts_at)}
            </Link>
          ))}
        </div>

        <div className="mt-6">
          <TeamSplitter key={eventId ?? "none"} players={players} hasEvent={Boolean(eventId)} />
        </div>
      </div>
    </main>
  );
}