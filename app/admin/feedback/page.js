import Link from "next/link";
import db from "@/lib/db";
import { requireAdmin } from "@/lib/auth";
import { FEEDBACK_KINDS, FEEDBACK_STATUS } from "@/lib/messageKinds";
import { reviewFeedback, deleteFeedback } from "./actions";

export const dynamic = "force-dynamic";

export default async function AdminFeedbackPage() {
  await requireAdmin();

  const items = db
    .prepare(
      `SELECT f.*, p.number, p.name, u.username
       FROM feedback f
       JOIN users u ON u.id = f.user_id
       LEFT JOIN players p ON p.id = u.player_id
       ORDER BY (f.status = 'new') DESC, f.id DESC
       LIMIT 100`
    )
    .all();

  const input =
    "w-full rounded-lg border border-neutral-700 bg-neutral-950 px-3 py-2 text-sm outline-none focus:border-red-600";

  return (
    <main className="min-h-screen bg-neutral-950 px-6 py-12 text-white">
      <div className="mx-auto max-w-4xl">
        <Link href="/admin" className="text-sm text-red-400 hover:underline">
          ← Dashboard
        </Link>
        <h1 className="mt-4 text-4xl font-bold">Player feedback 💡</h1>
        <p className="mt-2 text-neutral-400">
          Suggestions, messages and problems from your players. Set a status and, if you
          want, a reply. The player sees both.
        </p>

        <div className="mt-8 space-y-4">
          {items.length === 0 && <p className="text-neutral-500">Nothing received yet.</p>}
          {items.map((f) => (
            <div
              key={f.id}
              className="rounded-xl border border-neutral-800 bg-neutral-900 p-5"
            >
              <div className="flex flex-wrap items-center gap-3">
                <span className="text-xl">{FEEDBACK_KINDS[f.kind]?.icon}</span>
                <span className="font-semibold">{f.subject}</span>
                <span
                  className={`rounded-full px-2 py-0.5 text-xs ${FEEDBACK_STATUS[f.status].style}`}
                >
                  {FEEDBACK_STATUS[f.status].label}
                </span>
                <span className="ml-auto text-xs text-neutral-500">
                  {f.number ? `${f.number} ${f.name}` : f.username} ·{" "}
                  {f.created_at.slice(0, 10)}
                </span>
              </div>

              <p className="mt-3 whitespace-pre-wrap text-sm text-neutral-300">{f.body}</p>

              <form action={reviewFeedback} className="mt-4 space-y-3">
                <input type="hidden" name="id" value={f.id} />
                <textarea
                  name="reply"
                  rows={2}
                  defaultValue={f.reply}
                  placeholder="Reply to the player (optional)"
                  className={input}
                />
                <div className="flex flex-wrap items-center gap-3">
                  <select name="status" defaultValue={f.status} className={`w-48 ${input}`}>
                    {Object.entries(FEEDBACK_STATUS).map(([key, s]) => (
                      <option key={key} value={key}>
                        {s.label}
                      </option>
                    ))}
                  </select>
                  <button className="rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold hover:bg-red-500">
                    Save
                  </button>
                </div>
              </form>

              <form action={deleteFeedback} className="mt-3">
                <input type="hidden" name="id" value={f.id} />
                <button className="rounded-lg border border-red-900 px-3 py-1 text-xs text-red-400 hover:bg-red-950">
                  Delete
                </button>
              </form>
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}