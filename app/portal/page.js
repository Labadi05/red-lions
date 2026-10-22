import { TYPES, formatWhen, nowInJinzhou } from "@/lib/format";
import { setAttendance } from "./actions";
import Link from "next/link";
import { redirect } from "next/navigation";
import db from "@/lib/db";
import { getSession } from "@/lib/session";
import { logout } from "../login/actions";

export const dynamic = "force-dynamic";

export default async function PortalPage() {
  const session = await getSession();
  if (!session) redirect("/login");

  const me = db
    .prepare(
      `SELECT u.username, u.role, p.name, p.number
       FROM users u LEFT JOIN players p ON p.id = u.player_id
       WHERE u.id = ?`
    )
    .get(session.uid);

  if (!me) redirect("/login");
    const announcements = db
    .prepare("SELECT * FROM announcements ORDER BY id DESC LIMIT 30")
    .all();
      const events = db
    .prepare(
      `SELECT e.*, a.status AS my_status, a.reason AS my_reason
       FROM events e
       LEFT JOIN attendance a ON a.event_id = e.id AND a.user_id = ?
       WHERE e.starts_at >= ?
       ORDER BY e.starts_at ASC`
    )
    .all(session.uid, nowInJinzhou());

  return (
    <main className="min-h-screen bg-neutral-950 px-6 py-12 text-white">
      <div className="mx-auto max-w-4xl">
        <h1 className="text-4xl font-bold">
          Welcome, {me.name ?? me.username} 🦁
        </h1>
        <p className="mt-2 text-neutral-400">
          {me.number ? `#${me.number} · ` : ""}
          {me.role === "admin" ? "Captain (admin)" : "Player"}
        </p>
        <h2 className="mt-10 text-xl font-semibold text-red-500">Upcoming</h2>
        <div className="mt-4 space-y-3">
          {events.length === 0 && (
            <p className="text-neutral-500">No upcoming events.</p>
          )}
          {events.map((e) => (
            <div
              key={e.id}
              className="rounded-xl border border-neutral-800 bg-neutral-900 p-5"
            >
              <div className="flex flex-wrap items-center gap-3">
                <span className="text-xl">{TYPES[e.type].icon}</span>
                <span className="text-lg font-semibold">{e.title}</span>
                <span className="text-sm text-neutral-400">{formatWhen(e.starts_at)}</span>
              </div>
              {e.location && (
                <p className="mt-1 text-sm text-neutral-500">📍 {e.location}</p>
              )}
              {e.notes && (
                <p className="mt-2 whitespace-pre-wrap text-sm text-neutral-300">
                  {e.notes}
                </p>
              )}

              <form action={setAttendance} className="mt-4 flex flex-wrap items-center gap-2">
                <input type="hidden" name="eventId" value={e.id} />
                <input
                  name="reason"
                  defaultValue={e.my_reason ?? ""}
                  placeholder="Reason (optional)"
                  className="w-44 rounded-lg border border-neutral-700 bg-neutral-950 px-3 py-1.5 text-sm outline-none focus:border-red-600"
                />
                {[
                  ["yes", "✅ Coming"],
                  ["maybe", "❓ Maybe"],
                  ["no", "❌ Can't come"],
                ].map(([value, label]) => (
                  <button
                    key={value}
                    name="status"
                    value={value}
                    className={`rounded-lg border px-3 py-1.5 text-sm ${
                      e.my_status === value
                        ? "border-red-600 bg-red-600 font-semibold"
                        : "border-neutral-700 hover:border-red-600"
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </form>
            </div>
          ))}
        </div>
                <h2 className="mt-10 text-xl font-semibold text-red-500">Announcements</h2>
        <div className="mt-4 space-y-3">
          {announcements.length === 0 && (
            <p className="text-neutral-500">No announcements yet.</p>
          )}
          {announcements.map((a) => (
            <article
              key={a.id}
              className="rounded-xl border border-neutral-800 bg-neutral-900 p-5"
            >
              <div className="flex items-center gap-2 text-xs text-neutral-500">
                {a.created_at.slice(0, 10)}
                {a.visibility === "players" && (
                  <span className="rounded-full bg-yellow-900 px-2 py-0.5 text-yellow-300">
                    🔒 Players only
                  </span>
                )}
              </div>
              <h3 className="mt-1 text-lg font-semibold">{a.title}</h3>
              <p className="mt-2 whitespace-pre-wrap text-neutral-300">{a.body}</p>
            </article>
          ))}
        </div>
        {me.role === "admin" && (
          <Link
            href="/admin"
            className="mt-6 inline-block rounded-full bg-red-600 px-5 py-2 text-sm font-semibold hover:bg-red-500"
          >
            Captain&apos;s Dashboard →
          </Link>
        )}
        <form action={logout} className="mt-8">
          <button className="rounded-full border border-neutral-700 px-5 py-2 text-sm hover:border-red-600">
            Log out
          </button>
        </form>
      </div>
    </main>
  );
}