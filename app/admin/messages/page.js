import Link from "next/link";
import db from "@/lib/db";
import { requireAdmin } from "@/lib/auth";
import { KINDS, ACTION_KINDS } from "@/lib/messageKinds";
import { formatWhen } from "@/lib/format";
import ComposeForm from "./ComposeForm";
import { deleteMessage } from "./actions";

export const dynamic = "force-dynamic";

export default async function AdminMessagesPage() {
  await requireAdmin();

  const players = db
    .prepare(
      `SELECT p.id, p.number, p.name, u.id AS user_id
       FROM players p LEFT JOIN users u ON u.player_id = p.id
       ORDER BY CAST(p.number AS INTEGER)`
    )
    .all()
    .map((p) => ({ id: p.id, number: p.number, name: p.name, hasAccount: Boolean(p.user_id) }));

  const messages = db.prepare("SELECT * FROM messages ORDER BY id DESC LIMIT 100").all();
  const recipients = db
    .prepare(
      `SELECT r.*, p.number, p.name
       FROM message_recipients r JOIN players p ON p.id = r.player_id
       ORDER BY CAST(p.number AS INTEGER)`
    )
    .all();

  return (
    <main className="min-h-screen bg-neutral-950 px-6 py-12 text-white">
      <div className="mx-auto max-w-4xl">
        <Link href="/admin" className="text-sm text-red-400 hover:underline">
          ← Dashboard
        </Link>
        <h1 className="mt-4 text-4xl font-bold">Messages 📬</h1>
        <p className="mt-2 text-neutral-400">
          Private messages and tasks for your players. Only the recipients can see them.
        </p>

        <h2 className="mt-8 text-xl font-semibold text-red-500">New message</h2>
        <div className="mt-4">
          <ComposeForm players={players} />
        </div>

        <h2 className="mt-12 text-xl font-semibold text-red-500">Sent</h2>
        <div className="mt-4 space-y-4">
          {messages.length === 0 && <p className="text-neutral-500">Nothing sent yet.</p>}
          {messages.map((m) => {
            const recips = recipients.filter((r) => r.message_id === m.id);
            const seen = recips.filter((r) => r.read_at).length;
            const done = recips.filter((r) => r.done_at).length;
            const isAction = ACTION_KINDS.includes(m.kind);

            return (
              <div
                key={m.id}
                className="rounded-xl border border-neutral-800 bg-neutral-900 p-5"
              >
                <div className="flex flex-wrap items-center gap-3">
                  <span className="text-xl">{KINDS[m.kind].icon}</span>
                  <span className="font-semibold">{m.subject}</span>
                  <span className="rounded-full bg-neutral-800 px-2 py-0.5 text-xs text-neutral-300">
                    {KINDS[m.kind].label}
                  </span>
                  {m.due_at && (
                    <span className="text-xs text-neutral-400">
                      Due {formatWhen(m.due_at)}
                    </span>
                  )}
                  <span className="ml-auto text-xs text-neutral-500">
                    {m.created_at.slice(0, 10)}
                  </span>
                </div>

                {m.body && (
                  <p className="mt-2 whitespace-pre-wrap text-sm text-neutral-300">
                    {m.body}
                  </p>
                )}

                <p className="mt-3 text-xs text-neutral-400">
                  {recips.length} recipient{recips.length === 1 ? "" : "s"} · {seen} seen
                  {isAction ? ` · ${done} done` : ""}
                </p>
                <div className="mt-2 flex flex-wrap gap-2">
                  {recips.map((r) => (
                    <span
                      key={r.player_id}
                      className={`rounded-full px-2 py-0.5 text-xs ${
                        r.done_at
                          ? "bg-green-900 text-green-300"
                          : r.read_at
                          ? "bg-neutral-800 text-neutral-300"
                          : "bg-yellow-900 text-yellow-300"
                      }`}
                    >
                      {r.number} {r.name} ·{" "}
                      {r.done_at ? "✅ done" : r.read_at ? "👁 seen" : "unread"}
                    </span>
                  ))}
                </div>

                <form action={deleteMessage} className="mt-4">
                  <input type="hidden" name="id" value={m.id} />
                  <button className="rounded-lg border border-red-900 px-3 py-1 text-xs text-red-400 hover:bg-red-950">
                    Delete
                  </button>
                </form>
              </div>
            );
          })}
        </div>
      </div>
    </main>
  );
}