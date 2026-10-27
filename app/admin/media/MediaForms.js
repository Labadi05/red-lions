"use client";

import { useActionState } from "react";
import { uploadPhotos, addVideo } from "./actions";

const input =
  "mt-1 w-full rounded-lg border border-neutral-700 bg-neutral-950 px-3 py-2 text-sm outline-none focus:border-red-600";
const card = "rounded-xl border border-neutral-800 bg-neutral-900 p-5";

function VisibilitySelect() {
  return (
    <>
      <label className="mt-4 block text-sm text-neutral-400">Who can see it?</label>
      <select name="visibility" defaultValue="public" className={input}>
        <option value="public">🌍 Public (everyone)</option>
        <option value="players">🔒 Players only</option>
      </select>
    </>
  );
}

export function PhotoForm() {
  const [state, formAction, pending] = useActionState(uploadPhotos, null);

  return (
    <form action={formAction} className={card}>
      <h2 className="text-lg font-semibold text-red-500">📷 Upload photos</h2>

      <label className="mt-4 block text-sm text-neutral-400">
        Photos (up to 10 at a time, max 8 MB each)
      </label>
      <input
        type="file"
        name="photos"
        multiple
        required
        accept="image/jpeg,image/png,image/webp"
        className={input}
      />

      <label className="mt-4 block text-sm text-neutral-400">
        Caption (optional, applies to all photos in this upload)
      </label>
      <input name="caption" placeholder="e.g. Red Lions vs Dragons FC" className={input} />

      <VisibilitySelect />

      {state?.error && <p className="mt-4 text-sm text-red-400">{state.error}</p>}
      {state?.ok && <p className="mt-4 text-sm text-green-400">{state.ok}</p>}

      <button
        type="submit"
        disabled={pending}
        className="mt-5 rounded-full bg-red-600 px-6 py-2 font-semibold hover:bg-red-500 disabled:opacity-50"
      >
        {pending ? "Uploading... please wait" : "Upload"}
      </button>
    </form>
  );
}

export function VideoForm() {
  const [state, formAction, pending] = useActionState(addVideo, null);

  return (
    <form action={formAction} className={card}>
      <h2 className="text-lg font-semibold text-red-500">🎬 Add a video link</h2>

      <label className="mt-4 block text-sm text-neutral-400">Title</label>
      <input name="title" required className={input} />

      <label className="mt-4 block text-sm text-neutral-400">
        Link (Bilibili, Douyin, YouTube, Instagram...)
      </label>
      <input name="url" required placeholder="https://..." className={input} />

      <VisibilitySelect />

      {state?.error && <p className="mt-4 text-sm text-red-400">{state.error}</p>}
      {state?.ok && <p className="mt-4 text-sm text-green-400">{state.ok}</p>}

      <button
        type="submit"
        disabled={pending}
        className="mt-5 rounded-full bg-red-600 px-6 py-2 font-semibold hover:bg-red-500 disabled:opacity-50"
      >
        {pending ? "Adding..." : "Add video"}
      </button>
    </form>
  );
}