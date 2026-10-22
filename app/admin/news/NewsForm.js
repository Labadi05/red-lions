"use client";

import { useActionState } from "react";
import { saveAnnouncement } from "./actions";

export default function NewsForm({ announcement }) {
  const [state, formAction, pending] = useActionState(saveAnnouncement, null);

  return (
    <form
      action={formAction}
      className="rounded-xl border border-neutral-800 bg-neutral-900 p-5"
    >
      {announcement && <input type="hidden" name="id" value={announcement.id} />}

      <label className="block text-sm text-neutral-400">Title</label>
      <input
        name="title"
        required
        defaultValue={announcement?.title ?? ""}
        className="mt-1 w-full rounded-lg border border-neutral-700 bg-neutral-950 px-3 py-2 outline-none focus:border-red-600"
      />

      <label className="mt-4 block text-sm text-neutral-400">Message</label>
      <textarea
        name="body"
        required
        rows={6}
        defaultValue={announcement?.body ?? ""}
        className="mt-1 w-full rounded-lg border border-neutral-700 bg-neutral-950 px-3 py-2 outline-none focus:border-red-600"
      />

      <label className="mt-4 block text-sm text-neutral-400">Who can see it?</label>
      <select
        name="visibility"
        defaultValue={announcement?.visibility ?? "players"}
        className="mt-1 rounded-lg border border-neutral-700 bg-neutral-950 px-3 py-2 outline-none focus:border-red-600"
      >
        <option value="players">🔒 Players only</option>
        <option value="public">🌍 Public (everyone)</option>
      </select>

      {state?.error && <p className="mt-4 text-sm text-red-400">{state.error}</p>}

      <button
        type="submit"
        disabled={pending}
        className="mt-5 block rounded-full bg-red-600 px-6 py-2 font-semibold hover:bg-red-500 disabled:opacity-50"
      >
        {pending ? "Saving..." : announcement ? "Save changes" : "Publish"}
      </button>
    </form>
  );
}