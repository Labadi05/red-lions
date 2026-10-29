"use client";

import { useActionState } from "react";
import { openMotmVote } from "./motm-actions";

export default function MotmButton({ eventId }) {
  const [state, formAction, pending] = useActionState(openMotmVote, null);

  return (
    <form action={formAction} className="flex flex-wrap items-center gap-2">
      <input type="hidden" name="eventId" value={eventId} />
      <button
        disabled={pending}
        className="rounded-lg border border-gold px-3 py-1 text-xs text-gold hover:bg-neutral-800 disabled:opacity-50"
      >
        🏆 Open MOTM vote (48h)
      </button>
      {state?.error && <span className="text-xs text-red-400">{state.error}</span>}
      {state?.ok && <span className="text-xs text-green-400">{state.ok}</span>}
    </form>
  );
}