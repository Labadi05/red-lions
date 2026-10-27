import Link from "next/link";
import { requireAdmin } from "@/lib/auth";
import { getPolls } from "@/lib/polls";
import { formatWhen } from "@/lib/format";
import PollForm from "./PollForm";
import CopyButton from "../news/CopyButton";
import { setPollClosed, deletePoll } from "./actions";

export const dynamic = "force-dynamic";

export default async function AdminPollsPage() {
  await requireAdmin();
  const polls = getPolls(null, { withVoters: true });

  return (
    <main className="min-h-screen bg-neutral-950 px-6 py-12 text-white">
      <div className="mx-auto max-w-4xl">
        <Link href="/admin" className="text-sm text-red-400 hover:underline">
          ← Dashboard
        </Link>
        <h1 className="mt-4 text-4xl font-bold">Polls 🗳️</h1>

        <h2 className="mt-8 text-xl font-semibold text-red-500">New poll</h2>
        <div className="mt-4">
          <PollForm />
        </div>

        <h2 className="mt-12 text-xl font-semibold text-red-500">All polls</h2>
        <div className="mt-4 space-y-4">
          {polls.length === 0 && <p className="text-neutral-500">No polls yet.</p>}
          {polls.map((poll) => {
            const shareText =
              `🦁 RED LIONS\n\n🗳️ New poll: ${poll.question}\n` +
              poll.options.map((o, i) => `${i + 1}. ${o.label}`).join("\n") +
              (poll.closes_at ? `\n\n⏰ Vote before ${formatWhen(poll.closes_at)}` : "") +
              `\n\nVote in the players' portal on the website.`;

            return (
              <div
                key={poll.id}
                className="rounded-xl border border-neutral-800 bg-neutral-900 p-5"
              >
                <div className="flex flex-wrap items-center gap-3">
                  <span className="text-lg font-semibold">{poll.question}</span>
                  <span
                    className={`rounded-full px-2 py-0.5 text-xs ${
                      poll.closed
                        ? "bg-neutral-700 text-neutral-300"
                        : "bg-green-900 text-green-300"
                    }`}
                  >
                    {poll.closed
                      ? "Closed"
                      : poll.closes_at
                      ? `Open until ${formatWhen(poll.closes_at)}`
                      : "Open"}
                  </span>
                  <span className="ml-auto text-xs text-neutral-500">
                    {poll.total} vote{poll.total === 1 ? "" : "s"}
                  </span>
                </div>

                <div className="mt-4 space-y-3">
                  {poll.options.map((o) => {
                    const pct = poll.total ? Math.round((100 * o.count) / poll.total) : 0;
                    return (
                      <div key={o.id}>
                        <div className="flex items-center justify-between text-sm">
                          <span>{o.label}</span>
                          <span className="text-neutral-400">
                            {o.count} · {pct}%
                          </span>
                        </div>
                        <div className="mt-1 h-2 overflow-hidden rounded-full bg-neutral-800">
                          <div
                            className="h-full bg-red-600"
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                        {o.voters.length > 0 && (
                          <p className="mt-1 text-xs text-neutral-500">
                            {o.voters.join(" · ")}
                          </p>
                        )}
                      </div>
                    );
                  })}
                </div>

                {poll.notVoted.length > 0 && (
                  <p className="mt-4 text-xs text-yellow-400">
                    Not voted yet ({poll.notVoted.length}): {poll.notVoted.join(" · ")}
                  </p>
                )}

                <div className="mt-4 flex items-center gap-2">
                  <CopyButton text={shareText} />
                  <form action={setPollClosed}>
                    <input type="hidden" name="id" value={poll.id} />
                    <input type="hidden" name="closed" value={poll.closed ? "0" : "1"} />
                    <button className="rounded-lg border border-neutral-700 px-3 py-1 text-xs hover:border-red-600">
                      {poll.closed ? "Reopen" : "Close now"}
                    </button>
                  </form>
                  <form action={deletePoll} className="ml-auto">
                    <input type="hidden" name="id" value={poll.id} />
                    <button className="rounded-lg border border-red-900 px-3 py-1 text-xs text-red-400 hover:bg-red-950">
                      Delete
                    </button>
                  </form>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </main>
  );
}