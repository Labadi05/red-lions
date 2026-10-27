"use client";

import { useActionState } from "react";
import { POSITIONS } from "@/lib/positions";
import { addPlayer, updatePlayer } from "./actions";

const box =
  "rounded-lg border border-neutral-700 bg-neutral-950 px-3 py-1.5 text-sm outline-none focus:border-red-600";

// Without "player" it adds a new player. With "player" it edits that player.
export default function PlayerForm({ player }) {
  const [state, formAction, pending] = useActionState(
    player ? updatePlayer : addPlayer,
    null
  );

  return (
    <form action={formAction} className="flex flex-wrap items-end gap-2">
      {player && <input type="hidden" name="id" value={player.id} />}

      <label className="flex flex-col text-[10px] text-neutral-500">
        No.
        <input
          name="number"
          required
          inputMode="numeric"
          maxLength={2}
          placeholder="07"
          defaultValue={player?.number ?? ""}
          className={`w-16 text-center ${box}`}
        />
      </label>

      <label className="flex flex-col text-[10px] text-neutral-500">
        Name
        <input
          name="name"
          required
          maxLength={30}
          placeholder="Player name"
          defaultValue={player?.name ?? ""}
          className={`w-44 ${box}`}
        />
      </label>

      <label className="flex flex-col text-[10px] text-neutral-500">
        Position
        <select name="position" defaultValue={player?.position ?? "Midfielder"} className={box}>
          {POSITIONS.map((p) => (
            <option key={p} value={p}>
              {p}
            </option>
          ))}
        </select>
      </label>

      <button
        type="submit"
        disabled={pending}
        className="rounded-lg bg-red-600 px-4 py-1.5 text-sm font-semibold hover:bg-red-500 disabled:opacity-50"
      >
        {player ? "Save" : "Add player"}
      </button>

      {state?.error && <span className="pb-1 text-sm text-red-400">{state.error}</span>}
      {state?.ok && <span className="pb-1 text-sm text-green-400">{state.ok}</span>}
    </form>
  );
}