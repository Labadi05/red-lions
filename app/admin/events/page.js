import Link from "next/link";
import db from "@/lib/db";
import { requireAdmin } from "@/lib/auth";
import { TYPES, formatWhen, nowInJinzhou } from "@/lib/format";
import EventForm from "./EventForm";
import CopyButton from "../news/CopyButton";
import { deleteEvent } from "./actions";

export const dynamic = "force-dynamic";

const STATUS = {
  yes: { label: "Coming", icon: "✅" },
  maybe: { label: "Maybe", icon: "❓" },
  no: { label: "Can't come", icon: "❌" },
};

function EventCard({ e }) {
  const rows = db
    .prepare(
      `SELECT p.number, p.name, a.status, a.reason
       FROM players p
       LEFT JOIN users u ON u.player_id = p.id
       LEFT JOIN attendance a ON a.user_id = u.id AND a.event_id = ?
       ORDER BY CAST(p.number AS INTEGER)`
    )
    .all(e.id);

  const count = (s) => rows.filter((r) => r.status === s).length;
  const noReply = rows.filter((r) => !r.status).length;
  const t = TYPES[e.type];

  const shareText =
    `🦁 RED LIONS\n\n${t.icon} ${e.title}\n🗓️ ${formatWhen(e.starts_at)}` +
    (e.location ? `\n📍 ${e.location}` : "") +
    (e.notes ? `\n\n${e.notes}` : "") +
    `\n\nPlease confirm your attendance on the website.`;

  return (
    <div className="rounded-xl border border-neutral-800 bg-neutral-900 p-4">
      <div className="flex flex-wrap items-center gap-3">
        <span className="text-xl">{t.icon}</span>
        <span className="font-semibold">{e.title}</span>
        <span className="text-sm text-neutral-400">{formatWhen(e.starts_at)}</span>
        {e.location && <span className="text-sm text-neutral-500">📍 {e.location}</span>}
              {e.score_for !== null && e.score_against !== null && (
          <span className="rounded-full bg-neutral-800 px-3 py-0.5 text-sm font-bold">
            {e.score_for} – {e.score_against}
          </span>
        )}
      </div>
      {e.notes && (
        <p className="mt-2 whitespace-pre-wrap text-sm text-neutral-300">{e.notes}</p>
      )}

      <p className="mt-3 text-sm text-neutral-300">
        ✅ {count("yes")} · ❓ {count("maybe")} · ❌ {count("no")} · No reply {noReply}
      </p>
      <details className="mt-2">
        <summary className="cursor-pointer text-xs text-neutral-400 hover:text-white">
          See who answered
        </summary>
        <ul className="mt-2 space-y-1 text-sm">
          {rows.map((r) => (
            <li key={r.number} className="text-neutral-300">
              <span className="text-red-500">{r.number}</span> {r.name} —{" "}
              {r.status ? `${STATUS[r.status].icon} ${STATUS[r.status].label}` : "No reply"}
              {r.reason ? <span className="text-neutral-500"> ({r.reason})</span> : null}
            </li>
          ))}
        </ul>
      </details>

      <div className="mt-3 flex items-center gap-2">
        <Link
          href={`/admin/events/${e.id}`}
          className="rounded-lg border border-neutral-700 px-3 py-1 text-xs hover:border-red-600"
        >
          Edit
        </Link>

                <Link
          href={`/admin/events/${e.id}/checkin`}
          className="rounded-lg border border-neutral-700 px-3 py-1 text-xs hover:border-red-600"
        >
          ✔️ Check-in
        </Link>
        
                {e.type === "match" && (
          <Link
            href={`/admin/events/${e.id}/lineup`}
            className="rounded-lg border border-neutral-700 px-3 py-1 text-xs hover:border-red-600"
          >
            📋 Lineup {e.lineup_published === 1 ? "(published)" : ""}
          </Link>
        )}
                {e.type === "match" && (
          <Link
            href={`/admin/events/${e.id}/stats`}
            className="rounded-lg border border-neutral-700 px-3 py-1 text-xs hover:border-red-600"
          >
            📊 Stats
          </Link>
        )}
        <CopyButton text={shareText} />
        <form action={deleteEvent} className="ml-auto">
          <input type="hidden" name="id" value={e.id} />
          <button className="rounded-lg border border-red-900 px-3 py-1 text-xs text-red-400 hover:bg-red-950">
            Delete
          </button>
        </form>
      </div>
    </div>
  );
}

export default async function AdminEventsPage() {
  await requireAdmin();

  const now = nowInJinzhou();
  const upcoming = db
    .prepare("SELECT * FROM events WHERE starts_at >= ? ORDER BY starts_at ASC")
    .all(now);
  const past = db
    .prepare("SELECT * FROM events WHERE starts_at < ? ORDER BY starts_at DESC")
    .all(now);

  return (
    <main className="min-h-screen bg-neutral-950 px-6 py-12 text-white">
      <div className="mx-auto max-w-4xl">
        <Link href="/admin" className="text-sm text-red-400 hover:underline">
          ← Dashboard
        </Link>
        <h1 className="mt-4 text-4xl font-bold">Events 🗓️</h1>

        <h2 className="mt-8 text-xl font-semibold text-red-500">New event</h2>
        <div className="mt-4">
          <EventForm />
        </div>

        <h2 className="mt-12 text-xl font-semibold text-red-500">Upcoming</h2>
        <div className="mt-4 space-y-3">
          {upcoming.length === 0 && <p className="text-neutral-500">No upcoming events.</p>}
          {upcoming.map((e) => (
            <EventCard key={e.id} e={e} />
          ))}
        </div>

        {past.length > 0 && (
          <>
            <h2 className="mt-12 text-xl font-semibold text-neutral-400">Past</h2>
            <div className="mt-4 space-y-3 opacity-70">
              {past.map((e) => (
                <EventCard key={e.id} e={e} />
              ))}
            </div>
          </>
        )}
      </div>
    </main>
  );
}