import Link from "next/link";
import db from "@/lib/db";
import { getT } from "@/lib/i18n";

export const dynamic = "force-dynamic";
export const metadata = { title: "Stats — Red Lions" };

function Board({ title, icon, rows, field, noData }) {
  const ranked = rows
    .filter((r) => r[field] > 0)
    .sort((a, b) => b[field] - a[field] || a.name.localeCompare(b.name))
    .slice(0, 10);

  return (
    <section className="rounded-xl border border-neutral-800 bg-neutral-900 p-5">
      <h2 className="text-lg font-semibold text-red-500">
        {icon} {title}
      </h2>
      {ranked.length === 0 ? (
        <p className="mt-3 text-sm text-neutral-500">{noData}</p>
      ) : (
        <ol className="mt-3 space-y-2">
          {ranked.map((r, i) => (
            <li key={r.id} className="flex items-center gap-3 text-sm">
              <span className="w-5 text-neutral-500">{i + 1}</span>
              <span className="w-8 font-black text-red-600">{r.number}</span>
              <span className="flex-1">{r.name}</span>
              <span className="text-lg font-bold">{r[field]}</span>
            </li>
          ))}
        </ol>
      )}
    </section>
  );
}

export default async function StatsPage() {
  const { t } = await getT();

  const rows = db
    .prepare(
      `SELECT p.id, p.number, p.name,
              SUM(s.played) AS apps, SUM(s.goals) AS goals,
              SUM(s.assists) AS assists, SUM(s.motm) AS motm
       FROM players p
       JOIN match_stats s ON s.player_id = p.id
       GROUP BY p.id`
    )
    .all();

  return (
    <main className="min-h-screen bg-neutral-950 px-6 py-12 text-white">
      <div className="mx-auto max-w-4xl">
        <Link href="/" className="text-sm text-red-400 hover:underline">
          {t("common.backHome")}
        </Link>
        <h1 className="mt-4 text-4xl font-bold">{t("stats.title")} 📊</h1>
        <p className="mt-2 text-neutral-400">
          {t("stats.subtitle")}{" "}
          <Link href="/fixtures" className="text-red-400 hover:underline">
            {t("stats.teamResults")}
          </Link>
        </p>

        <div className="mt-8 grid gap-4 md:grid-cols-2">
          <Board title={t("stats.scorers")} icon="⚽" rows={rows} field="goals" noData={t("stats.noData")} />
          <Board title={t("stats.assists")} icon="🎯" rows={rows} field="assists" noData={t("stats.noData")} />
          <Board title={t("stats.motm")} icon="⭐" rows={rows} field="motm" noData={t("stats.noData")} />
          <Board title={t("stats.apps")} icon="👟" rows={rows} field="apps" noData={t("stats.noData")} />
        </div>
      </div>
    </main>
  );
}