"use client";

import { useActionState, useState } from "react";
import { POSITIONS } from "@/lib/positions";
import TeamCards, { TEAMS } from "@/components/TeamCards";
import CopyButton from "../news/CopyButton";
import { postTeams } from "./actions";

const SHORT = { Goalkeeper: "GK", Defender: "DEF", Midfielder: "MID", Forward: "FWD" };
const STATUS_ICON = { yes: "✅", maybe: "❓", no: "❌" };

function shuffle(list) {
  const a = [...list];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

// Deals players into teams, one position at a time, so every position is split evenly.
// Each player goes to a team with the fewest players of that position,
// then to the team with the fewest players overall, then at random.
function split(chosen, teamCount) {
  const teams = Array.from({ length: teamCount }, () => ({ players: [] }));

  for (const position of POSITIONS) {
    const group = shuffle(chosen.filter((p) => p.position === position));
    for (const player of group) {
      const inPosition = (t) => t.players.filter((p) => p.position === position).length;
      const fewestInPosition = Math.min(...teams.map(inPosition));
      let candidates = teams.filter((t) => inPosition(t) === fewestInPosition);
      const fewestOverall = Math.min(...candidates.map((t) => t.players.length));
      candidates = candidates.filter((t) => t.players.length === fewestOverall);
      candidates[Math.floor(Math.random() * candidates.length)].players.push(player);
    }
  }
  return teams;
}

const label = (p) => `${p.number} ${p.name}`;

function buildText(cards, title) {
  const out = [`🦁 RED LIONS: ${title}`];
  cards.forEach((team, i) => {
    out.push("", `${TEAMS[i].icon} ${TEAMS[i].name} (${team.players.length})`);
    for (const position of POSITIONS) {
      const names = team.players.filter((p) => p.position === position).map(label);
      if (names.length) out.push(`${SHORT[position]}: ${names.join(", ")}`);
    }
    if (team.order) {
      out.push("Shooting order: " + team.order.map((p, n) => `${n + 1}) ${label(p)}`).join("  "));
    }
  });
  return out.join("\n");
}

const box =
  "rounded-lg border border-neutral-700 bg-neutral-950 px-3 py-2 text-sm outline-none focus:border-red-600";

export default function TeamSplitter({ players, initialSelected }) {
  const [selected, setSelected] = useState(() => new Set(initialSelected));
  const [positions, setPositions] = useState(() =>
    Object.fromEntries(players.map((p) => [p.id, p.position]))
  );
  const [teamCount, setTeamCount] = useState(2);
  const [shootout, setShootout] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const [title, setTitle] = useState("Teams for today's game");
  const [postState, postAction, posting] = useActionState(postTeams, null);

  const chosen = players
    .filter((p) => selected.has(p.id))
    .map((p) => ({ ...p, position: positions[p.id] }));

  function toggle(id) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function generate() {
    if (chosen.length < teamCount * 2) {
      setResult(null);
      setError(`Select at least ${teamCount * 2} players for ${teamCount} teams.`);
      return;
    }
    setError(null);

    const teams = split(chosen, teamCount).map((t) => ({
      players: [...t.players].sort(
        (a, b) =>
          POSITIONS.indexOf(a.position) - POSITIONS.indexOf(b.position) ||
          Number(a.number) - Number(b.number)
      ),
    }));

    const warnings = [];
    const keepers = chosen.filter((p) => p.position === "Goalkeeper").length;
    if (keepers < teamCount) {
      warnings.push(
        `Only ${keepers} goalkeeper${keepers === 1 ? "" : "s"} selected for ${teamCount} teams. Pick a keeper for the other team(s) with the position dropdown, then shuffle again.`
      );
    }
    const sizes = teams.map((t) => t.players.length);
    if (Math.max(...sizes) !== Math.min(...sizes)) {
      warnings.push(`The teams are not the same size (${sizes.join(" vs ")}): odd number of players.`);
    }

    // The data that is displayed, copied and posted: players and (optionally) shooting order
    const cards = teams.map((t) => ({
      players: t.players.map(({ number, name, position }) => ({ number, name, position })),
      order: shootout
        ? shuffle(t.players.filter((p) => p.position !== "Goalkeeper")).map(
            ({ number, name }) => ({ number, name })
          )
        : null,
    }));

    setResult({ cards, warnings });
  }

  const counts = POSITIONS.map(
    (pos) => `${chosen.filter((p) => p.position === pos).length} ${SHORT[pos]}`
  ).join(" · ");
  const text = result ? buildText(result.cards, title) : "";
  const dataJson = result ? JSON.stringify({ teams: result.cards }) : "";

  return (
    <div>
      <div className="flex flex-wrap items-center gap-6 rounded-xl border border-neutral-800 bg-neutral-900 p-4">
        <div className="flex items-center gap-2 text-sm">
          <span className="text-neutral-400">Teams:</span>
          {[2, 3, 4].map((n) => (
            <button
              key={n}
              type="button"
              onClick={() => setTeamCount(n)}
              className={`rounded-lg border px-3 py-1 ${
                teamCount === n
                  ? "border-red-600 bg-red-600 font-semibold"
                  : "border-neutral-700 hover:border-red-600"
              }`}
            >
              {n}
            </button>
          ))}
        </div>
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={shootout}
            onChange={(e) => setShootout(e.target.checked)}
          />
          Add a random shooting order (penalties)
        </label>
      </div>

      <div className="mt-6 flex flex-wrap items-center gap-3">
        <h2 className="text-xl font-semibold text-red-500">
          Who is playing ({chosen.length})
        </h2>
        <button
          type="button"
          onClick={() => setSelected(new Set(players.map((p) => p.id)))}
          className="rounded-lg border border-neutral-700 px-3 py-1 text-xs hover:border-red-600"
        >
          Select all
        </button>
        <button
          type="button"
          onClick={() => setSelected(new Set())}
          className="rounded-lg border border-neutral-700 px-3 py-1 text-xs hover:border-red-600"
        >
          Clear
        </button>
        <span className="text-xs text-neutral-500">{counts}</span>
      </div>

      <div className="mt-3 grid gap-2 md:grid-cols-2">
        {players.map((p) => (
          <div
            key={p.id}
            className={`flex items-center gap-3 rounded-lg border px-3 py-2 text-sm ${
              selected.has(p.id)
                ? "border-neutral-700 bg-neutral-900"
                : "border-neutral-800 opacity-60"
            }`}
          >
            <input
              type="checkbox"
              checked={selected.has(p.id)}
              onChange={() => toggle(p.id)}
              aria-label={`Select ${p.name}`}
            />
            <span className="w-7 font-black text-red-600">{p.number}</span>
            <span className="flex-1">
              {p.name} {p.status ? STATUS_ICON[p.status] : ""}
            </span>
            <select
              value={positions[p.id]}
              onChange={(e) => setPositions((prev) => ({ ...prev, [p.id]: e.target.value }))}
              className="rounded-md border border-neutral-700 bg-neutral-950 px-2 py-1 text-xs"
              aria-label={`Position of ${p.name} today`}
            >
              {POSITIONS.map((pos) => (
                <option key={pos} value={pos}>
                  {SHORT[pos]}
                </option>
              ))}
            </select>
          </div>
        ))}
      </div>

      {error && <p className="mt-4 text-sm text-red-400">{error}</p>}

      <button
        type="button"
        onClick={generate}
        className="mt-6 rounded-full bg-red-600 px-8 py-3 font-semibold hover:bg-red-500"
      >
        🔀 {result ? "Shuffle again" : "Shuffle teams"}
      </button>

      {result && (
        <div className="mt-8">
          {result.warnings.map((w) => (
            <p key={w} className="mb-2 text-sm text-yellow-400">
              ⚠️ {w}
            </p>
          ))}

          <div className="mt-4">
            <TeamCards teams={result.cards} />
          </div>

          <div className="mt-6 rounded-xl border border-neutral-800 bg-neutral-900 p-4">
            <div className="flex flex-wrap items-center gap-3">
              <CopyButton text={text} />
            </div>

            <form action={postAction} className="mt-4">
              <label className="block text-sm text-neutral-400">
                Title for the announcement
              </label>
              <input
                name="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className={`mt-1 w-full ${box}`}
              />
              <input type="hidden" name="body" value={text} />
              <input type="hidden" name="data" value={dataJson} />
              {postState?.error && (
                <p className="mt-3 text-sm text-red-400">{postState.error}</p>
              )}
              {postState?.ok && <p className="mt-3 text-sm text-green-400">{postState.ok}</p>}
              <button
                type="submit"
                disabled={posting}
                className="mt-3 rounded-lg border border-gold px-4 py-2 text-sm text-gold hover:bg-neutral-800 disabled:opacity-50"
              >
                {posting ? "Posting..." : "📣 Post to the players' portal"}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}