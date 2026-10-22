"use client";

import { useActionState } from "react";
import { saveEvent } from "./actions";

const input =
  "mt-1 w-full rounded-lg border border-neutral-700 bg-neutral-950 px-3 py-2 outline-none focus:border-red-600";

export default function EventForm({ event }) {
  const [state, formAction, pending] = useActionState(saveEvent, null);

  return (
    <form
      action={formAction}
      className="rounded-xl border border-neutral-800 bg-neutral-900 p-5"
    >
      {event && <input type="hidden" name="id" value={event.id} />}

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="block text-sm text-neutral-400">Type</label>
          <select name="type" defaultValue={event?.type ?? "training"} className={input}>
            <option value="training">🏃 Training</option>
            <option value="match">⚽ Match</option>
            <option value="meeting">🗣️ Meeting</option>
          </select>
        </div>
        <div>
          <label className="block text-sm text-neutral-400">Date and time (Jinzhou)</label>
          <input
            type="datetime-local"
            name="starts_at"
            required
            defaultValue={event?.starts_at ?? ""}
            className={input}
          />
        </div>
      </div>

      <label className="mt-4 block text-sm text-neutral-400">Title</label>
      <input
        name="title"
        required
        placeholder="e.g. Training or Red Lions vs Dragons FC"
        defaultValue={event?.title ?? ""}
        className={input}
      />

      <label className="mt-4 block text-sm text-neutral-400">Location</label>
      <input name="location" defaultValue={event?.location ?? ""} className={input} />

      <label className="mt-4 block text-sm text-neutral-400">Notes (optional)</label>
      <textarea name="notes" rows={3} defaultValue={event?.notes ?? ""} className={input} />

      <div className="mt-6 rounded-lg border border-neutral-800 p-4">
        <p className="text-sm font-semibold text-red-500">⚽ Match details (matches only)</p>

        <label className="mt-3 block text-sm text-neutral-400">Opponent</label>
        <input
          name="opponent"
          placeholder="e.g. Dragons FC"
          defaultValue={event?.opponent ?? ""}
          className={input}
        />

        <p className="mt-4 text-sm text-neutral-400">
          Final score (fill in after the match, leave empty before)
        </p>
        <div className="mt-1 flex items-center gap-3">
          <input
            type="number"
            name="score_for"
            min="0"
            max="99"
            placeholder="Red Lions"
            defaultValue={event?.score_for ?? ""}
            className="w-28 rounded-lg border border-neutral-700 bg-neutral-950 px-3 py-2 outline-none focus:border-red-600"
          />
          <span className="text-neutral-500">–</span>
          <input
            type="number"
            name="score_against"
            min="0"
            max="99"
            placeholder="Opponent"
            defaultValue={event?.score_against ?? ""}
            className="w-28 rounded-lg border border-neutral-700 bg-neutral-950 px-3 py-2 outline-none focus:border-red-600"
          />
        </div>
      </div>

      {state?.error && <p className="mt-4 text-sm text-red-400">{state.error}</p>}

      <button
        type="submit"
        disabled={pending}
        className="mt-5 block rounded-full bg-red-600 px-6 py-2 font-semibold hover:bg-red-500 disabled:opacity-50"
      >
        {pending ? "Saving..." : event ? "Save changes" : "Create event"}
      </button>
    </form>
  );
}