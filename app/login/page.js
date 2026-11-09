"use client";

import { useActionState } from "react";
import Logo from "@/components/Logo";
import { useT } from "@/components/I18nProvider";
import { login } from "./actions";

export default function LoginPage() {
  const t = useT();
  const [state, formAction, pending] = useActionState(login, null);

  return (
    <main className="relative isolate flex min-h-screen items-center justify-center overflow-hidden bg-neutral-950 px-6 text-white">
      <div className="rl-blob rl-blob-green" aria-hidden />
      <div className="rl-blob rl-blob-red" aria-hidden />

      <form
        action={formAction}
        className="rl-fade-up w-full max-w-sm rounded-2xl border border-white/10 bg-white/5 p-8 backdrop-blur"
      >
        <div className="rl-float flex justify-center">
          <Logo width={96} />
        </div>
        <h1 className="mt-3 text-center text-2xl font-black">{t("login.title")}</h1>

        <label className="mt-6 block text-sm text-neutral-300">{t("login.username")}</label>
        <input
          name="username"
          required
          dir="ltr"
          autoComplete="username"
          className="mt-1 w-full rounded-lg border border-white/15 bg-neutral-950/70 px-3 py-2 outline-none focus:border-emerald-500"
        />

        <label className="mt-4 block text-sm text-neutral-300">{t("login.password")}</label>
        <input
          name="password"
          type="password"
          required
          dir="ltr"
          autoComplete="current-password"
          className="mt-1 w-full rounded-lg border border-white/15 bg-neutral-950/70 px-3 py-2 outline-none focus:border-emerald-500"
        />

        {state?.error && (
          <p className="mt-4 text-sm text-red-400">
            {t(`login.error.${state.error}`, { minutes: state.minutes })}
          </p>
        )}

        <button
          type="submit"
          disabled={pending}
          className="rl-shine mt-6 w-full rounded-full bg-red-600 py-2.5 font-bold hover:bg-red-500 disabled:opacity-50"
        >
          {pending ? t("login.submitting") : t("login.submit")}
        </button>
      </form>
    </main>
  );
}