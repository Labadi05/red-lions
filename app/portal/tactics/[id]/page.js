import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import db from "@/lib/db";
import { getSession } from "@/lib/session";
import { getT } from "@/lib/i18n";
import { CATEGORIES, cleanBoard } from "@/lib/tacticsData";
import PortalShell from "@/components/portal/PortalShell";
import TacticViewer from "@/components/tactics/TacticViewer";

export const dynamic = "force-dynamic";

export default async function PlayerTacticPage({ params }) {
  const { t } = await getT();

  const session = await getSession();
  if (!session) redirect("/login");

  const { id } = await params;

  // Only tactics the captain has shown to players
  const row = db
    .prepare(
      `SELECT t.*, e.title AS match_title
       FROM tactics t LEFT JOIN events e ON e.id = t.event_id
       WHERE t.id = ? AND t.published = 1`
    )
    .get(Number(id));
  if (!row) notFound();

  const board = cleanBoard(row.data);
  if (!board) notFound();

  const cat = CATEGORIES[row.category] ?? CATEGORIES.other;

  return (
    <PortalShell active="home" width="max-w-3xl">
      <Link href="/portal#tactics" className="text-sm text-gold hover:underline">
        {t("common.backPortal")}
      </Link>

      <div className="rl-fade-up mt-4">
        <div className="flex flex-wrap items-center gap-3">
          <h1 className="text-3xl font-black">{row.title}</h1>
          <span className="rounded-full bg-white/10 px-3 py-1 text-xs font-semibold">
            {cat.icon} {t(`tactic.cat.${row.category}`)}
          </span>
        </div>
        {row.match_title && <p className="mt-2 text-sm text-neutral-300">⚽ {row.match_title}</p>}
      </div>

      <div className="mt-6">
        <TacticViewer board={board} title={row.title} />
      </div>

      {row.notes && (
        <section className="mt-8 rounded-2xl border border-[#1c3a29] bg-[#0a1810] p-5">
          <h2 className="text-sm font-black uppercase tracking-[0.25em] text-gold">
            {t("tactic.notes")}
          </h2>
          <p className="mt-3 whitespace-pre-wrap text-neutral-200">{row.notes}</p>
        </section>
      )}
    </PortalShell>
  );
}