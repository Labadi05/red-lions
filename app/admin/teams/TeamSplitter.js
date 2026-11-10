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

const byPositionThenNumber = (a, b) =>
  POSITIONS.indexOf(a.position) - POSITIONS.indexOf(b.position) ||
  Number(a.number) - Number(b.number);

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
const smallBtn =
  "rounded-lg border border-neutral-700 px-3 py-1 text-xs hover:border-red-600 disabled:opacity-40";

export default function TeamSplitter({ players, hasEvent }) {
  const [teamCount, setTeamCount] = useState(2);
  const [assign, setAssign] = useState({}); // player id -> team number (0, 1, 2, 3)
  const [positions, setPositions] = useState(() =>
    Object.fromEntries(players.map((p) => [p.id, p.position]))
  );
  const [onlyComing, setOnlyComing] = useState(hasEvent);
  const [shuffled, setShuffled] = useState(null); // { sig, lists }
  const [title, setTitle] = useState("Teams for today's game");
  const [postState, postAction, posting] = useActionState(postTeams, null);

  // The teams, built from your choices
  const teams = Array.from({ length: teamCount }, (_, i) => ({
    players: players
      .filter((p) => assign[p.id] === i)
      .map((p) => ({ ...p, position: positions[p.id] }))
      .sort(byPositionThenNumber),
  }));

  // The shooting order is only valid while the teams stay as they were when it was shuffled
  const signature = JSON.stringify(teams.map((t) => t.players.map((p) => [p.id, p.position])));
  const order = shuffled && shuffled.sig === signature ? shuffled.lists : null;

  const cards = teams.map((t, i) => ({
    players: t.players.map(({ number, name, position }) => ({ number, name, position })),
    order: order ? order[i] : null,
  }));

  const ready = teams.every((t) => t.players.length > 0);
  const assignedCount = teams.reduce((sum, t) => sum + t.players.length, 0);

  const warnings = [];
  teams.forEach((t, i) => {
    if (t.players.length > 0 && !t.players.some((p) => p.position === "Goalkeeper")) {
      warnings.push(`${TEAMS[i].name} has no goalkeeper.`);
    }
  });
  const sizes = teams.map((t) => t.players.length);
  if (assignedCount > 0 && Math.max(...sizes) !== Math.min(...sizes)) {
    warnings.push(`The teams are not the same size (${sizes.join(" vs ")}).`);
  }

  function setTeam(playerId, team) {
    setAssign((prev) => {
      const next = { ...prev };
      if (team === null) delete next[playerId];
      else next[playerId] = team;
      return next;
    });
  }

  function changeTeamCount(n) {
    setTeamCount(n);
    // Players of a removed team go back to "not playing"
    setAssign((prev) => Object.fromEntries(Object.entries(prev).filter(([, team]) => team < n)));
  }

  function shuffleOrder() {
    const lists = teams.map((t) =>
      shuffle(t.players.filter((p) => p.position !== "Goalkeeper")).map(({ number, name }) => ({
        number,
        name,
      }))
    );
    setShuffled({ sig: signature, lists });
  }

  const visible = players.filter(
    (p) => !onlyComing || p.status === "yes" || assign[p.id] !== undefined
  );
  const text = ready ? buildText(cards, title) : "";
  const dataJson = ready ? JSON.stringify({ teams: cards }) : "";

  return (
    <div>
      {/* Settings */}
      <div className="flex flex-wrap items-center gap-6 rounded-xl border border-neutral-800 bg-neutral-900 p-4">
        <div className="flex items-center gap-2 text-sm">
          <span className="text-neutral-400">Teams:</span>
          {[2, 3, 4].map((n) => (
            <button
              key={n}
              type="button"
              onClick={() => changeTeamCount(n)}
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

        {hasEvent && (
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={onlyComing}
              onChange={(e) => setOnlyComing(e.target.checked)}
            />
            Only players who said Coming
          </label>
        )}

        <button type="button" onClick={() => setAssign({})} className={smallBtn}>
          Clear all teams
        </button>
      </div>

      {/* Players */}
      <div className="mt-6 flex flex-wrap items-center gap-3">
        <h2 className="text-xl font-semibold text-red-500">Players</h2>
        <span className="text-xs text-neutral-500">
          {assignedCount} placed · tap a team to put a player in it, or — to leave them out
        </span>
      </div>

      <div className="mt-3 grid gap-2 md:grid-cols-2">
        {visible.map((p) => {
          const team = assign[p.id];
          return (
            <div
              key={p.id}
              className={`flex flex-wrap items-center gap-2 rounded-lg border-2 px-3 py-2 text-sm ${
                team !== undefined ? TEAMS[team].border : "border-neutral-800"
              } bg-neutral-900`}
            >
              <span className="w-7 font-black text-red-600">{p.number}</span>
              <span className="min-w-[6rem] flex-1">
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

              <div className="flex gap-1">
                <button
                  type="button"
                  onClick={() => setTeam(p.id, null)}
                  className={`rounded-md border px-2 py-1 text-sm ${
                    team === undefined
                      ? "border-neutral-300 bg-neutral-700"
                      : "border-neutral-700 opacity-60 hover:opacity-100"
                  }`}
                  aria-label="Not playing"
                >
                  —
                </button>
                {TEAMS.slice(0, teamCount).map((t, i) => (
                  <button
                    key={t.name}
                    type="button"
                    onClick={() => setTeam(p.id, i)}
                    className={`rounded-md border px-2 py-1 text-sm ${
                      team === i
                        ? `${t.border} bg-white/10`
                        : "border-neutral-700 opacity-60 hover:opacity-100"
                    }`}
                    aria-label={t.name}
                    title={t.name}
                  >
                    {t.icon}
                  </button>
                ))}
              </div>
            </div>
          );
        })}
      </div>

      {/* Live preview */}
      <h2 className="mt-10 text-xl font-semibold text-red-500">The teams</h2>
      {warnings.map((w) => (
        <p key={w} className="mt-2 text-sm text-yellow-400">
          ⚠️ {w}
        </p>
      ))}
      <div className="mt-4">
        <TeamCards teams={cards} />
      </div>

      {/* Penalties: the only random part */}
      <div className="mt-6 rounded-xl border border-neutral-800 bg-neutral-900 p-4">
        <p className="text-sm font-semibold">🎯 Penalty shootout</p>
        <p className="mt-1 text-xs text-neutral-400">
          The teams stay exactly as you chose. Only the order of the shooters in each team is
          random (goalkeepers are not in the order).
        </p>
        <div className="mt-3 flex flex-wrap gap-2">
          <button
            type="button"
            onClick={shuffleOrder}
            disabled={!ready}
            className="rounded-full bg-red-600 px-5 py-2 text-sm font-semibold hover:bg-red-500 disabled:opacity-40"
          >
            🔀 {order ? "Shuffle again" : "Shuffle shooting order"}
          </button>
          {order && (
            <button type="button" onClick={() => setShuffled(null)} className={smallBtn}>
              Remove the order
            </button>
          )}
        </div>
        {!ready && (
          <p className="mt-2 text-xs text-neutral-500">
            Every team needs at least one player first.
          </p>
        )}
      </div>

      {/* Share */}
      {ready && (
        <div className="mt-6 rounded-xl border border-neutral-800 bg-neutral-900 p-4">
          <div className="flex flex-wrap items-center gap-3">
            <CopyButton text={text} />
          </div>

          <form action={postAction} className="mt-4">
            <label className="block text-sm text-neutral-400">Title for the announcement</label>
            <input
              name="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className={`mt-1 w-full ${box}`}
            />
            <input type="hidden" name="body" value={text} />
            <input type="hidden" name="data" value={dataJson} />
            {postState?.error && <p className="mt-3 text-sm text-red-400">{postState.error}</p>}
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
      )}
    </div>
  );
}