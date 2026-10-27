import Link from "next/link";
import { redirect } from "next/navigation";
import db from "@/lib/db";
import { getSession } from "@/lib/session";
import { TYPES, formatWhen, nowInJinzhou } from "@/lib/format";
import Pitch from "@/components/Pitch";
import { logout } from "../login/actions";
import { setAttendance, vote } from "./actions";
import { getPolls } from "@/lib/polls";
import { getMyAttendance, rateColor } from "@/lib/attendance";
import { getUnreadCount } from "@/lib/messages";

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

  const allPolls = getPolls(session.uid);
  const polls = [
    ...allPolls.filter((p) => !p.closed),
    ...allPolls.filter((p) => p.closed).slice(0, 3),
  ];

  const unread = getUnreadCount(session.uid);
  const mine = getMyAttendance(session.uid);
  const playersById = Object.fromEntries(
    db.prepare("SELECT id, number, name FROM players").all().map((p) => [p.id, p])
  );

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

        {me.role === "admin" && (
          <Link
            href="/admin"
            className="mt-6 inline-block rounded-full bg-red-600 px-5 py-2 text-sm font-semibold hover:bg-red-500"
          >
            Captain&apos;s Dashboard →
          </Link>
        )}

          <Link
          href="/gallery"
          className="mt-4 inline-block rounded-full border border-neutral-700 px-5 py-2 text-sm hover:border-red-600"
        >
          📸 Gallery
        </Link>

        <Link
          href="/portal/inbox"
          className={`ml-2 mt-4 inline-block rounded-full border px-5 py-2 text-sm ${
            unread > 0
              ? "border-red-600 bg-red-600 font-semibold"
              : "border-neutral-700 hover:border-red-600"
          }`}
        >
          📬 Inbox{unread > 0 ? ` (${unread} new)` : ""}
        </Link>

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
                <span className="text-sm text-neutral-400">
                  {formatWhen(e.starts_at)}
                </span>
              </div>
              {e.location && (
                <p className="mt-1 text-sm text-neutral-500">📍 {e.location}</p>
              )}
              {e.notes && (
                <p className="mt-2 whitespace-pre-wrap text-sm text-neutral-300">
                  {e.notes}
                </p>
              )}

              <form
                action={setAttendance}
                className="mt-4 flex flex-wrap items-center gap-2"
              >
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

              {e.type === "match" && e.lineup_published === 1 && (
                <details className="mt-4" open>
                  <summary className="cursor-pointer text-sm font-semibold text-red-500">
                    📋 Lineup · {e.formation}
                  </summary>
                  <div className="mt-3">
                    <Pitch
                      formation={e.formation}
                      slotIds={JSON.parse(e.lineup)}
                      playersById={playersById}
                    />
                    {JSON.parse(e.bench).length > 0 && (
                      <p className="mt-3 text-sm text-neutral-300">
                        <span className="text-neutral-500">Bench: </span>
                        {JSON.parse(e.bench)
                          .map((id) =>
                            playersById[id]
                              ? `${playersById[id].number} ${playersById[id].name}`
                              : null
                          )
                          .filter(Boolean)
                          .join(" · ")}
                      </p>
                    )}
                  </div>
                </details>
              )}
            </div>
          ))}
        </div>

        <h2 className="mt-10 text-xl font-semibold text-red-500">Polls 🗳️</h2>
        <div className="mt-4 space-y-3">
          {polls.length === 0 && <p className="text-neutral-500">No polls right now.</p>}
          {polls.map((poll) => (
            <div
              key={poll.id}
              className="rounded-xl border border-neutral-800 bg-neutral-900 p-5"
            >
              <div className="flex flex-wrap items-center gap-3">
                <span className="text-lg font-semibold">{poll.question}</span>
                <span
                  className={`rounded-full px-2 py-0.5 text-xs ${
                    poll.closed
                      ? "bg-neutral-700 text-neutral-300"
                      : "bg-green-900 text-green-300"
                  }`}
                >
                  {poll.closed
                    ? "Closed"
                    : poll.closes_at
                    ? `Vote before ${formatWhen(poll.closes_at)}`
                    : "Open"}
                </span>
              </div>

              {!poll.closed && (
                <form action={vote} className="mt-4 flex flex-wrap gap-2">
                  <input type="hidden" name="pollId" value={poll.id} />
                  {poll.options.map((o) => (
                    <button
                      key={o.id}
                      name="optionId"
                      value={o.id}
                      className={`rounded-lg border px-4 py-2 text-sm ${
                        poll.myVote === o.id
                          ? "border-red-600 bg-red-600 font-semibold"
                          : "border-neutral-700 hover:border-red-600"
                      }`}
                    >
                      {o.label}
                    </button>
                  ))}
                </form>
              )}

              {!poll.closed && poll.myVote && (
                <p className="mt-2 text-xs text-neutral-500">
                  You can change your vote until the poll closes.
                </p>
              )}
              {!poll.closed && !poll.myVote && (
                <p className="mt-2 text-xs text-neutral-500">
                  Results appear after you vote.
                </p>
              )}

              {(poll.closed || poll.myVote) && (
                <div className="mt-4 space-y-3">
                  {poll.options.map((o) => {
                    const pct = poll.total ? Math.round((100 * o.count) / poll.total) : 0;
                    return (
                      <div key={o.id}>
                        <div className="flex items-center justify-between text-sm">
                          <span>{o.label}</span>
                          <span className="text-neutral-400">
                            {o.count} · {pct}%
                          </span>
                        </div>
                        <div className="mt-1 h-2 overflow-hidden rounded-full bg-neutral-800">
                          <div className="h-full bg-red-600" style={{ width: `${pct}%` }} />
                        </div>
                      </div>
                    );
                  })}
                  <p className="text-xs text-neutral-500">
                    {poll.total} vote{poll.total === 1 ? "" : "s"}
                  </p>
                </div>
              )}
            </div>
          ))}
        </div>


        <h2 className="mt-10 text-xl font-semibold text-red-500">My attendance 📈</h2>
        <div className="mt-4 rounded-xl border border-neutral-800 bg-neutral-900 p-5">
          {!mine.summary ? (
            <p className="text-neutral-500">
              Your attendance will show here once the captain has checked in some events.
            </p>
          ) : (
            <>
              <div className="flex flex-wrap items-end gap-8">
                <div>
                  <div className={`text-5xl font-black ${rateColor(mine.summary.rate)}`}>
                    {mine.summary.rate}%
                  </div>
                  <div className="text-xs text-neutral-400">attendance rate</div>
                </div>
                <div>
                  <div className="text-2xl font-bold">
                    {mine.summary.attended}/{mine.summary.events}
                  </div>
                  <div className="text-xs text-neutral-400">events attended</div>
                </div>
                <div>
                  <div className="text-2xl font-bold">{mine.summary.responseRate}%</div>
                  <div className="text-xs text-neutral-400">replies given</div>
                </div>
                <div>
                  <div
                    className={`text-2xl font-bold ${
                      mine.summary.no_shows > 0 ? "text-red-400" : ""
                    }`}
                  >
                    {mine.summary.no_shows}
                  </div>
                  <div className="text-xs text-neutral-400">no-shows</div>
                </div>
              </div>


              <div className="mt-5 space-y-2">
                {mine.history.map((h, i) => (
                  <div key={i} className="flex items-center gap-3 text-sm">
                    <span>{TYPES[h.type].icon}</span>
                    <span className="flex-1 truncate">{h.title}</span>
                    <span className="text-xs text-neutral-500">{formatWhen(h.starts_at)}</span>
                    <span className="text-xs text-neutral-500">
                      {h.status === "yes"
                        ? "said ✅"
                        : h.status === "maybe"
                        ? "said ❓"
                        : h.status === "no"
                        ? "said ❌"
                        : "no reply"}
                    </span>
                    <span
                      className={`rounded-full px-2 py-0.5 text-xs font-semibold ${
                        h.attended
                          ? "bg-green-900 text-green-300"
                          : "bg-red-900 text-red-300"
                      }`}
                    >
                      {h.attended ? "Came" : "Missed"}
                    </span>
                  </div>
                ))}
              </div>
            </>
          )}
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

        <form action={logout} className="mt-10">
          <button className="rounded-full border border-neutral-700 px-5 py-2 text-sm hover:border-red-600">
            Log out
          </button>
        </form>
      </div>
    </main>
  );
}