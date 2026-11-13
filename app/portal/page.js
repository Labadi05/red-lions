import Link from "next/link";
import { redirect } from "next/navigation";
import db from "@/lib/db";
import { getSession } from "@/lib/session";
import { TYPES, formatWhen, nowInJinzhou } from "@/lib/format";
import { getMyAttendance } from "@/lib/attendance";
import { getPolls } from "@/lib/polls";
import { getUnreadCount } from "@/lib/messages";
import { getMyPayments, getPaymentInfo } from "@/lib/money";
import { CATEGORIES, formatMoney } from "@/lib/moneyFormat";
import { getT } from "@/lib/i18n";
import Pitch from "@/components/Pitch";
import Logo from "@/components/Logo";
import TeamCards from "@/components/TeamCards";
import Countdown from "@/components/Countdown";
import PushToggle from "@/components/PushToggle";
import PlayerCard from "@/components/portal/PlayerCard";
import Ring from "@/components/portal/Ring";
import { logout } from "../login/actions";
import { setAttendance, vote, claimPaid } from "./actions";
import VoteForm from "@/components/portal/VoteForm";
import BoardSvg from "@/components/tactics/BoardSvg";
import { CATEGORIES as TACTIC_CATEGORIES, cleanBoard } from "@/lib/tacticsData";

export const dynamic = "force-dynamic";

const panel = "rounded-2xl border border-[#1c3a29] bg-[#0a1810] p-5";
const ringColor = (rate) => (rate >= 80 ? "#34d399" : rate >= 50 ? "#facc15" : "#f87171");

function PitchLines() {
  return (
    <svg
      className="pointer-events-none absolute inset-0 h-full w-full opacity-[0.07]"
      viewBox="0 0 800 400"
      preserveAspectRatio="xMidYMid slice"
      aria-hidden
    >
      <g fill="none" stroke="#fff" strokeWidth="2">
        <rect x="20" y="20" width="760" height="360" rx="4" />
        <line x1="400" y1="20" x2="400" y2="380" />
        <circle cx="400" cy="200" r="55" />
        <rect x="20" y="110" width="110" height="180" />
        <rect x="670" y="110" width="110" height="180" />
        <rect x="20" y="150" width="45" height="100" />
        <rect x="735" y="150" width="45" height="100" />
      </g>
    </svg>
  );
}

function SectionTitle({ id, children }) {
  return (
    <h2
      id={id}
      className="flex scroll-mt-24 items-center gap-3 text-sm font-black uppercase tracking-[0.25em] text-gold"
    >
      <span className="h-px w-8 bg-gold/60" />
      {children}
    </h2>
  );
}

export default async function PortalPage() {
  const { t, lang } = await getT();

  const session = await getSession();
  if (!session) redirect("/login");

  const me = db
    .prepare(
      `SELECT u.username, u.role, p.id AS player_id, p.name, p.number, p.position, p.photo, p.is_captain
       FROM users u LEFT JOIN players p ON p.id = u.player_id
       WHERE u.id = ?`
    )
    .get(session.uid);

  if (!me) redirect("/login");

  const player = { name: me.name ?? me.username, photo: me.photo };

  const pstats = me.player_id
    ? db
        .prepare(
          `SELECT COALESCE(SUM(played), 0) AS apps, COALESCE(SUM(goals), 0) AS goals,
                  COALESCE(SUM(assists), 0) AS assists, COALESCE(SUM(motm), 0) AS motm
           FROM match_stats WHERE player_id = ?`
        )
        .get(me.player_id)
    : { apps: 0, goals: 0, assists: 0, motm: 0 };

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
  const next = events[0] ?? null;
  const later = events.slice(1);

  const allPolls = getPolls(session.uid);
  const polls = [
    ...allPolls.filter((p) => !p.closed),
    ...allPolls.filter((p) => p.closed).slice(0, 3),
  ];
  const pollsToVote = allPolls.filter((p) => !p.closed && !p.myVote).length;
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

    const tacticRows = db
    .prepare(
      "SELECT id, title, category, event_id, data FROM tactics WHERE published = 1 ORDER BY id DESC LIMIT 30"
    )
    .all();
  const tactics = tacticRows
    .map((r) => ({ ...r, board: cleanBoard(r.data) }))
    .filter((r) => r.board);
  const tacticByEvent = Object.fromEntries(
    tactics.filter((x) => x.event_id).map((x) => [x.event_id, x])
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
  const cardLabels = {
    app: t("card.app"),
    goals: t("card.goals"),
    assists: t("card.assists"),
    motm: t("card.motm"),
  };

  // The answer buttons (Coming / Maybe / Can't come), light version is for the ticket
  const rsvp = (e, light = false) => (
    <form action={setAttendance} className="space-y-2">
      <input type="hidden" name="eventId" value={e.id} />
      <input
        name="reason"
        defaultValue={e.my_reason ?? ""}
        placeholder={t("portal.reasonPlaceholder")}
        className={`w-full rounded-lg border px-3 py-1.5 text-sm outline-none focus:border-red-600 ${
          light
            ? "border-neutral-400 bg-white text-neutral-900 placeholder:text-neutral-500"
            : "border-neutral-700 bg-neutral-950 text-white"
        }`}
      />
      <div className="grid grid-cols-3 gap-2">
        {[
          ["yes", t("portal.coming")],
          ["maybe", t("portal.maybe")],
          ["no", t("portal.cantCome")],
        ].map(([value, label]) => (
          <button
            key={value}
            name="status"
            value={value}
            className={`rounded-lg border px-1 py-2 text-xs font-semibold leading-tight sm:text-sm ${
              e.my_status === value
                ? "border-red-600 bg-red-600 text-white"
                : light
                ? "border-neutral-500 text-neutral-800 hover:border-red-600"
                : "border-neutral-700 hover:border-red-600"
            }`}
          >
            {label}
          </button>
        ))}
      </div>
    </form>
  );

  const lineup = (e) =>
    e.type === "match" && e.lineup_published === 1 ? (
      <details className="mt-4" open>
        <summary className="cursor-pointer text-sm font-bold text-gold">
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
                  playersById[id] ? `${playersById[id].number} ${playersById[id].name}` : null
                )
                .filter(Boolean)
                .join(" · ")}
            </p>
          )}
        </div>
      </details>
    ) : null;

  const dials = [
    {
      href: "#attendance",
      label: t("portal.dial.attendance"),
      body: (
        <Ring
          value={mine.summary?.rate ?? 0}
          color={ringColor(mine.summary?.rate ?? 0)}
          size={56}
          stroke={6}
        >
          {mine.summary ? `${mine.summary.rate}%` : "—"}
        </Ring>
      ),
    },
    {
      href: "#payments",
      label: t("portal.dial.due"),
      body: (
        <span
          className={`text-2xl font-black ${money.outstanding > 0 ? "text-red-400" : "text-emerald-400"}`}
          dir="ltr"
        >
          {money.outstanding > 0 ? formatMoney(money.outstanding) : "✓"}
        </span>
      ),
    },
    {
      href: "/portal/inbox",
      label: t("portal.dial.inbox"),
      body: (
        <span className={`text-2xl font-black ${unread > 0 ? "text-red-400" : ""}`} dir="ltr">
          {unread}
        </span>
      ),
    },
    {
      href: "#polls",
      label: t("portal.dial.polls"),
      body: (
        <span className={`text-2xl font-black ${pollsToVote > 0 ? "text-gold" : ""}`} dir="ltr">
          {pollsToVote}
        </span>
      ),
    },
  ];

  const tabs = [
    ["#top", "🏠", t("portal.tab.home"), 0],
    ["#events", "📅", t("portal.tab.events"), 0],
    ["/portal/inbox", "📬", t("portal.tab.inbox"), unread],
    ["#payments", "💰", t("portal.tab.pay"), 0],
    ["#more", "☰", t("portal.tab.more"), 0],
  ];

  const topLinks = [
    ["#events", t("portal.tab.events")],
    ["#polls", t("portal.polls")],
    ["#payments", t("portal.tab.pay")],
    ["#attendance", t("portal.dial.attendance")],
  ];

  const moreLink =
    "rounded-xl border border-[#1c3a29] bg-[#0a1810] px-4 py-3 text-center text-sm hover:border-gold";

  return (
    <main id="top" className="rl-locker min-h-screen text-white">
      {/* Top bar */}
      <header className="sticky top-0 z-30 border-b border-gold/20 bg-[#050d08]/85 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center gap-3 px-6 py-2.5 pe-36">
          <Link href="/" aria-label="Red Lions">
            <Logo width={36} />
          </Link>
          <span className="font-black" dir="ltr">
            RED <span className="text-red-500">LIONS</span>
          </span>
          <span className="hidden text-xs font-bold uppercase tracking-[0.25em] text-gold sm:inline">
            {t("portal.title")}
          </span>
          <nav className="ms-auto hidden items-center gap-1 lg:flex">
            {topLinks.map(([href, label]) => (
              <a
                key={href}
                href={href}
                className="rounded-full px-3 py-1.5 text-sm text-neutral-300 hover:bg-white/10 hover:text-white"
              >
                {label}
              </a>
            ))}
            <Link
              href="/portal/inbox"
              className={`rounded-full px-3 py-1.5 text-sm ${
                unread > 0
                  ? "bg-red-600 font-semibold"
                  : "text-neutral-300 hover:bg-white/10 hover:text-white"
              }`}
            >
              {unread > 0 ? t("portal.inboxNew", { n: unread }) : t("portal.inbox")}
            </Link>
          </nav>
        </div>
      </header>

      {/* Hero: card, ticket and dials */}
      <section className="relative overflow-hidden">
        <PitchLines />
        <div
          className="pointer-events-none absolute -bottom-6 end-2 select-none text-[34vw] font-black leading-none text-transparent opacity-[0.12] lg:text-[17rem]"
          style={{ WebkitTextStroke: "2px #d4a017" }}
          dir="ltr"
          aria-hidden
        >
          {me.number}
        </div>

        <div className="relative mx-auto grid max-w-6xl gap-8 px-6 py-10 lg:grid-cols-[320px_1fr]">
          <div className="rl-fade-up">
            <PlayerCard
              player={player}
              number={me.number}
              position={me.position ? t(`pos.${me.position}`) : t("portal.teamMember")}
              isCaptain={me.is_captain === 1}
              stats={pstats}
              labels={cardLabels}
            />
          </div>

          <div className="min-w-0">
            <div className="rl-fade-up rl-d1">
              <h1 className="text-3xl font-black">
                {t("portal.welcome", { name: player.name })}
              </h1>
              <p className="mt-1 text-neutral-300">{t("portal.welcomeSub")}</p>
            </div>

            {/* The matchday ticket */}
            <div className="rl-fade-up rl-d2 mt-6">
              <div className="mb-2 text-xs font-black uppercase tracking-[0.25em] text-gold">
                {t("portal.nextUp")}
              </div>

              {next ? (
                <>
                  <div className="drop-shadow-2xl">
                    <div
                      className="rl-ticket relative bg-[#f6efdc] text-neutral-900"
                      style={{ "--stub": "140px" }}
                    >
                      <div className="p-6 pb-5">
                        <div className="flex items-center justify-between text-xs font-bold uppercase tracking-widest text-neutral-500">
                          <span>
                            {TYPES[next.type].icon} {t(`portal.type.${next.type}`)}
                          </span>
                          <span className="rounded-full bg-red-600 px-2 py-0.5 text-white">
                            {t("portal.nextUp")}
                          </span>
                        </div>
                        <h3 className="mt-3 text-2xl font-black leading-tight">{next.title}</h3>
                        <p className="mt-1 font-semibold text-neutral-700">
                          {formatWhen(next.starts_at, lang)}
                        </p>
                        {next.location && (
                          <p className="text-sm text-neutral-600">📍 {next.location}</p>
                        )}
                        {next.notes && (
                          <p className="mt-2 whitespace-pre-wrap text-sm text-neutral-600">
                            {next.notes}
                          </p>
                        )}
                        <div className="mt-4">
                          <Countdown startsAt={next.starts_at} light />
                        </div>
                      </div>
                      <div
                        className="border-t-2 border-dashed border-neutral-400/70 px-6 pt-3"
                        style={{ minHeight: "var(--stub)" }}
                      >
                        {rsvp(next, true)}
                      </div>
                    </div>
                  </div>
                  {lineup(next) && <div className={`${panel} mt-4`}>{lineup(next)}</div>}
                    {tacticByEvent[next.id] && (
                    <Link
                      href={`/portal/tactics/${tacticByEvent[next.id].id}`}
                      className="mt-4 flex items-center gap-3 rounded-2xl border border-gold/60 bg-[#0a1810] px-4 py-3 text-sm font-semibold hover:bg-[#12301f]"
                    >
                      🧠 {t("portal.tacticFor")}:{" "}
                      <span className="text-gold">{tacticByEvent[next.id].title}</span>
                    </Link>
                  )}
                </>
              ) : (
                <div className={panel}>
                  <p className="text-neutral-300">{t("portal.nothingNext")}</p>
                </div>
              )}
            </div>

            {/* Dials */}
            <div className="rl-fade-up rl-d3 mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
              {dials.map((d) => {
                const Tag = d.href.startsWith("#") ? "a" : Link;
                return (
                  <Tag
                    key={d.label}
                    href={d.href}
                    className="rl-tile flex flex-col items-center justify-center gap-2 rounded-2xl border border-[#1c3a29] bg-[#0a1810] px-3 py-4 text-center hover:border-gold"
                  >
                    {d.body}
                    <span className="text-xs font-semibold text-neutral-300">{d.label}</span>
                  </Tag>
                );
              })}
            </div>

            <div className="rl-fade-up rl-d4 mt-4">
              <PushToggle publicKey={process.env.VAPID_PUBLIC_KEY ?? ""} />
            </div>
          </div>
        </div>
      </section>

      {/* Sections */}
      <div className="mx-auto max-w-6xl space-y-12 px-6 pb-28 pt-4 lg:pb-16">
        <section className="space-y-4">
          <SectionTitle id="events">{t("portal.later")}</SectionTitle>
          {later.length === 0 && (
            <p className="text-neutral-400">{t("portal.laterEmpty")}</p>
          )}
          <div className="grid gap-4 lg:grid-cols-2">
            {later.map((e) => (
              <div key={e.id} className={panel}>
                <div className="flex flex-wrap items-center gap-3">
                  <span className="text-xl">{TYPES[e.type].icon}</span>
                  <span className="text-lg font-bold">{e.title}</span>
                </div>
                <p className="mt-1 text-sm text-neutral-300">{formatWhen(e.starts_at, lang)}</p>
                {e.location && <p className="text-sm text-neutral-400">📍 {e.location}</p>}
                {e.notes && (
                  <p className="mt-2 whitespace-pre-wrap text-sm text-neutral-300">{e.notes}</p>
                )}
                <div className="mt-4">{rsvp(e)}</div>
                {lineup(e)}
                   {tacticByEvent[e.id] && (
                  <Link
                    href={`/portal/tactics/${tacticByEvent[e.id].id}`}
                    className="mt-4 flex items-center gap-2 rounded-xl border border-gold/60 px-4 py-2.5 text-sm font-semibold hover:bg-[#12301f]"
                  >
                    🧠 {t("portal.tacticFor")}:{" "}
                    <span className="text-gold">{tacticByEvent[e.id].title}</span>
                  </Link>
                )}
              </div>
            ))}
          </div>
        </section>

               <section className="space-y-4">
          <SectionTitle id="polls">{t("portal.polls")}</SectionTitle>
          {polls.length === 0 && <p className="text-neutral-400">{t("portal.noPolls")}</p>}
          <div className="grid gap-4 lg:grid-cols-2">
            {polls.map((poll) => {
              const question =
                poll.kind === "motm" && poll.event_id && eventTitles[poll.event_id]
                  ? t("portal.motmQuestion", { title: eventTitles[poll.event_id] })
                  : poll.question;
              const myOption = poll.options.find((o) => o.id === poll.myVote);

              return (
                <div key={poll.id} className={panel}>
                  <div className="flex flex-wrap items-center gap-3">
                    <span className="text-lg font-bold">{question}</span>
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

                  {/* Not voted yet: only the choices, no results */}
                  {!poll.closed && !poll.myVote && (
                    <>
                      <VoteForm
                        action={vote}
                        pollId={poll.id}
                        options={poll.options.map((o) => ({
                          id: o.id,
                          label: o.label,
                          disabled: poll.kind === "motm" && o.player_id === me.player_id,
                        }))}
                      />
                      <p className="mt-2 text-xs text-neutral-400">{t("portal.voteOnce")}</p>
                    </>
                  )}

                  {/* Voted: the choice is locked */}
                  {myOption && (
                    <p className="mt-3 text-sm">
                      <span className="text-neutral-400">{t("portal.yourVote")}: </span>
                      <span className="font-bold text-gold">{myOption.label}</span>
                    </p>
                  )}
                  {!poll.closed && poll.myVote && (
                    <p className="mt-1 text-xs text-neutral-400">{t("portal.voteFinal")}</p>
                  )}

                  {/* Results: after voting, or once the poll has closed */}
                  {(poll.closed || poll.myVote) && (
                    <div className="mt-4 space-y-3">
                      {poll.options.map((o) => {
                        const pct = poll.total ? Math.round((100 * o.count) / poll.total) : 0;
                        const mine = o.id === poll.myVote;
                        return (
                          <div key={o.id}>
                            <div className="flex items-center justify-between text-sm">
                              <span className={mine ? "font-bold text-gold" : ""}>
                                {mine ? "✓ " : ""}
                                {o.label}
                              </span>
                              <span className="text-neutral-400" dir="ltr">
                                {o.count} · {pct}%
                              </span>
                            </div>
                            <div className="mt-1 h-2 overflow-hidden rounded-full bg-neutral-800">
                              <div
                                className={`h-full ${
                                  mine
                                    ? "bg-gold"
                                    : "bg-gradient-to-r from-red-600 to-emerald-500"
                                }`}
                                style={{ width: `${pct}%` }}
                              />
                            </div>
                          </div>
                        );
                      })}
                      <p className="text-xs text-neutral-400">
                        {t("portal.votesCount", { n: poll.total })}
                      </p>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </section>
        
                <section className="space-y-4">
          <SectionTitle id="tactics">{t("portal.tactics")}</SectionTitle>
          {tactics.length === 0 && (
            <p className="text-neutral-400">{t("portal.tacticsEmpty")}</p>
          )}
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {tactics.map((x) => (
              <Link
                key={x.id}
                href={`/portal/tactics/${x.id}`}
                className="rl-tile flex gap-4 rounded-2xl border border-[#1c3a29] bg-[#0a1810] p-4 hover:border-gold"
              >
                <div className="w-20 shrink-0 overflow-hidden rounded-lg border border-neutral-700">
                  <BoardSvg
                    items={x.board.items}
                    positions={x.board.frames[0].pos}
                    draw={x.board.frames[0].draw}
                  />
                </div>
                <div className="min-w-0">
                  <div className="font-bold">{x.title}</div>
                  <div className="mt-1 text-xs text-neutral-400">
                    {TACTIC_CATEGORIES[x.category]?.icon} {t(`tactic.cat.${x.category}`)}
                  </div>
                  {x.board.frames.length > 1 && (
                    <div className="mt-1 text-xs font-semibold text-gold">
                      ▶ {t("tactic.steps", { n: x.board.frames.length })}
                    </div>
                  )}
                </div>
              </Link>
            ))}
          </div>
        </section>
        
        <div className="grid gap-12 lg:grid-cols-2">
          <section className="space-y-4">
            <SectionTitle id="attendance">{t("portal.attendance")}</SectionTitle>
            <div className={panel}>
              {!mine.summary ? (
                <p className="text-neutral-400">{t("portal.attendanceEmpty")}</p>
              ) : (
                <>
                  <div className="flex flex-wrap items-center gap-6">
                    <Ring
                      value={mine.summary.rate}
                      color={ringColor(mine.summary.rate)}
                      size={92}
                      stroke={9}
                    >
                      <span className="text-xl">{mine.summary.rate}%</span>
                    </Ring>
                    <div className="grid flex-1 grid-cols-3 gap-3 text-center">
                      <div>
                        <div className="text-xl font-black" dir="ltr">
                          {mine.summary.attended}/{mine.summary.events}
                        </div>
                        <div className="text-[11px] text-neutral-400">
                          {t("portal.eventsAttended")}
                        </div>
                      </div>
                      <div>
                        <div className="text-xl font-black" dir="ltr">
                          {mine.summary.responseRate}%
                        </div>
                        <div className="text-[11px] text-neutral-400">
                          {t("portal.repliesGiven")}
                        </div>
                      </div>
                      <div>
                        <div
                          className={`text-xl font-black ${
                            mine.summary.no_shows > 0 ? "text-red-400" : ""
                          }`}
                        >
                          {mine.summary.no_shows}
                        </div>
                        <div className="text-[11px] text-neutral-400">{t("portal.noShows")}</div>
                      </div>
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

          <section className="space-y-4">
            <SectionTitle id="payments">{t("portal.payments")}</SectionTitle>
            <div className={panel}>
              {money.open.length === 0 ? (
                <p className="text-neutral-300">{t("portal.noDebt")}</p>
              ) : (
                <>
                  <div className="flex items-end gap-3">
                    <div className="text-4xl font-black text-red-400" dir="ltr">
                      {formatMoney(money.outstanding)}
                    </div>
                    <div className="pb-1 text-sm text-neutral-400">{t("portal.toPay")}</div>
                  </div>

                  {payInfo && (
                    <p className="mt-3 whitespace-pre-wrap rounded-lg border border-[#1c3a29] bg-[#050d08] p-3 text-sm text-neutral-300">
                      <span className="text-neutral-500">{t("portal.howToPay")} </span>
                      {payInfo}
                    </p>
                  )}

                  <div className="mt-4 space-y-3">
                    {money.open.map((m) => (
                      <div
                        key={m.id}
                        className="rounded-lg border border-[#1c3a29] bg-[#050d08] p-4"
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
        </div>

        <section className="space-y-4">
          <SectionTitle id="announcements">{t("portal.announcements")}</SectionTitle>
          {announcements.length === 0 && (
            <p className="text-neutral-400">{t("portal.noAnnouncements")}</p>
          )}
          <div className="space-y-3">
            {announcements.map((a) => (
              <article key={a.id} className={panel}>
                <div className="flex items-center gap-2 text-xs text-neutral-500">
                  <span dir="ltr">{a.created_at.slice(0, 10)}</span>
                  {a.visibility === "players" && (
                    <span className="rounded-full bg-yellow-900 px-2 py-0.5 text-yellow-300">
                      {t("common.playersOnly")}
                    </span>
                  )}
                </div>
                <h3 className="mt-1 text-lg font-bold">{a.title}</h3>
                {a.kind === "teams" && a.data ? (
                  <div className="mt-4">
                    <TeamCards teams={JSON.parse(a.data).teams} labels={teamLabels} inner />
                  </div>
                ) : (
                  <p className="mt-2 whitespace-pre-wrap text-neutral-300">{a.body}</p>
                )}
              </article>
            ))}
          </div>
        </section>

        <section className="space-y-4">
          <SectionTitle id="more">{t("portal.more")}</SectionTitle>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
            <Link href="/gallery" className={moreLink}>
              {t("portal.gallery")}
            </Link>
            <Link href="/squad" className={moreLink}>
              {t("portal.squad")}
            </Link>
            <Link href="/install" className={moreLink}>
              📲 {t("nav.install")}
            </Link>
            <Link href="/" className={moreLink}>
              {t("portal.publicSite")}
            </Link>
            {me.role === "admin" && (
              <Link href="/admin" className={`${moreLink} !border-gold text-gold`}>
                {t("portal.dashboard")}
              </Link>
            )}
            <form action={logout} className="contents">
              <button className={`${moreLink} text-neutral-400`}>{t("portal.logout")}</button>
            </form>
          </div>
        </section>
      </div>

      {/* Phone-app tab bar */}
      <nav className="rl-tabbar fixed inset-x-0 bottom-0 z-40 grid grid-cols-5 border-t border-gold/30 bg-[#050d08]/95 backdrop-blur lg:hidden">
        {tabs.map(([href, icon, label, badge]) => {
          const Tag = href.startsWith("#") ? "a" : Link;
          return (
            <Tag
              key={label}
              href={href}
              className="relative flex flex-col items-center gap-0.5 py-2 text-[11px] text-neutral-300 active:text-gold"
            >
              <span className="text-xl leading-none">{icon}</span>
              {label}
              {badge > 0 && (
                <span className="absolute end-1/4 top-1 rounded-full bg-red-600 px-1.5 text-[10px] font-bold text-white">
                  {badge}
                </span>
              )}
            </Tag>
          );
        })}
      </nav>
    </main>
  );
}