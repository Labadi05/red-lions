import db from "@/lib/db";
import PublicShell from "@/components/PublicShell";
import { getT } from "@/lib/i18n";

export const dynamic = "force-dynamic";
export const metadata = { title: "News — Red Lions" };

export default async function NewsPage() {
  const { t } = await getT();
  const items = db
    .prepare("SELECT * FROM announcements WHERE visibility = 'public' ORDER BY id DESC")
    .all();

  return (
    <PublicShell title={t("news.title")} subtitle={t("news.subtitle")} width="max-w-3xl">
      <div className="space-y-4">
        {items.length === 0 && <p className="text-neutral-400">{t("news.empty")}</p>}
        {items.map((a, i) => (
          <article
            key={a.id}
            className={`rl-reveal rounded-xl border border-neutral-800 border-s-4 bg-neutral-900 p-5 ${
              i % 2 === 0 ? "!border-s-red-600" : "!border-s-emerald-500"
            }`}
          >
            <div className="text-xs text-neutral-400" dir="ltr">
              {a.created_at.slice(0, 10)}
            </div>
            <h2 className="mt-1 text-xl font-bold">{a.title}</h2>
            <p className="mt-2 whitespace-pre-wrap text-neutral-300">{a.body}</p>
          </article>
        ))}
      </div>
    </PublicShell>
  );
}