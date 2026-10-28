import Link from "next/link";
import db from "@/lib/db";
import { requireAdmin } from "@/lib/auth";
import { canDeletePlayer } from "@/lib/squad";
import PlayerForm from "./PlayerForm";
import DeleteButton from "./DeleteButton";
import PhotoUpload from "./PhotoUpload";

export const dynamic = "force-dynamic";

export default async function AdminSquadPage() {
  await requireAdmin();

  const players = db
    .prepare(
      `SELECT p.id, p.number, p.name, p.position, p.photo, p.is_captain, u.username
       FROM players p LEFT JOIN users u ON u.player_id = p.id
       ORDER BY CAST(p.number AS INTEGER)`
    )
    .all();

  return (
    <main className="min-h-screen bg-neutral-950 px-6 py-12 text-white">
      <div className="mx-auto max-w-4xl">
        <Link href="/admin" className="text-sm text-red-400 hover:underline">
          ← Dashboard
        </Link>
        <h1 className="mt-4 text-4xl font-bold">Squad 👥</h1>
        <p className="mt-2 text-neutral-400">
          Add new players, fix numbers, names or positions, and upload photos. After adding
          a player, create their login in the dashboard under &quot;Player accounts&quot;.
        </p>

        <h2 className="mt-8 text-xl font-semibold text-red-500">Add a player</h2>
        <div className="mt-4 rounded-xl border border-neutral-800 bg-neutral-900 p-4">
          <PlayerForm />
        </div>

        <h2 className="mt-12 text-xl font-semibold text-red-500">
          Current squad ({players.length})
        </h2>
        <div className="mt-4 space-y-3">
          {players.map((p) => (
            <div
              key={p.id}
              className="rounded-xl border border-neutral-800 bg-neutral-900 p-4"
            >
              <div className="mb-3 flex flex-wrap items-center gap-2 text-xs">
                {p.is_captain === 1 && (
                  <span className="rounded-full bg-yellow-900 px-2 py-0.5 text-yellow-300">
                    Captain 🫡
                  </span>
                )}
                <span
                  className={`rounded-full px-2 py-0.5 ${
                    p.username
                      ? "bg-green-900 text-green-300"
                      : "bg-neutral-800 text-neutral-400"
                  }`}
                >
                  {p.username ? `Account: ${p.username}` : "No account yet"}
                </span>
              </div>

              <PhotoUpload player={p} />

              <div className="mt-4 flex flex-wrap items-end gap-4 border-t border-neutral-800 pt-4">
                <PlayerForm player={p} />
                {p.is_captain !== 1 && canDeletePlayer(p.id) && (
                  <DeleteButton id={p.id} name={p.name} />
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}