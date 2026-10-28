import Link from "next/link";
import { notFound } from "next/navigation";
import db from "@/lib/db";
import PlayerPhoto from "@/components/PlayerPhoto";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }) {
  const { id } = await params;
  const p = db.prepare("SELECT name FROM players WHERE id = ?").get(Number(id));
  return { title: p ? `${p.name} — Red Lions` : "Player — Red Lions" };
}

export default async function PlayerProfilePage({ params }) {
  const { id } = await params;

  const player = db.prepare("SELECT * FROM players WHERE id = ?").get(Number(id));
  if (!player) notFound();

  const stats = db
    .prepare(
      `SELECT COALESCE(SUM(played), 0) AS apps,
              COALESCE(SUM(goals), 0) AS goals,
              COALESCE(SUM(assists), 0) AS assists,
              COALESCE(SUM(motm), 0) AS motm
       FROM match_stats WHERE player_id = ?`
    )
    .get(player.id);

  const boxes = [
    ["Appearances", stats.apps],
    ["Goals", stats.goals],
    ["Assists", stats.assists],
    ["Man of the match", stats.motm],
  ];

  return (
    <main className="min-h-screen bg-neutral-950 px-6 py-12 text-white">
      <div className="mx-auto max-w-4xl">
        <Link href="/squad" className="text-sm text-red-400 hover:underline">
          ← Squad
        </Link>

        <div className="mt-6 grid gap-8 md:grid-cols-[320px_1fr]">
          <div className="overflow-hidden rounded-2xl border border-neutral-800">
            <PlayerPhoto player={player} full className="aspect-square w-full text-7xl" />
          </div>

          <div>
            <div className="text-7xl font-black text-red-600">{player.number}</div>
            <h1 className="mt-1 text-4xl font-bold">{player.name}</h1>
            <p className="mt-2 flex items-center gap-3 text-neutral-400">
              {player.position}
              {player.is_captain === 1 && (
                <span className="rounded-md bg-gold px-2 py-0.5 text-xs font-black text-neutral-950">
                  Captain
                </span>
              )}
            </p>

            <div className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-4">
              {boxes.map(([label, value]) => (
                <div
                  key={label}
                  className="rounded-xl border border-neutral-800 bg-neutral-900 p-4 text-center"
                >
                  <div className="text-3xl font-black">{value}</div>
                  <div className="mt-1 text-xs text-neutral-400">{label}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </main>
  );
} 