"use client";

import { useActionState } from "react";
import { FEEDBACK_KINDS } from "@/lib/messageKinds";
import { useT } from "@/components/I18nProvider";
import { sendFeedback } from "./actions";

const input =
  "mt-1 w-full rounded-lg border border-neutral-700 bg-neutral-950 px-3 py-2 text-sm outline-none focus:border-red-600";

export default function FeedbackForm() {
  const t = useT();
  const [state, formAction, pending] = useActionState(sendFeedback, null);

  return (
    <form
      action={formAction}
      className="rounded-xl border border-neutral-800 bg-neutral-900 p-5"
    >
      <label className="block text-sm text-neutral-400">{t("feedback.type")}</label>
      <select name="kind" defaultValue="suggestion" className={input}>
        {Object.entries(FEEDBACK_KINDS).map(([key, k]) => (
          <option key={key} value={key}>
            {k.icon} {t(`fkind.${key}`)}
          </option>
        ))}
      </select>

      <label className="mt-4 block text-sm text-neutral-400">{t("feedback.title")}</label>
      <input name="subject" required className={input} />

      <label className="mt-4 block text-sm text-neutral-400">{t("feedback.message")}</label>
      <textarea name="body" required rows={5} className={input} />

      {state?.error && (
        <p className="mt-4 text-sm text-red-400">{t(`feedback.error.${state.error}`)}</p>
      )}
      {state?.ok && <p className="mt-4 text-sm text-green-400">{t("feedback.ok")}</p>}

      <button
        type="submit"
        disabled={pending}
        className="mt-5 rounded-full bg-red-600 px-6 py-2 font-semibold hover:bg-red-500 disabled:opacity-50"
      >
        {pending ? t("feedback.sending") : t("feedback.send")}
      </button>
    </form>
  );
}