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
import { getT } from "@/lib/i18n";
import PortalShell from "@/components/portal/PortalShell";
import MarkRead from "./MarkRead";
import FeedbackForm from "./FeedbackForm";
import { setDone } from "./actions";

export const dynamic = "force-dynamic";

const panel = "rounded-2xl border border-[#1c3a29] bg-[#0a1810] p-5";

// The colored stripe on the side of each note, by type
const stripe = {
  message: "!border-s-neutral-400",
  task: "!border-s-red-500",
  todo: "!border-s-emerald-500",
  punishment: "!border-s-amber-500",
  reward: "!border-s-yellow-400",
};

function SectionTitle({ children }) {
  return (
    <h2 className="flex items-center gap-3 text-sm font-black uppercase tracking-[0.25em] text-gold">
      <span className="h-px w-8 bg-gold/60" />
      {children}
    </h2>
  );
}

export default async function InboxPage() {
  const { t, lang } = await getT();

  const session = await getSession();
  if (!session) redirect("/login");

  const inbox = getInbox(session.uid);
  const feedback = getMyFeedback(session.uid);
  const now = nowInJinzhou();

  const hasUnread = inbox.some((m) => !m.read_at);
  const openTasks = inbox.filter((m) => ACTION_KINDS.includes(m.kind) && !m.done_at).length;

  return (
    <PortalShell active="inbox" width="max-w-5xl">
      <MarkRead hasUnread={hasUnread} />

      <div className="rl-fade-up flex flex-wrap items-center gap-3">
        <h1 className="text-3xl font-black">{t("inbox.title")}</h1>
        {openTasks > 0 && (
          <span className="rounded-full bg-yellow-900 px-3 py-1 text-xs font-semibold text-yellow-300">
            {t("inbox.openTasks", { n: openTasks })}
          </span>
        )}
      </div>

      <div className="mt-8 grid gap-10 lg:grid-cols-[1fr_380px]">
        {/* Messages from the captain */}
        <section className="min-w-0 space-y-4">
          <SectionTitle>{t("inbox.fromCaptain")}</SectionTitle>

          {inbox.length === 0 && <p className="text-neutral-400">{t("inbox.empty")}</p>}

          {inbox.map((m) => {
            const isAction = ACTION_KINDS.includes(m.kind);
            const isNew = !m.read_at;
            const overdue = isAction && !m.done_at && m.due_at && m.due_at < now;

            return (
              <div
                key={m.message_id}
                className={`rl-reveal rounded-2xl border border-[#1c3a29] border-s-4 bg-[#0a1810] p-5 ${
                  stripe[m.kind]
                } ${isNew ? "ring-1 ring-red-600/60" : ""}`}
              >
                <div className="flex items-start gap-3">
                  <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-white/5 text-2xl">
                    {KINDS[m.kind].icon}
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-lg font-bold">{m.subject}</span>
                      {isNew && (
                        <span className="rounded-full bg-red-600 px-2 py-0.5 text-[10px] font-black">
                          {t("inbox.new")}
                        </span>
                      )}
                    </div>
                    <div className="mt-0.5 text-xs text-neutral-400">
                      {t(`kind.${m.kind}`)} ·{" "}
                      <span dir="ltr">{m.created_at.slice(0, 10)}</span>
                    </div>
                  </div>
                </div>

                {m.body && (
                  <p className="mt-3 whitespace-pre-wrap text-sm text-neutral-200">{m.body}</p>
                )}

                {m.due_at && (
                  <p
                    className={`mt-3 text-xs ${
                      overdue ? "font-semibold text-red-400" : "text-neutral-400"
                    }`}
                  >
                    {overdue ? t("inbox.overdue") : t("inbox.due")}
                    {formatWhen(m.due_at, lang)}
                  </p>
                )}

                {isAction && (
                  <form action={setDone}>
                    <input type="hidden" name="messageId" value={m.message_id} />
                    <input type="hidden" name="done" value={m.done_at ? "0" : "1"} />
                    <button
                      className={`mt-4 flex items-center gap-3 rounded-xl border px-4 py-2.5 text-sm font-semibold ${
                        m.done_at
                          ? "border-emerald-600 bg-emerald-900/40 text-emerald-300"
                          : "border-neutral-600 hover:border-gold"
                      }`}
                    >
                      <span
                        className={`flex h-5 w-5 items-center justify-center rounded border text-xs ${
                          m.done_at
                            ? "border-emerald-400 bg-emerald-500 text-neutral-950"
                            : "border-neutral-500"
                        }`}
                      >
                        {m.done_at ? "✓" : ""}
                      </span>
                      {m.done_at ? t("inbox.done") : t("inbox.markDone")}
                    </button>
                  </form>
                )}
              </div>
            );
          })}
        </section>

        {/* Write to the captain, and what was sent */}
        <aside className="min-w-0 space-y-10">
          <section className="space-y-4">
            <SectionTitle>{t("inbox.write")}</SectionTitle>
            <p className="text-sm text-neutral-300">{t("inbox.writeHelp")}</p>
            <FeedbackForm />
          </section>

          <section className="space-y-4">
            <SectionTitle>{t("inbox.sent")}</SectionTitle>
            {feedback.length === 0 && (
              <p className="text-neutral-400">{t("inbox.nothingSent")}</p>
            )}
            {feedback.map((f) => (
              <div key={f.id} className={panel}>
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-xl">{FEEDBACK_KINDS[f.kind]?.icon}</span>
                  <span className="font-bold">{f.subject}</span>
                  <span
                    className={`rounded-full px-2 py-0.5 text-xs ${FEEDBACK_STATUS[f.status].style}`}
                  >
                    {t(`fstatus.${f.status}`)}
                  </span>
                </div>
                <div className="mt-1 text-xs text-neutral-500" dir="ltr">
                  {f.created_at.slice(0, 10)}
                </div>
                <p className="mt-2 whitespace-pre-wrap text-sm text-neutral-300">{f.body}</p>
                {f.reply && (
                  <div className="mt-3 rounded-lg border-s-4 border-gold bg-[#050d08] p-3 text-sm">
                    <div className="text-xs font-bold text-gold">{t("inbox.reply")}</div>
                    <p className="mt-1 whitespace-pre-wrap text-neutral-200">{f.reply}</p>
                  </div>
                )}
              </div>
            ))}
          </section>
        </aside>
      </div>
    </PortalShell>
  );
}