import Link from "next/link";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/session";
import { getInbox, getMyFeedback } from "@/lib/messages";
import {
  KINDS,
  ACTION_KINDS,
  FEEDBACK_KINDS,
  FEEDBACK_STATUS,
} from "@/lib/messageKinds";
import { formatWhen, nowInJinzhou } from "@/lib/format";
import MarkRead from "./MarkRead";
import FeedbackForm from "./FeedbackForm";
import { setDone } from "./actions";

export const dynamic = "force-dynamic";

export default async function InboxPage() {
  const session = await getSession();
  if (!session) redirect("/login");

  const inbox = getInbox(session.uid);
  const feedback = getMyFeedback(session.uid);
  const now = nowInJinzhou();

  const hasUnread = inbox.some((m) => !m.read_at);
  const openTasks = inbox.filter(
    (m) => ACTION_KINDS.includes(m.kind) && !m.done_at
  ).length;

  return (
    <main className="min-h-screen bg-neutral-950 px-6 py-12 text-white">
      <MarkRead hasUnread={hasUnread} />
      <div className="mx-auto max-w-3xl">
        <Link href="/portal" className="text-sm text-red-400 hover:underline">
          ← Portal
        </Link>
        <h1 className="mt-4 text-4xl font-bold">Inbox 📬</h1>
        {openTasks > 0 && (
          <p className="mt-2 text-sm text-yellow-400">
            You have {openTasks} open task{openTasks === 1 ? "" : "s"}.
          </p>
        )}

        <h2 className="mt-8 text-xl font-semibold text-red-500">From the captain</h2>
        <div className="mt-4 space-y-3">
          {inbox.length === 0 && <p className="text-neutral-500">No messages yet.</p>}
          {inbox.map((m) => {
            const isAction = ACTION_KINDS.includes(m.kind);
            const isNew = !m.read_at;
            const overdue = isAction && !m.done_at && m.due_at && m.due_at < now;

            return (
              <div
                key={m.message_id}
                className={`rounded-xl border bg-neutral-900 p-5 ${
                  isNew ? "border-red-600" : "border-neutral-800"
                }`}
              >
                <div className="flex flex-wrap items-center gap-3">
                  <span className="text-xl">{KINDS[m.kind].icon}</span>
                  <span className="text-lg font-semibold">{m.subject}</span>
                  <span className="rounded-full bg-neutral-800 px-2 py-0.5 text-xs text-neutral-300">
                    {KINDS[m.kind].label}
                  </span>
                  {isNew && (
                    <span className="rounded-full bg-red-600 px-2 py-0.5 text-xs font-bold">
                      NEW
                    </span>
                  )}
                  <span className="ml-auto text-xs text-neutral-500">
                    {m.created_at.slice(0, 10)}
                  </span>
                </div>

                {m.body && (
                  <p className="mt-3 whitespace-pre-wrap text-sm text-neutral-300">
                    {m.body}
                  </p>
                )}

                {m.due_at && (
                  <p
                    className={`mt-3 text-xs ${
                      overdue ? "font-semibold text-red-400" : "text-neutral-400"
                    }`}
                  >
                    {overdue ? "⏰ Overdue · " : "Due "}
                    {formatWhen(m.due_at)}
                  </p>
                )}

                {isAction && (
                  <form action={setDone} className="mt-4">
                    <input type="hidden" name="messageId" value={m.message_id} />
                    <input type="hidden" name="done" value={m.done_at ? "0" : "1"} />
                    <button
                      className={`rounded-lg border px-4 py-1.5 text-sm ${
                        m.done_at
                          ? "border-green-700 bg-green-900 text-green-300"
                          : "border-neutral-700 hover:border-red-600"
                      }`}
                    >
                      {m.done_at ? "✅ Done (tap to undo)" : "Mark as done"}
                    </button>
                  </form>
                )}
              </div>
            );
          })}
        </div>

        <h2 className="mt-12 text-xl font-semibold text-red-500">Write to the captain</h2>
        <p className="mt-1 text-sm text-neutral-400">
          Have an idea for the team, a question, or a problem? Send it here. The captain
          reviews it and can reply.
        </p>
        <div className="mt-4">
          <FeedbackForm />
        </div>

        <h2 className="mt-12 text-xl font-semibold text-red-500">What I sent</h2>
        <div className="mt-4 space-y-3">
          {feedback.length === 0 && <p className="text-neutral-500">Nothing sent yet.</p>}
          {feedback.map((f) => (
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
                  {f.created_at.slice(0, 10)}
                </span>
              </div>
              <p className="mt-2 whitespace-pre-wrap text-sm text-neutral-300">{f.body}</p>
              {f.reply && (
                <div className="mt-3 rounded-lg border-l-4 border-red-600 bg-neutral-950 p-3 text-sm">
                  <div className="text-xs text-neutral-500">Captain&apos;s reply</div>
                  <p className="mt-1 whitespace-pre-wrap text-neutral-200">{f.reply}</p>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}