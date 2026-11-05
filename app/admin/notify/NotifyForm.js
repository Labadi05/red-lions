"use client";

import { useActionState } from "react";
import { sendManualPush } from "./actions";

const input =
  "mt-1 w-full rounded-lg border border-neutral-700 bg-neutral-950 px-3 py-2 text-sm outline-none focus:border-red-600";

export default function NotifyForm({ players }) {
  const [state, formAction, pending] = useActionState(sendManualPush, null);

  return (
    <form
      action={formAction}
      className="rounded-xl border border-neutral-800 bg-neutral-900 p-5"
    >
      <label className="block text-sm text-neutral-400">Title</label>
      <input name="title" required maxLength={60} placeholder="Training starts in 1 hour" className={input} />

      <label className="mt-4 block text-sm text-neutral-400">Message (optional)</label>
      <input name="body" maxLength={200} placeholder="Bring water. Pitch 2." className={input} />

      <p className="mt-5 text-sm text-neutral-400">Send to</p>
      <div className="mt-2 flex flex-wrap gap-4 text-sm">
        <label className="flex items-center gap-2">
          <input type="radio" name="audience" value="all" defaultChecked />
          Everyone with notifications on
        </label>
        <label className="flex items-center gap-2">
          <input type="radio" name="audience" value="selected" />
          Selected players
        </label>
      </div>

      <div className="mt-3 grid grid-cols-1 gap-1 sm:grid-cols-2">
        {players.map((p) => (
          <label key={p.id} className="flex items-center gap-2 text-sm text-neutral-300">
            <input type="checkbox" name="to" value={p.id} />
            <span className="font-black text-red-600">{p.number}</span> {p.name}
            <span className="text-xs text-neutral-500">
              {p.devices > 0 ? `🔔 ${p.devices}` : "no notifications"}
            </span>
          </label>
        ))}
      </div>

      {state?.error && <p className="mt-4 text-sm text-red-400">{state.error}</p>}
      {state?.ok && <p className="mt-4 text-sm text-green-400">{state.ok}</p>}

      <button
        type="submit"
        disabled={pending}
        className="mt-5 rounded-full bg-red-600 px-6 py-2 font-semibold hover:bg-red-500 disabled:opacity-50"
      >
        {pending ? "Sending..." : "Send notification"}
      </button>
    </form>
  );
}