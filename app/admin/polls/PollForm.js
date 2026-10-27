"use client";

import { useActionState } from "react";
import { createPoll } from "./actions";

const input =
  "mt-1 w-full rounded-lg border border-neutral-700 bg-neutral-950 px-3 py-2 outline-none focus:border-red-600";

export default function PollForm() {
  const [state, formAction, pending] = useActionState(createPoll, null);

  return (
    <form
      action={formAction}
      className="rounded-xl border border-neutral-800 bg-neutral-900 p-5"
    >
      <label className="block text-sm text-neutral-400">Question</label>
      <input
        name="question"
        required
        placeholder="e.g. Which day for next week's match?"
        className={input}
      />

      <label className="mt-4 block text-sm text-neutral-400">
        Options (one per line, 2 to 8)
      </label>
      <textarea
        name="options"
        required
        rows={4}
        placeholder={"Friday evening\nSaturday morning\nSunday afternoon"}
        className={input}
      />

      <label className="mt-4 block text-sm text-neutral-400">
        Deadline (Jinzhou time, optional)
      </label>
      <input type="datetime-local" name="closes_at" className={input} />

      {state?.error && <p className="mt-4 text-sm text-red-400">{state.error}</p>}

      <button
        type="submit"
        disabled={pending}
        className="mt-5 rounded-full bg-red-600 px-6 py-2 font-semibold hover:bg-red-500 disabled:opacity-50"
      >
        {pending ? "Creating..." : "Create poll"}
      </button>
    </form>
  );
}