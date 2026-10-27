"use client";

import { useActionState } from "react";
import { saveSettings } from "./actions";

const input =
  "mt-1 w-full rounded-lg border border-neutral-700 bg-neutral-950 px-3 py-2 text-sm outline-none focus:border-red-600";

const SOCIALS = [
  ["instagram_url", "📸 Instagram link", "https://instagram.com/..."],
  ["facebook_url", "👍 Facebook link", "https://facebook.com/..."],
  ["tiktok_url", "🎵 TikTok link", "https://tiktok.com/@..."],
  ["youtube_url", "▶️ YouTube link", "https://youtube.com/@..."],
];

export default function SettingsForm({ settings }) {
  const [state, formAction, pending] = useActionState(saveSettings, null);

  return (
    <form action={formAction} className="space-y-8">
      <section className="rounded-xl border border-neutral-800 bg-neutral-900 p-5">
        <h2 className="text-lg font-semibold text-red-500">Social media</h2>
        <p className="mt-1 text-xs text-neutral-500">Leave empty to hide.</p>
        {SOCIALS.map(([name, label, placeholder]) => (
          <div key={name} className="mt-4">
            <label className="block text-sm text-neutral-400">{label}</label>
            <input
              name={name}
              defaultValue={settings[name]}
              placeholder={placeholder}
              className={input}
            />
          </div>
        ))}
      </section>

      <section className="rounded-xl border border-neutral-800 bg-neutral-900 p-5">
        <h2 className="text-lg font-semibold text-red-500">Contact (public)</h2>
        <p className="mt-1 text-xs text-neutral-500">
          Everything here is visible to anyone. Leave empty to hide.
        </p>

        <label className="mt-4 block text-sm text-neutral-400">💬 WeChat ID</label>
        <input name="wechat_id" defaultValue={settings.wechat_id} className={input} />

        <label className="mt-4 block text-sm text-neutral-400">
          📱 WhatsApp number (with country code)
        </label>
        <input
          name="whatsapp"
          defaultValue={settings.whatsapp}
          placeholder="+212..."
          className={input}
        />

        <label className="mt-4 block text-sm text-neutral-400">✉️ Email</label>
        <input name="email" defaultValue={settings.email} className={input} />

        <label className="mt-4 block text-sm text-neutral-400">
          Message shown above the contact details
        </label>
        <textarea
          name="contact_note"
          rows={3}
          defaultValue={settings.contact_note}
          placeholder="Want a friendly game against us? Get in touch!"
          className={input}
        />
      </section>

      <section className="rounded-xl border border-neutral-800 bg-neutral-900 p-5">
        <h2 className="text-lg font-semibold text-red-500">Our story (About page)</h2>
        <textarea
          name="about_text"
          rows={10}
          defaultValue={settings.about_text}
          placeholder="Who are the Red Lions? When and why did the team start? Who can join?"
          className={`${input} mt-3`}
        />
      </section>

      {state?.error && <p className="text-sm text-red-400">{state.error}</p>}
      {state?.ok && <p className="text-sm text-green-400">{state.ok}</p>}

      <button
        type="submit"
        disabled={pending}
        className="rounded-full bg-red-600 px-6 py-2 font-semibold hover:bg-red-500 disabled:opacity-50"
      >
        {pending ? "Saving..." : "Save"}
      </button>
    </form>
  );
}