"use client";

import { useActionState, useState } from "react";
import { saveAccount } from "./actions";

function randomPassword() {
  const chars = "abcdefghjkmnpqrstuvwxyz23456789";
  const bytes = crypto.getRandomValues(new Uint8Array(8));
  return Array.from(bytes, (b) => chars[b % chars.length]).join("");
}

export default function AccountForm({ playerId, defaultUsername, hasAccount }) {
  const [state, formAction, pending] = useActionState(saveAccount, null);
  const [username, setUsername] = useState(defaultUsername);
  const [password, setPassword] = useState("");

  return (
    <form action={formAction} className="mt-3 flex flex-wrap items-center gap-2">
      <input type="hidden" name="playerId" value={playerId} />
      <input
        name="username"
        value={username}
        onChange={(e) => setUsername(e.target.value)}
        className="w-36 rounded-lg border border-neutral-700 bg-neutral-950 px-3 py-1.5 text-sm outline-none focus:border-red-600"
      />
      <input
        name="password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        placeholder="password"
        className="w-36 rounded-lg border border-neutral-700 bg-neutral-950 px-3 py-1.5 text-sm outline-none focus:border-red-600"
      />
      <button
        type="button"
        onClick={() => setPassword(randomPassword())}
        className="rounded-lg border border-neutral-700 px-3 py-1.5 text-sm hover:border-red-600"
      >
        Generate
      </button>
      <button
        type="submit"
        disabled={pending}
        className="rounded-lg bg-red-600 px-4 py-1.5 text-sm font-semibold hover:bg-red-500 disabled:opacity-50"
      >
        {hasAccount ? "Reset" : "Create"}
      </button>
      {state?.error && <span className="text-sm text-red-400">{state.error}</span>}
      {state?.ok && <span className="text-sm text-green-400">{state.ok}</span>}
    </form>
  );
}