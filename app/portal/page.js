import Link from "next/link";
import { redirect } from "next/navigation";
import db from "@/lib/db";
import { getSession } from "@/lib/session";
import { TYPES, formatWhen, nowInJinzhou } from "@/lib/format";
import { getMyAttendance, rateColor } from "@/lib/attendance";
import { getPolls } from "@/lib/polls";
import { getUnreadCount } from "@/lib/messages";
import { getMyPayments, getPaymentInfo } from "@/lib/money";
import { CATEGORIES, formatMoney } from "@/lib/moneyFormat";
import { getT } from "@/lib/i18n";
import Pitch from "@/components/Pitch";
import Logo from "@/components/Logo";
import PlayerPhoto from "@/components/PlayerPhoto";
import TeamCards from "@/components/TeamCards";
import { logout } from "../login/actions";
import { setAttendance, vote, claimPaid } from "./actions";

export const dynamic = "force-dynamic";

const navLink =
  "rounded-xl border border-neutral-800 bg-neutral-900 px-4 py-2 text-sm hover:border-gold";

export default async function PortalPage() {
  const { t, lang } = await getT();

  const session = await getSession();
  if (!session) redirect("/login");

  const me = db
    .prepare(
      `SELECT u.username, u.role, p.id AS player_id, p.name, p.number, p.position, p.photo
       FROM users u LEFT JOIN players p ON p.id = u.player_id
       WHERE u.id = ?`
    )
    .get(session.uid);

  if (!me) redirect("/login");

  const player = { name: me.name ?? me.username, photo: me.photo };

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
  const eventTitles = Object.fromEntries(
    db.prepare("SELECT id, title FROM events").all().map((e) => [e.id, e.title])
  );

  const unread = getUnreadCount(session.uid);
  const mine = getMyAttendance(session.uid);
  const money = getMyPayments(session.uid);
  const payInfo = getPaymentInfo();
  const today = nowInJinzhou().slice(0, 10);

  const playersById = Object.fromEntries(
    db.prepare("SELECT id, number, name FROM players").all().map((p) => [p.id, p])
  );

  const teamLabels = {
    teams: [t("teams.red"), t("teams.green"), t("teams.white"), t("teams.gold")],
    shootingOrder: t("teams.shootingOrder"),
    short: {
      Goalkeeper: t("pos.short.Goalkeeper"),
      Defender: t("pos.short.Defender"),
      Midfielder: t("pos.short.Midfielder"),
      Forward: t("pos.short.Forward"),
    },
  };
  const said = {
    yes: t("portal.saidYes"),
    maybe: t("portal.saidMaybe"),
    no: t("portal.saidNo"),
  };

  return (
    <main className="min-h-screen bg-neutral-950 text-white">
      <header className="border-b border-neutral-800">
        <div className="mx-auto flex max-w-6xl items-center gap-3 px-6 py-3">
          <Link href="/" aria-label="Red Lions">
            <Logo width={40} />
          </Link>
          <span className="font-bold tracking-wide" dir="ltr">
            RED <span className="text-red-500">LIONS</span>
          </span>
          <span className="text-sm text-neutral-500">{t("portal.title")}</span>
        </div>
      </header>

      <div className="mx-auto grid max-w-6xl gap-8 px-6 py-8 lg:grid-cols-[260px_1fr]">
        {/* Side panel */}
        <aside className="lg:sticky lg:top-8 lg:self-start">
          <div className="flex items-center gap-4 rounded-2xl border border-neutral-800 bg-neutral-900 p-5 lg:flex-col lg:text-center">
            <PlayerPhoto
              player={player}
              className="h-24 w-24 shrink-0 rounded-2xl border-2 border-gold lg:h-44 lg:w-44"
            />
            <div>
              {me.number && (
                <div className="text-4xl font-black text-red-600 lg:text-5xl">
                  {me.number}
                </div>
              )}
              <div className="text-xl font-bold">{player.name}</div>
              <div className="mt-1 text-sm text-neutral-400">
                {me.position ? t(`pos.${me.position}`) : t("portal.teamMember")}
              </div>
              {me.role === "admin" && (
                <span className="mt-2 inline-block rounded-md bg-gold px-2 py-0.5 text-xs font-black text-neutral-950">
                  {t("common.captain")}
                </span>
              )}
            </div>
          </div>

          <nav className="mt-4 flex flex-wrap gap-2 lg:flex-col">
            <Link
              href="/portal/inbox"
              className={`${navLink} ${
                unread > 0 ? "!border-red-600 !bg-red-600 font-semibold" : ""
              }`}
            >
              {unread > 0 ? t("portal.inboxNew", { n: unread }) : t("portal.inbox")}
            </Link>
            <Link href="/gallery" className={navLink}>
              {t("portal.gallery")}
            </Link>
            <Link href="/squad" className={navLink}>
              {t("portal.squad")}
            </Link>
            <Link href="/" className={navLink}>
              {t("portal.publicSite")}
            </Link>
            {me.role === "admin" && (
              <Link href="/admin" className={`${navLink} !border-gold text-gold`}>
                {t("portal.dashboard")}
              </Link>
            )}
            <form action={logout} className="contents">
              <button className={`${navLink} w-full text-start text-neutral-400`}>
                {t("portal.logout")}
              </button>
            </form>
          </nav>
        </aside>

        {/* Main column */}
        <div className="min-w-0 space-y-10">
          <div>
            <h1 className="text-3xl font-bold">{t("portal.welcome", { name: player.name })}</h1>
            <p className="mt-1 text-neutral-400">{t("portal.welcomeSub")}</p>
          </div>

          <section>
            <h2 className="text-xl font-semibold text-red-500">{t("portal.upcoming")}</h2>
            <div className="mt-4 space-y-3">
              {events.length === 0 && (
                <p className="text-neutral-500">{t("portal.noUpcoming")}</p>
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
                      {formatWhen(e.starts_at, lang)}
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
                      placeholder={t("portal.reasonPlaceholder")}
                      className="w-44 rounded-lg border border-neutral-700 bg-neutral-950 px-3 py-1.5 text-sm outline-none focus:border-red-600"
                    />
                    {[
                      ["yes", t("portal.coming")],
                      ["maybe", t("portal.maybe")],
                      ["no", t("portal.cantCome")],
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
                        {t("portal.lineup", { formation: e.formation })}
                      </summary>
                      <div className="mt-3">
                        <Pitch
                          formation={e.formation}
                          slotIds={JSON.parse(e.lineup)}
                          playersById={playersById}
                        />
                        {JSON.parse(e.bench).length > 0 && (
                          <p className="mt-3 text-sm text-neutral-300">
                            <span className="text-neutral-500">{t("portal.bench")} </span>
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
          </section>

          <section>
            <h2 className="text-xl font-semibold text-red-500">{t("portal.polls")}</h2>
            <div className="mt-4 space-y-3">
              {polls.length === 0 && (
                <p className="text-neutral-500">{t("portal.noPolls")}</p>
              )}
              {polls.map((poll) => {
                const question =
                  poll.kind === "motm" && poll.event_id && eventTitles[poll.event_id]
                    ? t("portal.motmQuestion", { title: eventTitles[poll.event_id] })
                    : poll.question;

                return (
                  <div
                    key={poll.id}
                    className="rounded-xl border border-neutral-800 bg-neutral-900 p-5"
                  >
                    <div className="flex flex-wrap items-center gap-3">
                      <span className="text-lg font-semibold">{question}</span>
                      <span
                        className={`rounded-full px-2 py-0.5 text-xs ${
                          poll.closed
                            ? "bg-neutral-700 text-neutral-300"
                            : "bg-green-900 text-green-300"
                        }`}
                      >
                        {poll.closed
                          ? t("portal.closed")
                          : poll.closes_at
                          ? t("portal.voteBefore", { when: formatWhen(poll.closes_at, lang) })
                          : t("portal.open")}
                      </span>
                    </div>

                    {!poll.closed && (
                      <form action={vote} className="mt-4 flex flex-wrap gap-2">
                        <input type="hidden" name="pollId" value={poll.id} />
                        {poll.options.map((o) => {
                          const isSelf =
                            poll.kind === "motm" && o.player_id === me.player_id;
                          return (
                            <button
                              key={o.id}
                              name="optionId"
                              value={o.id}
                              disabled={isSelf}
                              title={isSelf ? t("portal.cantVoteSelf") : undefined}
                              className={`rounded-lg border px-4 py-2 text-sm ${
                                isSelf
                                  ? "cursor-not-allowed border-neutral-800 text-neutral-600"
                                  : poll.myVote === o.id
                                  ? "border-red-600 bg-red-600 font-semibold"
                                  : "border-neutral-700 hover:border-red-600"
                              }`}
                            >
                              {o.label}
                            </button>
                          );
                        })}
                      </form>
                    )}

                    {!poll.closed && poll.myVote && (
                      <p className="mt-2 text-xs text-neutral-500">{t("portal.canChange")}</p>
                    )}
                    {!poll.closed && !poll.myVote && (
                      <p className="mt-2 text-xs text-neutral-500">{t("portal.resultsAfter")}</p>
                    )}

                    {(poll.closed || poll.myVote) && (
                      <div className="mt-4 space-y-3">
                        {poll.options.map((o) => {
                          const pct = poll.total
                            ? Math.round((100 * o.count) / poll.total)
                            : 0;
                          return (
                            <div key={o.id}>
                              <div className="flex items-center justify-between text-sm">
                                <span>{o.label}</span>
                                <span className="text-neutral-400" dir="ltr">
                                  {o.count} · {pct}%
                                </span>
                              </div>
                              <div className="mt-1 h-2 overflow-hidden rounded-full bg-neutral-800">
                                <div
                                  className="h-full bg-red-600"
                                  style={{ width: `${pct}%` }}
                                />
                              </div>
                            </div>
                          );
                        })}
                        <p className="text-xs text-neutral-500">
                          {t("portal.votesCount", { n: poll.total })}
                        </p>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-red-500">{t("portal.attendance")}</h2>
            <div className="mt-4 rounded-xl border border-neutral-800 bg-neutral-900 p-5">
              {!mine.summary ? (
                <p className="text-neutral-500">{t("portal.attendanceEmpty")}</p>
              ) : (
                <>
                  <div className="flex flex-wrap items-end gap-8">
                    <div>
                      <div
                        className={`text-5xl font-black ${rateColor(mine.summary.rate)}`}
                        dir="ltr"
                      >
                        {mine.summary.rate}%
                      </div>
                      <div className="text-xs text-neutral-400">{t("portal.rate")}</div>
                    </div>
                    <div>
                      <div className="text-2xl font-bold" dir="ltr">
                        {mine.summary.attended}/{mine.summary.events}
                      </div>
                      <div className="text-xs text-neutral-400">
                        {t("portal.eventsAttended")}
                      </div>
                    </div>
                    <div>
                      <div className="text-2xl font-bold" dir="ltr">
                        {mine.summary.responseRate}%
                      </div>
                      <div className="text-xs text-neutral-400">
                        {t("portal.repliesGiven")}
                      </div>
                    </div>
                    <div>
                      <div
                        className={`text-2xl font-bold ${
                          mine.summary.no_shows > 0 ? "text-red-400" : ""
                        }`}
                      >
                        {mine.summary.no_shows}
                      </div>
                      <div className="text-xs text-neutral-400">{t("portal.noShows")}</div>
                    </div>
                  </div>

                  <div className="mt-5 space-y-2">
                    {mine.history.map((h, i) => (
                      <div key={i} className="flex items-center gap-3 text-sm">
                        <span>{TYPES[h.type].icon}</span>
                        <span className="flex-1 truncate">{h.title}</span>
                        <span className="text-xs text-neutral-500">
                          {formatWhen(h.starts_at, lang)}
                        </span>
                        <span className="text-xs text-neutral-500">
                          {said[h.status] ?? t("portal.noReply")}
                        </span>
                        <span
                          className={`rounded-full px-2 py-0.5 text-xs font-semibold ${
                            h.attended
                              ? "bg-green-900 text-green-300"
                              : "bg-red-900 text-red-300"
                          }`}
                        >
                          {h.attended ? t("portal.came") : t("portal.missed")}
                        </span>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </div>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-red-500">{t("portal.payments")}</h2>
            <div className="mt-4 rounded-xl border border-neutral-800 bg-neutral-900 p-5">
              {money.open.length === 0 ? (
                <p className="text-neutral-400">{t("portal.noDebt")}</p>
              ) : (
                <>
                  <div className="flex items-end gap-3">
                    <div className="text-4xl font-black text-red-500" dir="ltr">
                      {formatMoney(money.outstanding)}
                    </div>
                    <div className="pb-1 text-sm text-neutral-400">{t("portal.toPay")}</div>
                  </div>

                  {payInfo && (
                    <p className="mt-3 whitespace-pre-wrap rounded-lg border border-neutral-800 bg-neutral-950 p-3 text-sm text-neutral-300">
                      <span className="text-neutral-500">{t("portal.howToPay")} </span>
                      {payInfo}
                    </p>
                  )}

                  <div className="mt-4 space-y-3">
                    {money.open.map((m) => (
                      <div
                        key={m.id}
                        className="rounded-lg border border-neutral-800 bg-neutral-950 p-4"
                      >
                        <div className="flex flex-wrap items-center gap-3">
                          <span className="text-xl">{CATEGORIES[m.category].icon}</span>
                          <span className="font-semibold">{m.title}</span>
                          <span className="ms-auto text-lg font-bold" dir="ltr">
                            {formatMoney(m.amount_cents)}
                          </span>
                        </div>
                        {m.reason && (
                          <p className="mt-2 whitespace-pre-wrap text-sm text-neutral-300">
                            {m.reason}
                          </p>
                        )}
                        {m.due_at && (
                          <p
                            className={`mt-2 text-xs ${
                              m.due_at < today
                                ? "font-semibold text-red-400"
                                : "text-neutral-500"
                            }`}
                          >
                            {m.due_at < today ? t("portal.overdue") : t("portal.due")}
                            {m.due_at}
                          </p>
                        )}
                        <form action={claimPaid} className="mt-3">
                          <input type="hidden" name="chargeId" value={m.id} />
                          <input type="hidden" name="claim" value={m.claimed_at ? "0" : "1"} />
                          <button
                            className={`rounded-lg border px-4 py-1.5 text-sm ${
                              m.claimed_at
                                ? "border-gold text-gold"
                                : "border-neutral-700 hover:border-red-600"
                            }`}
                          >
                            {m.claimed_at ? t("portal.waiting") : t("portal.paidBtn")}
                          </button>
                        </form>
                      </div>
                    ))}
                  </div>
                </>
              )}

              {money.paid.length > 0 && (
                <div className="mt-6">
                  <p className="text-xs uppercase text-neutral-500">
                    {t("portal.recentlyPaid")}
                  </p>
                  <div className="mt-2 space-y-1">
                    {money.paid.map((m) => (
                      <div
                        key={m.id}
                        className="flex items-center gap-3 text-sm text-neutral-400"
                      >
                        <span>{CATEGORIES[m.category].icon}</span>
                        <span className="flex-1 truncate">{m.title}</span>
                        <span dir="ltr">{formatMoney(m.amount_cents)}</span>
                        <span className="text-xs text-green-400" dir="ltr">
                          ✅ {m.paid_at.slice(0, 10)}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-red-500">
              {t("portal.announcements")}
            </h2>
            <div className="mt-4 space-y-3">
              {announcements.length === 0 && (
                <p className="text-neutral-500">{t("portal.noAnnouncements")}</p>
              )}
              {announcements.map((a) => (
                <article
                  key={a.id}
                  className="rounded-xl border border-neutral-800 bg-neutral-900 p-5"
                >
                  <div className="flex items-center gap-2 text-xs text-neutral-500">
                    <span dir="ltr">{a.created_at.slice(0, 10)}</span>
                    {a.visibility === "players" && (
                      <span className="rounded-full bg-yellow-900 px-2 py-0.5 text-yellow-300">
                        {t("common.playersOnly")}
                      </span>
                    )}
                  </div>
                  <h3 className="mt-1 text-lg font-semibold">{a.title}</h3>
                  {a.kind === "teams" && a.data ? (
                    <div className="mt-4">
                      <TeamCards
                        teams={JSON.parse(a.data).teams}
                        labels={teamLabels}
                        inner
                      />
                    </div>
                  ) : (
                    <p className="mt-2 whitespace-pre-wrap text-neutral-300">{a.body}</p>
                  )}
                </article>
              ))}
            </div>
          </section>
        </div>
      </div>
    </main>
  );
}