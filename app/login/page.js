"use client";

import { useActionState } from "react";
import { login } from "./actions";

export default function LoginPage() {
  const [state, formAction, pending] = useActionState(login, null);

  return (
    <main className="flex min-h-screen items-center justify-center bg-neutral-950 px-6 text-white">
      <form
        action={formAction}
        className="w-full max-w-sm rounded-2xl border border-neutral-800 bg-neutral-900 p-8"
      >
        <div className="text-center text-5xl">🦁</div>
        <h1 className="mt-3 text-center text-2xl font-bold">Players&apos; Login</h1>

        <label className="mt-6 block text-sm text-neutral-400">Username</label>
        <input
          name="username"
          required
          autoComplete="username"
          className="mt-1 w-full rounded-lg border border-neutral-700 bg-neutral-950 px-3 py-2 outline-none focus:border-red-600"
        />

        <label className="mt-4 block text-sm text-neutral-400">Password</label>
        <input
          name="password"
          type="password"
          required
          autoComplete="current-password"
          className="mt-1 w-full rounded-lg border border-neutral-700 bg-neutral-950 px-3 py-2 outline-none focus:border-red-600"
        />

        {state?.error && (
          <p className="mt-4 text-sm text-red-400">{state.error}</p>
        )}

        <button
          type="submit"
          disabled={pending}
          className="mt-6 w-full rounded-full bg-red-600 py-2.5 font-semibold hover:bg-red-500 disabled:opacity-50"
        >
          {pending ? "Signing in..." : "Sign in"}
        </button>
      </form>
    </main>
  );
}