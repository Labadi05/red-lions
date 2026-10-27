"use client";

import { useActionState } from "react";
import { deletePlayer } from "./actions";

export default function DeleteButton({ id, name }) {
  const [state, formAction, pending] = useActionState(deletePlayer, null);

  return (
    <form
      action={formAction}
      onSubmit={(e) => {
        if (!confirm(`Delete ${name}? This cannot be undone.`)) e.preventDefault();
      }}
      className="flex items-center gap-2"
    >
      <input type="hidden" name="id" value={id} />
      <button
        disabled={pending}
        className="rounded-lg border border-red-900 px-3 py-1 text-xs text-red-400 hover:bg-red-950 disabled:opacity-50"
      >
        Delete
      </button>
      {state?.error && <span className="text-xs text-red-400">{state.error}</span>}
    </form>
  );
}