"use client";

import { useActionState } from "react";
import PlayerPhoto from "@/components/PlayerPhoto";
import { uploadPlayerPhoto, removePlayerPhoto } from "./photo-actions";

export default function PhotoUpload({ player }) {
  const [state, formAction, pending] = useActionState(uploadPlayerPhoto, null);

  return (
    <div className="flex flex-wrap items-center gap-4">
      <PlayerPhoto player={player} className="h-16 w-16 shrink-0 rounded-lg" />

      <form action={formAction} className="flex flex-wrap items-center gap-2">
        <input type="hidden" name="id" value={player.id} />
        <input
          type="file"
          name="photo"
          required
          accept="image/jpeg,image/png,image/webp"
          className="max-w-[14rem] text-xs text-neutral-400"
        />
        <button
          type="submit"
          disabled={pending}
          className="rounded-lg border border-neutral-700 px-3 py-1 text-xs hover:border-gold disabled:opacity-50"
        >
          {pending ? "Uploading..." : player.photo ? "Replace photo" : "Upload photo"}
        </button>
      </form>

      {player.photo && (
        <form action={removePlayerPhoto}>
          <input type="hidden" name="id" value={player.id} />
          <button className="rounded-lg border border-red-900 px-3 py-1 text-xs text-red-400 hover:bg-red-950">
            Remove photo
          </button>
        </form>
      )}

      {state?.error && <span className="text-xs text-red-400">{state.error}</span>}
      {state?.ok && <span className="text-xs text-green-400">{state.ok}</span>}
    </div>
  );
}