import db from "@/lib/db";
import PublicShell from "@/components/PublicShell";
import { formatWhen, nowInJinzhou } from "@/lib/format";
import { getT } from "@/lib/i18n";

export const dynamic = "force-dynamic";
export const metadata = { title: "Fixtures & Results — Red Lions" };

export default async function FixturesPage() {
  const { t, lang } = await getT();
  const now = nowInJinzhou();

  const upcoming = db
    .prepare("SELECT * FROM events WHERE type = 'match' AND starts_at >= ? ORDER BY starts_at ASC")
    .all(now);
  const past = db
    .prepare("SELECT * FROM events WHERE type = 'match' AND starts_at < ? ORDER BY starts_at DESC")
    .all(now);

  const played = past.filter((m) => m.score_for !== null && m.score_against !== null);
  const wins = played.filter((m) => m.score_for > m.score_against).length;
  const draws = played.filter((m) => m.score_for === m.score_against).length;
  const losses = played.filter((m) => m.score_for < m.score_against).length;
  const goalsFor = played.reduce((sum, m) => sum + m.score_for, 0);
  const goalsAgainst = played.reduce((sum, m) => sum + m.score_against, 0);

  const matchName = (m) =>
    m.opponent ? t("fixtures.vs", { opponent: m.opponent }) : m.title;

  return (
    <PublicShell
      title={`${t("fixtures.title")} ⚽`}
      subtitle={t("fixtures.subtitle")}
      width="max-w-3xl"
    >
      {played.length > 0 && (
        <div className="grid grid-cols-5 gap-2 text-center">
          {[
            [t("fixtures.played"), played.length],
            [t("fixtures.won"), wins],
            [t("fixtures.drawn"), draws],
            [t("fixtures.lost"), losses],
            [t("fixtures.goals"), `${goalsFor}-${goalsAgainst}`],
          ].map(([label, value], i) => (
            <div
              key={label}
              className={`rounded-xl border border-neutral-800 border-t-4 bg-neutral-900 py-3 ${
                i % 2 === 0 ? "!border-t-red-600" : "!border-t-emerald-500"
              }`}
            >
              <div className="text-2xl font-black" dir="ltr">
                {value}
              </div>
              <div className="text-xs text-neutral-400">{label}</div>
            </div>
          ))}
        </div>
      )}

      <h2 className="mt-10 flex items-center gap-3 text-xl font-bold">
        <span className="h-6 w-1.5 rounded-full bg-red-600" />
        {t("fixtures.upcoming")}
      </h2>
      <div className="mt-4 space-y-3">
        {upcoming.length === 0 && (
          <p className="text-neutral-400">{t("fixtures.noUpcoming")}</p>
        )}
        {upcoming.map((m) => (
          <div
            key={m.id}
            className="rl-reveal rounded-xl border border-neutral-800 bg-neutral-900 p-5"
          >
            <div className="text-lg font-semibold">{matchName(m)}</div>
            <div className="mt-1 text-sm text-neutral-300">{formatWhen(m.starts_at, lang)}</div>
            {m.location && <div className="mt-1 text-sm text-neutral-400">📍 {m.location}</div>}
          </div>
        ))}
      </div>

      <h2 className="mt-12 flex items-center gap-3 text-xl font-bold">
        <span className="h-6 w-1.5 rounded-full bg-emerald-500" />
        {t("fixtures.results")}
      </h2>
      <div className="mt-4 space-y-3">
        {past.length === 0 && <p className="text-neutral-400">{t("fixtures.noResults")}</p>}
        {past.map((m) => {
          const hasScore = m.score_for !== null && m.score_against !== null;
          const outcome = !hasScore
            ? null
            : m.score_for > m.score_against
            ? { label: t("fixtures.win"), style: "bg-green-700 text-white" }
            : m.score_for < m.score_against
            ? { label: t("fixtures.loss"), style: "bg-red-700 text-white" }
            : { label: t("fixtures.draw"), style: "bg-neutral-600 text-white" };

          return (
            <div
              key={m.id}
              className="rl-reveal flex items-center gap-4 rounded-xl border border-neutral-800 bg-neutral-900 p-5"
            >
              <div className="min-w-0 flex-1">
                <div className="font-semibold">{matchName(m)}</div>
                <div className="mt-1 text-sm text-neutral-300">
                  {formatWhen(m.starts_at, lang)}
                </div>
              </div>
              {hasScore ? (
                <>
                  <div className="text-2xl font-black" dir="ltr">
                    {m.score_for} – {m.score_against}
                  </div>
                  <span
                    className={`rounded-full px-2.5 py-1 text-xs font-bold ${outcome.style}`}
                  >
                    {outcome.label}
                  </span>
                </>
              ) : (
                <span className="text-sm text-neutral-400">{t("fixtures.resultToCome")}</span>
              )}
            </div>
          );
        })}
      </div>
    </PublicShell>
  );
}