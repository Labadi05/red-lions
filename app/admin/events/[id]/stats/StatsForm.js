"use client";

import { useActionState } from "react";
import { saveMatchStats } from "./actions";

const ICON = { yes: "✅", maybe: "❓", no: "❌" };
const num =
  "w-16 rounded-lg border border-neutral-700 bg-neutral-950 px-2 py-1 text-center text-sm outline-none focus:border-red-600";

export default function StatsForm({ eventId, rows }) {
  const [state, formAction, pending] = useActionState(saveMatchStats, null);

  return (
    <form action={formAction}>
      <input type="hidden" name="eventId" value={eventId} />

      <div className="overflow-x-auto rounded-xl border border-neutral-800">
        <table className="w-full min-w-[460px] text-sm">
          <thead className="bg-neutral-900 text-xs uppercase text-neutral-400">
            <tr>
              <th className="px-3 py-3 text-left">Player</th>
              <th className="px-3 py-3 text-center">Played</th>
              <th className="px-3 py-3 text-center">Goals</th>
              <th className="px-3 py-3 text-center">Assists</th>
              <th className="px-3 py-3 text-center">⭐ MOTM</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.id} className="border-t border-neutral-800">
                <td className="px-3 py-2">
                  <span className="font-black text-red-600">{r.number}</span> {r.name}{" "}
                  {r.status ? ICON[r.status] : ""}
                </td>
                <td className="px-3 py-2 text-center">
                  <input type="checkbox" name={`played_${r.id}`} defaultChecked={r.played} />
                </td>
                <td className="px-3 py-2 text-center">
                  <input
                    type="number"
                    name={`goals_${r.id}`}
                    min="0"
                    max="20"
                    defaultValue={r.goals}
                    className={num}
                  />
                </td>
                <td className="px-3 py-2 text-center">
                  <input
                    type="number"
                    name={`assists_${r.id}`}
                    min="0"
                    max="20"
                    defaultValue={r.assists}
                    className={num}
                  />
                </td>
                <td className="px-3 py-2 text-center">
                  <input type="radio" name="motm" value={r.id} defaultChecked={r.motm} />
                </td>
              </tr>
            ))}
            <tr className="border-t border-neutral-800 text-neutral-400">
              <td className="px-3 py-2" colSpan={4}>
                No man of the match
              </td>
              <td className="px-3 py-2 text-center">
                <input type="radio" name="motm" value="" defaultChecked={!rows.some((r) => r.motm)} />
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      {state?.error && <p className="mt-4 text-sm text-red-400">{state.error}</p>}
      {state?.ok && <p className="mt-4 text-sm text-green-400">{state.ok}</p>}

      <button
        type="submit"
        disabled={pending}
        className="mt-5 rounded-full bg-red-600 px-6 py-2 font-semibold hover:bg-red-500 disabled:opacity-50"
      >
        {pending ? "Saving..." : "Save stats"}
      </button>
    </form>
  );
}