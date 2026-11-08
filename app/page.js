import Link from "next/link";
import db from "@/lib/db";
import Logo from "@/components/Logo";
import PlayerPhoto from "@/components/PlayerPhoto";
import Countdown from "@/components/Countdown";
import { formatWhen, nowInJinzhou } from "@/lib/format";
import { getT } from "@/lib/i18n";

export const dynamic = "force-dynamic";

const tiles = [
  ["/about", "nav.about", "ℹ️"],
  ["/news", "nav.news", "📰"],
  ["/fixtures", "nav.fixtures", "⚽"],
  ["/stats", "nav.stats", "📊"],
  ["/gallery", "nav.gallery", "📸"],
  ["/contact", "nav.contact", "📬"],
  ["/install", "nav.install", "📲"],
];

const card =
  "rl-reveal block rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur transition hover:border-white/30";

export default async function Home() {
  const { t, lang } = await getT();
  const now = nowInJinzhou();

  const next = db
    .prepare(
      "SELECT * FROM events WHERE type = 'match' AND starts_at >= ? ORDER BY starts_at ASC LIMIT 1"
    )
    .get(now);

  const last = db
    .prepare(
      `SELECT * FROM events
       WHERE type = 'match' AND starts_at < ? AND score_for IS NOT NULL AND score_against IS NOT NULL
       ORDER BY starts_at DESC LIMIT 1`
    )
    .get(now);

  const scorer = db
    .prepare(
      `SELECT p.id, p.number, p.name, p.photo, SUM(s.goals) AS goals
       FROM players p JOIN match_stats s ON s.player_id = p.id
       GROUP BY p.id HAVING goals > 0
       ORDER BY goals DESC, p.name LIMIT 1`
    )
    .get();

  const matchName = (m) => (m.opponent ? t("fixtures.vs", { opponent: m.opponent }) : m.title);

  const outcome = last
    ? last.score_for > last.score_against
      ? { label: t("fixtures.win"), style: "bg-green-600" }
      : last.score_for < last.score_against
      ? { label: t("fixtures.loss"), style: "bg-red-700" }
      : { label: t("fixtures.draw"), style: "bg-neutral-600" }
    : null;

  // The scrolling band repeats the same text; the second half makes the loop seamless
  const band = Array.from({ length: 4 }, () => t("home.marquee"));
  const bandItems = [...band, ...band];
  const tracking = lang === "ar" ? "" : "tracking-[0.3em]";

  return (
    <main className="min-h-screen overflow-x-hidden bg-neutral-950 text-white">
      {/* HERO */}
      <section className="relative isolate flex min-h-[92vh] flex-col items-center justify-center overflow-hidden px-6 py-16 text-center">
        <div className="rl-blob rl-blob-green" aria-hidden />
        <div className="rl-blob rl-blob-red" aria-hidden />

        {/* Slowly turning star, a nod to the Moroccan flag */}
        <div
          className="pointer-events-none absolute inset-0 -z-10 flex items-center justify-center"
          aria-hidden
        >
          <svg viewBox="0 0 100 100" className="rl-spin h-[120vmin] w-[120vmin] opacity-20">
            <polygon
              points="50,2 61,36 98,36 68,57 79,92 50,71 21,92 32,57 2,36 39,36"
              fill="none"
              stroke="#12a85f"
              strokeWidth="0.4"
            />
          </svg>
        </div>

        {/* Big outlined name behind the badge */}
        <div
          className="pointer-events-none absolute inset-x-0 top-1/2 -z-10 -translate-y-1/2 select-none whitespace-nowrap text-center text-[15vw] font-black leading-none tracking-tighter text-transparent opacity-10"
          style={{ WebkitTextStroke: "2px #ffffff" }}
          dir="ltr"
          aria-hidden
        >
          RED LIONS
        </div>

        <h1 className="sr-only">{t("home.title")}</h1>

        <div className="rl-fade-up">
          <div className="rl-float">
            <div className="rl-glow">
              <Logo width={250} priority />
            </div>
          </div>
        </div>

        <p className="rl-fade-up rl-d2 mt-6 text-lg text-neutral-200">{t("home.tagline")}</p>

        <div className="rl-fade-up rl-d3 mt-8 flex flex-wrap items-center justify-center gap-3">
          <Link
            href="/squad"
            className="rl-shine rounded-full bg-red-600 px-8 py-3.5 text-lg font-bold text-white shadow-lg shadow-red-950/60 transition hover:scale-105 hover:bg-red-500"
          >
            {t("home.meetSquad")}
          </Link>
          <Link
            href="/login"
            className="rounded-full border-2 border-emerald-500 px-8 py-3 text-lg font-semibold text-emerald-300 transition hover:bg-emerald-500 hover:text-neutral-950"
          >
            {t("nav.login")}
          </Link>
        </div>
      </section>

      {/* SCROLLING BAND */}
      <div
        className="rl-marquee bg-gradient-to-r from-green-900 via-red-700 to-green-900 py-3 text-sm font-bold uppercase text-gold"
        aria-hidden
      >
        <div className="rl-marquee-track">
          {bandItems.map((text, i) => (
            <span key={i} className={`whitespace-nowrap px-8 ${tracking}`}>
              ★ {text}
            </span>
          ))}
        </div>
      </div>

      {/* LIVE CARDS */}
      <section className="mx-auto max-w-6xl px-6 py-16">
        <div className="grid gap-5 md:grid-cols-3">
          <Link href="/fixtures" className={`${card} border-t-4 !border-t-red-600`}>
            <div className="flex items-center gap-2 text-sm font-semibold text-red-400">
              <span className="rl-live inline-block h-2.5 w-2.5 rounded-full bg-red-500" />
              {t("home.nextMatch")}
            </div>
            {next ? (
              <>
                <div className="mt-3 text-xl font-bold">{matchName(next)}</div>
                <div className="mt-1 text-sm text-neutral-300">
                  {formatWhen(next.starts_at, lang)}
                </div>
                {next.location && (
                  <div className="mt-1 text-sm text-neutral-400">📍 {next.location}</div>
                )}
                <div className="mt-4">
                  <Countdown startsAt={next.starts_at} />
                </div>
              </>
            ) : (
              <p className="mt-3 text-neutral-300">{t("home.noMatch")}</p>
            )}
          </Link>

          <Link href="/fixtures" className={`${card} border-t-4 !border-t-emerald-500`}>
            <div className="text-sm font-semibold text-emerald-400">{t("home.lastResult")}</div>
            {last ? (
              <>
                <div className="mt-3 text-lg font-bold">{matchName(last)}</div>
                <div className="mt-1 text-sm text-neutral-300">
                  {formatWhen(last.starts_at, lang)}
                </div>
                <div className="mt-4 flex items-center gap-4">
                  <div className="text-5xl font-black" dir="ltr">
                    {last.score_for} – {last.score_against}
                  </div>
                  <span className={`rounded-full px-3 py-1 text-sm font-bold ${outcome.style}`}>
                    {outcome.label}
                  </span>
                </div>
              </>
            ) : (
              <p className="mt-3 text-neutral-300">{t("home.noResult")}</p>
            )}
          </Link>

          <Link
            href={scorer ? `/squad/${scorer.id}` : "/stats"}
            className={`${card} border-t-4 !border-t-gold`}
          >
            <div className="text-sm font-semibold text-gold">⚽ {t("home.topScorer")}</div>
            {scorer ? (
              <div className="mt-4 flex items-center gap-4">
                <PlayerPhoto
                  player={scorer}
                  className="h-20 w-20 shrink-0 rounded-xl border-2 border-gold"
                />
                <div>
                  <div className="text-xl font-bold">
                    <span className="text-red-500">{scorer.number}</span> {scorer.name}
                  </div>
                  <div className="mt-1 text-2xl font-black">
                    {t("home.goalsCount", { n: scorer.goals })}
                  </div>
                </div>
              </div>
            ) : (
              <p className="mt-3 text-neutral-300">{t("home.noScorer")}</p>
            )}
          </Link>
        </div>

        {/* EXPLORE TILES */}
        <h2 className="rl-reveal mt-16 text-center text-2xl font-bold">{t("home.explore")}</h2>
        <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4">
          {tiles.map(([href, key, icon], i) => (
            <Link
              key={href}
              href={href}
              className={`rl-tile rl-reveal rounded-2xl border border-white/10 border-t-4 bg-white/5 p-5 text-center ${
                i % 2 === 0 ? "!border-t-red-600" : "!border-t-emerald-500"
              }`}
            >
              <div className="text-3xl">{icon}</div>
              <div className="mt-2 text-sm font-semibold">{t(key)}</div>
            </Link>
          ))}
        </div>
      </section>
    </main>
  );
}