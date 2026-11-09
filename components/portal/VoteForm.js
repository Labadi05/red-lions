"use client";

import { useT } from "@/components/I18nProvider";

// The vote buttons. A vote is final, so every tap asks for confirmation first.
// options: [{ id, label, disabled }]
export default function VoteForm({ action, pollId, options }) {
  const t = useT();

  return (
    <form action={action} className="mt-4 flex flex-wrap gap-2">
      <input type="hidden" name="pollId" value={pollId} />
      {options.map((o) => (
        <button
          key={o.id}
          name="optionId"
          value={o.id}
          disabled={o.disabled}
          title={o.disabled ? t("portal.cantVoteSelf") : undefined}
          onClick={(e) => {
            if (!confirm(t("portal.voteConfirm", { option: o.label }))) e.preventDefault();
          }}
          className={`rounded-lg border px-4 py-2 text-sm ${
            o.disabled
              ? "cursor-not-allowed border-neutral-800 text-neutral-600"
              : "border-neutral-700 hover:border-red-600"
          }`}
        >
          {o.label}
        </button>
      ))}
    </form>
  );
}