"use client";

import { useActionState, useState } from "react";
import { saveCheckins } from "./actions";

const ICON = { yes: "✅", maybe: "❓", no: "❌" };
const LABEL = { yes: "said Coming", maybe: "said Maybe", no: "said Can't come" };

export default function CheckinForm({ eventId, rows }) {
  const [state, formAction, pending] = useActionState(saveCheckins, null);
  const [attended, setAttended] = useState(() =>
    Object.fromEntries(rows.map((r) => [r.id, r.attended]))
  );

  function setAll(fn) {
    setAttended(Object.fromEntries(rows.map((r) => [r.id, fn(r)])));
  }

  const btn =
    "rounded-lg border border-neutral-700 px-3 py-1 text-xs hover:border-red-600";

  return (
    <form action={formAction}>
      <input type="hidden" name="eventId" value={eventId} />

      <div className="flex flex-wrap gap-2">
        <button type="button" className={btn} onClick={() => setAll((r) => r.status === "yes")}>
          Tick those who said Coming
        </button>
        <button type="button" className={btn} onClick={() => setAll(() => true)}>
          Tick all
        </button>
        <button type="button" className={btn} onClick={() => setAll(() => false)}>
          Clear all
        </button>
      </div>

      <div className="mt-4 space-y-2">
        {rows.map((r) => (
          <label
            key={r.id}
            className="flex items-center gap-3 rounded-xl border border-neutral-800 bg-neutral-900 px-4 py-3"
          >
            <input
              type="checkbox"
              name={`attended_${r.id}`}
              checked={Boolean(attended[r.id])}
              onChange={(e) => setAttended((prev) => ({ ...prev, [r.id]: e.target.checked }))}
            />
            <span className="font-black text-red-600">{r.number}</span>
            <span className="font-medium">{r.name}</span>
            <span className="ml-auto text-xs text-neutral-500">
              {r.status ? `${ICON[r.status]} ${LABEL[r.status]}` : "no reply"}
            </span>
          </label>
        ))}
      </div>

      {state?.error && <p className="mt-4 text-sm text-red-400">{state.error}</p>}
      {state?.ok && <p className="mt-4 text-sm text-green-400">{state.ok}</p>}

      <button
        type="submit"
        disabled={pending}
        className="mt-5 rounded-full bg-red-600 px-6 py-2 font-semibold hover:bg-red-500 disabled:opacity-50"
      >
        {pending ? "Saving..." : "Save check-in"}
      </button>
    </form>
  );
}