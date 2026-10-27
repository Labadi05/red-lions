import Link from "next/link";
import db from "@/lib/db";
import { requireAdmin } from "@/lib/auth";
import { getRanking, rateColor } from "@/lib/attendance";
import AccountForm from "./AccountForm";

export const dynamic = "force-dynamic";

const FILTERS = [
  ["all", "All events"],
  ["training", "🏃 Trainings"],
  ["match", "⚽ Matches"],
  ["meeting", "🗣️ Meetings"],
];

export default async function AdminPage({ searchParams }) {
  await requireAdmin();
  const { type } = await searchParams;
  const active = FILTERS.some(([key]) => key === type) ? type : "all";

  const ranking = getRanking(active);
    const newFeedback = db
    .prepare("SELECT COUNT(*) AS n FROM feedback WHERE status = 'new'")
    .get().n;

  const players = db
    .prepare(
      `SELECT p.id, p.number, p.name, p.position, u.username
       FROM players p LEFT JOIN users u ON u.player_id = p.id
       ORDER BY CAST(p.number AS INTEGER)`
    )
    .all();

  const linkStyle =
    "rounded-full bg-red-600 px-5 py-2 text-sm font-semibold hover:bg-red-500";

  return (
    <main className="min-h-screen bg-neutral-950 px-6 py-12 text-white">
      <div className="mx-auto max-w-4xl">
        <Link href="/portal" className="text-sm text-red-400 hover:underline">
          ← Portal
        </Link>
        <h1 className="mt-4 text-4xl font-bold">Captain&apos;s Dashboard 🦁</h1>

        <div className="mt-6 flex flex-wrap gap-3">
          <Link href="/admin/news" className={linkStyle}>
            📣 Announcements
          </Link>
          <Link href="/admin/events" className={linkStyle}>
            🗓️ Events
          </Link>
          <Link href="/admin/polls" className={linkStyle}>
            🗳️ Polls
          </Link>
           <Link href="/admin/squad" className={linkStyle}>
            👥 Squad
          </Link>
         
           <Link href="/admin/media" className={linkStyle}>
            📸 Gallery
          </Link>
                    <Link href="/admin/messages" className={linkStyle}>
            📬 Messages
          </Link>
          <Link href="/admin/feedback" className={linkStyle}>
            💡 Feedback{newFeedback > 0 ? ` (${newFeedback} new)` : ""}
          </Link>
          <Link href="/admin/settings" className={linkStyle}>
            ⚙️ Site info
          </Link>
        </div>

        <h2 className="mt-12 text-xl font-semibold text-red-500">Attendance ranking 📈</h2>
        <p className="mt-1 text-sm text-neutral-400">
          Only events you have checked in count. No-show = said &quot;Coming&quot; but
          did not come.
        </p>

        <div className="mt-4 flex flex-wrap gap-2">
          {FILTERS.map(([key, label]) => (
            <Link
              key={key}
              href={key === "all" ? "/admin" : `/admin?type=${key}`}
              className={`rounded-full border px-4 py-1.5 text-sm ${
                active === key
                  ? "border-red-600 bg-red-600 font-semibold"
                  : "border-neutral-700 hover:border-red-600"
              }`}
            >
              {label}
            </Link>
          ))}
        </div>

        {ranking.length === 0 ? (
          <p className="mt-6 text-neutral-500">
            No data yet. Open <span className="text-neutral-300">Events</span> and use
            ✔️ Check-in on a past event.
          </p>
        ) : (
          <div className="mt-6 overflow-x-auto rounded-xl border border-neutral-800">
            <table className="w-full min-w-[560px] text-sm">
              <thead className="bg-neutral-900 text-xs uppercase text-neutral-400">
                <tr>
                  <th className="px-3 py-3 text-left">#</th>
                  <th className="px-3 py-3 text-left">Player</th>
                  <th className="px-3 py-3 text-center">Events</th>
                  <th className="px-3 py-3 text-center">Came</th>
                  <th className="px-3 py-3 text-center">Rate</th>
                  <th className="px-3 py-3 text-center">Replied</th>
                  <th className="px-3 py-3 text-center">No-shows</th>
                  <th className="px-3 py-3 text-center">Declined</th>
                </tr>
              </thead>
              <tbody>
                {ranking.map((r, i) => (
                  <tr key={r.id} className="border-t border-neutral-800">
                    <td className="px-3 py-3 text-neutral-500">{i + 1}</td>
                    <td className="px-3 py-3">
                      <span className="font-black text-red-600">{r.number}</span> {r.name}
                    </td>
                    <td className="px-3 py-3 text-center">{r.events}</td>
                    <td className="px-3 py-3 text-center">{r.attended}</td>
                    <td className={`px-3 py-3 text-center font-bold ${rateColor(r.rate)}`}>
                      {r.rate}%
                    </td>
                    <td className="px-3 py-3 text-center">{r.responseRate}%</td>
                    <td
                      className={`px-3 py-3 text-center ${
                        r.no_shows > 0 ? "font-semibold text-red-400" : "text-neutral-500"
                      }`}
                    >
                      {r.no_shows}
                    </td>
                    <td className="px-3 py-3 text-center text-neutral-400">{r.declined}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <h2 className="mt-14 text-xl font-semibold text-red-500">Player accounts</h2>
        <p className="mt-1 text-sm text-neutral-400">
          Create or reset player logins. Send each player their username and password
          privately (for example on WeChat).
        </p>
        <div className="mt-4 space-y-3">
          {players.map((p) => (
            <div
              key={p.id}
              className="rounded-xl border border-neutral-800 bg-neutral-900 p-4"
            >
              <div className="flex items-center gap-3">
                <span className="text-2xl font-black text-red-600">{p.number}</span>
                <span className="font-medium">{p.name}</span>
                <span className="text-sm text-neutral-500">{p.position}</span>
                <span
                  className={`ml-auto rounded-full px-2 py-0.5 text-xs ${
                    p.username
                      ? "bg-green-900 text-green-300"
                      : "bg-neutral-800 text-neutral-400"
                  }`}
                >
                  {p.username ? `Account: ${p.username}` : "No account"}
                </span>
              </div>
              <AccountForm
                playerId={p.id}
                hasAccount={Boolean(p.username)}
                defaultUsername={
                  p.username ??
                  `${p.name.toLowerCase().replace(/[^a-z0-9]/g, "")}${p.number}`
                }
              />
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}