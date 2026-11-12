import Link from "next/link";
import db from "@/lib/db";
import { requireAdmin } from "@/lib/auth";
import BoardSvg from "@/components/tactics/BoardSvg";
import { CATEGORIES, cleanBoard } from "@/lib/tacticsData";
import { setTacticPublished, deleteTactic } from "./actions";

export const dynamic = "force-dynamic";

export default async function AdminTacticsPage() {
  await requireAdmin();

  const rows = db
    .prepare(
      `SELECT t.*, e.title AS match_title
       FROM tactics t LEFT JOIN events e ON e.id = t.event_id
       ORDER BY t.id DESC`
    )
    .all();

  return (
    <main className="min-h-screen bg-neutral-950 px-6 py-12 text-white">
      <div className="mx-auto max-w-4xl">
        <Link href="/admin" className="text-sm text-red-400 hover:underline">
          ← Dashboard
        </Link>
        <div className="mt-4 flex flex-wrap items-center gap-4">
          <h1 className="text-4xl font-bold">Tactics 🧠</h1>
          <Link
            href="/admin/tactics/new"
            className="rounded-full bg-red-600 px-5 py-2 text-sm font-semibold hover:bg-red-500"
          >
            + New tactic
          </Link>
        </div>
        <p className="mt-2 text-neutral-400">
          Draw formations, set pieces and plays, with step-by-step animation. Players only see the
          ones you show to them.
        </p>

        <div className="mt-8 space-y-4">
          {rows.length === 0 && <p className="text-neutral-500">No tactics yet.</p>}
          {rows.map((r) => {
            const board = cleanBoard(r.data);
            const cat = CATEGORIES[r.category] ?? CATEGORIES.other;
            return (
              <div
                key={r.id}
                className="flex gap-4 rounded-xl border border-neutral-800 bg-neutral-900 p-4"
              >
                {board && (
                  <div className="w-20 shrink-0 overflow-hidden rounded-lg border border-neutral-700">
                    <BoardSvg
                      items={board.items}
                      positions={board.frames[0].pos}
                      draw={board.frames[0].draw}
                    />
                  </div>
                )}
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-lg font-semibold">{r.title}</span>
                    <span
                      className={`rounded-full px-2 py-0.5 text-xs ${
                        r.published
                          ? "bg-green-900 text-green-300"
                          : "bg-neutral-700 text-neutral-300"
                      }`}
                    >
                      {r.published ? "Shown to players" : "Draft"}
                    </span>
                  </div>
                  <p className="mt-1 text-xs text-neutral-400">
                    {cat.icon} {cat.label}
                    {board ? ` · ${board.frames.length} step${board.frames.length === 1 ? "" : "s"}` : ""}
                    {r.match_title ? ` · ${r.match_title}` : ""}
                  </p>
                  <div className="mt-3 flex flex-wrap items-center gap-2">
                    <Link
                      href={`/admin/tactics/${r.id}`}
                      className="rounded-lg border border-neutral-700 px-3 py-1 text-xs hover:border-red-600"
                    >
                      Edit
                    </Link>
                    <form action={setTacticPublished}>
                      <input type="hidden" name="id" value={r.id} />
                      <input type="hidden" name="published" value={r.published ? "0" : "1"} />
                      <button className="rounded-lg border border-neutral-700 px-3 py-1 text-xs hover:border-red-600">
                        {r.published ? "Hide from players" : "Show to players"}
                      </button>
                    </form>
                    <form action={deleteTactic} className="ml-auto">
                      <input type="hidden" name="id" value={r.id} />
                      <button className="rounded-lg border border-red-900 px-3 py-1 text-xs text-red-400 hover:bg-red-950">
                        Delete
                      </button>
                    </form>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </main>
  );
}