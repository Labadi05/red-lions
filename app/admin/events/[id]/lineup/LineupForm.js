"use client";

import { useActionState, useState } from "react";
import Pitch from "@/components/Pitch";
import CopyButton from "../../../news/CopyButton";
import { FORMATIONS, slotCount, slotLabel } from "@/lib/formations";
import { saveLineup } from "./actions";

const ICON = { yes: "✅", maybe: "❓", no: "❌" };
const field =
  "w-full rounded-lg border border-neutral-700 bg-neutral-950 px-3 py-2 text-sm outline-none focus:border-red-600";

function lineupText(event, formation, slotIds, benchIds, playersById) {
  const lines = FORMATIONS[formation];
  const fmt = (id) => (playersById[id] ? `${playersById[id].number} ${playersById[id].name}` : "?");

  const out = [`🦁 RED LIONS\n\n📋 Lineup: ${event.title} (${formation})`, `GK: ${fmt(slotIds[0])}`];
  let cursor = 1;
  lines.forEach((count, li) => {
    const label = li === 0 ? "DEF" : li === lines.length - 1 ? "ATT" : "MID";
    const names = Array.from({ length: count }, (_, k) => fmt(slotIds[cursor + k]));
    out.push(`${label}: ${names.join(", ")}`);
    cursor += count;
  });
  if (benchIds.length) out.push(`Bench: ${benchIds.map(fmt).join(", ")}`);
  return out.join("\n");
}

export default function LineupForm({ event, players }) {
  const [state, formAction, pending] = useActionState(saveLineup, null);
  const [formation, setFormation] = useState(event.formation);
  const [slots, setSlots] = useState(() => {
    const saved = JSON.parse(event.lineup);
    return Array.from({ length: 11 }, (_, i) => saved[i] ?? "");
  });
  const [bench, setBench] = useState(() => JSON.parse(event.bench));

  const n = slotCount(formation);
  const playersById = Object.fromEntries(players.map((p) => [p.id, p]));
  const slotIds = slots.slice(0, n).map(Number);

  function setSlot(i, value) {
    setSlots((prev) => prev.map((v, idx) => (idx === i ? value : v)));
  }
  function toggleBench(id) {
    setBench((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  }

  const label = (p) => `${p.number} · ${p.name} ${p.status ? ICON[p.status] : ""}`;

  return (
    <form action={formAction} className="grid gap-8 md:grid-cols-2">
      <input type="hidden" name="eventId" value={event.id} />

      <div>
        <label className="block text-sm text-neutral-400">Formation</label>
        <select
          name="formation"
          value={formation}
          onChange={(e) => setFormation(e.target.value)}
          className={`mt-1 ${field}`}
        >
          {Object.keys(FORMATIONS).map((f) => (
            <option key={f} value={f}>
              {f} ({slotCount(f)} players)
            </option>
          ))}
        </select>

        <div className="mt-5 space-y-2">
          {Array.from({ length: n }, (_, i) => (
            <div key={i} className="flex items-center gap-3">
              <span className="w-14 text-xs font-semibold text-red-500">
                {slotLabel(formation, i)}
              </span>
              <select
                name={`slot_${i}`}
                value={slots[i]}
                onChange={(e) => setSlot(i, e.target.value)}
                className={field}
              >
                <option value="">— choose —</option>
                {players.map((p) => (
                  <option key={p.id} value={p.id}>
                    {label(p)}
                  </option>
                ))}
              </select>
            </div>
          ))}
        </div>

        <p className="mt-6 text-sm font-semibold text-red-500">Bench</p>
        <div className="mt-2 grid grid-cols-2 gap-1">
          {players.map((p) => (
            <label key={p.id} className="flex items-center gap-2 text-sm text-neutral-300">
              <input
                type="checkbox"
                name="bench"
                value={p.id}
                checked={bench.includes(p.id)}
                onChange={() => toggleBench(p.id)}
              />
              {label(p)}
            </label>
          ))}
        </div>
      </div>

      <div>
        <Pitch formation={formation} slotIds={slotIds} playersById={playersById} />

        <label className="mt-6 flex items-center gap-2 text-sm">
          <input type="checkbox" name="published" defaultChecked={event.lineup_published === 1} />
          Publish to players (they will see it in their portal)
        </label>

        {state?.error && <p className="mt-4 text-sm text-red-400">{state.error}</p>}
        {state?.ok && <p className="mt-4 text-sm text-green-400">{state.ok}</p>}

        <div className="mt-5 flex items-center gap-3">
          <button
            type="submit"
            disabled={pending}
            className="rounded-full bg-red-600 px-6 py-2 font-semibold hover:bg-red-500 disabled:opacity-50"
          >
            {pending ? "Saving..." : "Save lineup"}
          </button>
          <CopyButton text={lineupText(event, formation, slotIds, bench, playersById)} />
        </div>
      </div>
    </form>
  );
}