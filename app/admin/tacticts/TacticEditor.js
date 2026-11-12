"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import BoardSvg from "@/components/tactics/BoardSvg";
import { exportBoardPng } from "@/components/tactics/exportImage";
import { FORMATIONS } from "@/lib/formations";
import { CATEGORIES, fromSvg, toSvg, uid, formationSpots } from "@/lib/tacticsData";
import { saveTactic } from "./actions";

const TOOLS = [
  ["move", "✋ Move"],
  ["run", "➡ Run"],
  ["pass", "➤ Pass"],
  ["line", "▬ Line"],
  ["text", "🅣 Text"],
  ["erase", "🧽 Erase"],
];

const input =
  "w-full rounded-lg border border-neutral-700 bg-neutral-950 px-3 py-2 text-sm outline-none focus:border-red-600";
const btn =
  "rounded-lg border border-neutral-700 px-3 py-1.5 text-sm hover:border-red-600 disabled:opacity-40";
const card = "rounded-xl border border-neutral-800 bg-neutral-900 p-4";

function withFrame(board, index, fn) {
  return { ...board, frames: board.frames.map((f, i) => (i === index ? fn(f) : f)) };
}

export default function TacticEditor({ tactic, players, matches }) {
  const [board, setBoard] = useState(tactic.board);
  const [frameIdx, setFrameIdx] = useState(0);
  const [mode, setMode] = useState("move");
  const [selected, setSelected] = useState(null);
  const [past, setPast] = useState([]);
  const [future, setFuture] = useState([]);
  const [drag, setDrag] = useState(null);
  const [preview, setPreview] = useState(null);
  const [playing, setPlaying] = useState(false);
  const [title, setTitle] = useState(tactic.title);
  const svgRef = useRef(null);
  const [state, formAction, pending] = useActionState(saveTactic, null);

  const index = Math.min(frameIdx, board.frames.length - 1);
  const frame = board.frames[index];
  const sel = board.items.find((i) => i.id === selected) ?? null;

  // ---- Undo / redo ----
  function snapshot() {
    setPast((p) => [...p.slice(-59), board]);
    setFuture([]);
  }
  function commit(next) {
    snapshot();
    setBoard(next);
  }
  function undo() {
    if (past.length === 0) return;
    const previous = past[past.length - 1];
    setFuture((f) => [board, ...f]);
    setPast(past.slice(0, -1));
    setBoard(previous);
    setFrameIdx((i) => Math.min(i, previous.frames.length - 1));
  }
  function redo() {
    if (future.length === 0) return;
    const next = future[0];
    setPast((p) => [...p, board]);
    setFuture(future.slice(1));
    setBoard(next);
    setFrameIdx((i) => Math.min(i, next.frames.length - 1));
  }

  // ---- Play the steps ----
  useEffect(() => {
    if (!playing) return;
    const id = setTimeout(() => {
      if (index + 1 >= board.frames.length) setPlaying(false);
      else setFrameIdx(index + 1);
    }, 2400);
    return () => clearTimeout(id);
  }, [playing, index, board.frames.length]);

  function play() {
    setSelected(null);
    setFrameIdx(0);
    setPlaying(true);
  }

  // ---- Pointer handling on the pitch ----
  function pointOf(e) {
    const svg = svgRef.current;
    const pt = svg.createSVGPoint();
    pt.x = e.clientX;
    pt.y = e.clientY;
    const p = pt.matrixTransform(svg.getScreenCTM().inverse());
    return [p.x, p.y];
  }

  function onItemDown(e, item) {
    if (playing || mode !== "move") return; // in drawing modes the tap starts an arrow instead
    e.stopPropagation();
    svgRef.current.setPointerCapture(e.pointerId);
    const [px, py] = pointOf(e);
    const [cx, cy] = toSvg(frame.pos[item.id]);
    snapshot();
    setSelected(item.id);
    setDrag({ id: item.id, dx: cx - px, dy: cy - py });
  }

  function onBackgroundDown(e) {
    if (playing) return;
    const [px, py] = pointOf(e);

    if (mode === "move") {
      setSelected(null);
      return;
    }
    if (mode === "erase") return;
    if (mode === "text") {
      const text = window.prompt("Text (max 24 characters)");
      if (text && text.trim()) {
        commit(
          withFrame(board, index, (f) => ({
            ...f,
            draw: [
              ...f.draw,
              { id: uid(), type: "text", at: fromSvg([px, py]), text: text.trim().slice(0, 24) },
            ],
          }))
        );
      }
      return;
    }

    svgRef.current.setPointerCapture(e.pointerId);
    const start = fromSvg([px, py]);
    setPreview({ id: uid(), type: mode, a: start, b: start });
  }

  function onMove(e) {
    if (drag) {
      const [px, py] = pointOf(e);
      const pos = fromSvg([px + drag.dx, py + drag.dy]);
      setBoard((b) => withFrame(b, index, (f) => ({ ...f, pos: { ...f.pos, [drag.id]: pos } })));
    } else if (preview) {
      const [px, py] = pointOf(e);
      setPreview((p) => ({ ...p, b: fromSvg([px, py]) }));
    }
  }

  function onUp() {
    if (preview) {
      const [ax, ay] = toSvg(preview.a);
      const [bx, by] = toSvg(preview.b);
      if (Math.hypot(bx - ax, by - ay) > 25) {
        commit(withFrame(board, index, (f) => ({ ...f, draw: [...f.draw, preview] })));
      }
      setPreview(null);
    }
    setDrag(null);
  }

  function eraseShape(id) {
    commit(withFrame(board, index, (f) => ({ ...f, draw: f.draw.filter((d) => d.id !== id) })));
  }

  // ---- Items ----
  function addItem(kind) {
    const id = uid();
    const spot = [0.5 + (Math.random() - 0.5) * 0.2, 0.5 + (Math.random() - 0.5) * 0.2];
    commit({
      ...board,
      items: [...board.items, { id, kind, label: "", name: "", role: "", playerId: null }],
      frames: board.frames.map((f) => ({ ...f, pos: { ...f.pos, [id]: spot } })),
    });
    setSelected(id);
  }

  function applyFormation(side, name) {
    if (!name) return;
    const spots = formationSpots(name, side);
    const removed = new Set(board.items.filter((i) => i.kind === side).map((i) => i.id));
    const created = spots.map((s, n) => ({
      id: uid(),
      kind: side,
      label: String(n + 1),
      name: "",
      role: s.role,
      playerId: null,
    }));

    commit({
      ...board,
      items: [...board.items.filter((i) => i.kind !== side), ...created],
      frames: board.frames.map((f) => {
        const pos = Object.fromEntries(Object.entries(f.pos).filter(([id]) => !removed.has(id)));
        created.forEach((it, n) => {
          pos[it.id] = spots[n].pos;
        });
        return { ...f, pos };
      }),
    });
    setSelected(null);
  }

  // Puts squad players on the red tokens, matching their registered positions
  function autoFill() {
    const used = new Set();
    commit({
      ...board,
      items: board.items.map((it) => {
        if (it.kind !== "home" || !it.role) return it;
        const p = players.find((pl) => pl.position === it.role && !used.has(pl.id));
        if (!p) return it;
        used.add(p.id);
        return { ...it, label: p.number, name: p.name, playerId: p.id };
      }),
    });
  }

  function typeIntoItem(id, patch) {
    setBoard((b) => ({ ...b, items: b.items.map((i) => (i.id === id ? { ...i, ...patch } : i)) }));
  }

  function choosePlayer(id, playerId) {
    const p = players.find((pl) => pl.id === Number(playerId));
    commit({
      ...board,
      items: board.items.map((i) =>
        i.id === id
          ? p
            ? { ...i, playerId: p.id, label: p.number, name: p.name }
            : { ...i, playerId: null }
          : i
      ),
    });
  }

  function deleteItem(id) {
    commit({
      ...board,
      items: board.items.filter((i) => i.id !== id),
      frames: board.frames.map((f) => {
        const pos = { ...f.pos };
        delete pos[id];
        return { ...f, pos };
      }),
    });
    setSelected(null);
  }

  // ---- Steps ----
  function addFrame() {
    const copy = { pos: { ...frame.pos }, draw: [], caption: "" };
    commit({
      ...board,
      frames: [...board.frames.slice(0, index + 1), copy, ...board.frames.slice(index + 1)],
    });
    setFrameIdx(index + 1);
  }

  function deleteFrame() {
    if (board.frames.length < 2) return;
    commit({ ...board, frames: board.frames.filter((_, i) => i !== index) });
    setFrameIdx(Math.max(0, index - 1));
  }

  function setCaption(text) {
    setBoard((b) => withFrame(b, index, (f) => ({ ...f, caption: text.slice(0, 80) })));
  }

  const categoryList = Object.entries(CATEGORIES);

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,460px)_1fr]">
      {/* The pitch */}
      <div>
        <div className="overflow-hidden rounded-2xl border border-neutral-800">
          <BoardSvg
            svgRef={svgRef}
            items={board.items}
            positions={frame.pos}
            draw={frame.draw}
            preview={preview}
            selectedId={playing ? null : selected}
            dragId={drag?.id ?? null}
            erasing={mode === "erase" && !playing}
            onErase={eraseShape}
            onItemPointerDown={playing ? undefined : onItemDown}
            onBackgroundPointerDown={playing ? undefined : onBackgroundDown}
            onPointerMove={onMove}
            onPointerUp={onUp}
            frameKey={index}
          />
        </div>
        <p className="mt-2 min-h-[1.5rem] text-center text-sm text-neutral-300">
          {frame.caption || ""}
        </p>
      </div>

      {/* Tools */}
      <div className="space-y-4">
        <div className={card}>
          <div className="flex flex-wrap gap-2">
            {TOOLS.map(([key, label]) => (
              <button
                key={key}
                type="button"
                onClick={() => setMode(key)}
                className={`rounded-lg border px-3 py-1.5 text-sm ${
                  mode === key
                    ? "border-red-600 bg-red-600 font-semibold"
                    : "border-neutral-700 hover:border-red-600"
                }`}
              >
                {label}
              </button>
            ))}
          </div>
          <div className="mt-3 flex flex-wrap gap-2">
            <button type="button" onClick={undo} disabled={past.length === 0} className={btn}>
              ↶ Undo
            </button>
            <button type="button" onClick={redo} disabled={future.length === 0} className={btn}>
              ↷ Redo
            </button>
            <button
              type="button"
              onClick={() => commit(withFrame(board, index, (f) => ({ ...f, draw: [] })))}
              disabled={frame.draw.length === 0}
              className={btn}
            >
              Clear drawings (this step)
            </button>
          </div>
          <p className="mt-3 text-xs text-neutral-500">
            Move: drag players. Run, Pass, Line: drag on the pitch. Text: tap where you want it.
            Erase: tap an arrow or label.
          </p>
        </div>

        <div className={card}>
          <p className="text-sm font-semibold">Players on the board</p>
          <div className="mt-3 grid gap-2 sm:grid-cols-2">
            <select
              value=""
              onChange={(e) => applyFormation("home", e.target.value)}
              className={input}
            >
              <option value="">🔴 Place my team…</option>
              {Object.keys(FORMATIONS).map((f) => (
                <option key={f} value={f}>
                  {f}
                </option>
              ))}
            </select>
            <select
              value=""
              onChange={(e) => applyFormation("away", e.target.value)}
              className={input}
            >
              <option value="">⚪ Place the opponent…</option>
              {Object.keys(FORMATIONS).map((f) => (
                <option key={f} value={f}>
                  {f}
                </option>
              ))}
            </select>
          </div>
          <div className="mt-3 flex flex-wrap gap-2">
            <button type="button" onClick={autoFill} className={btn}>
              ✨ Auto-fill players
            </button>
            <button type="button" onClick={() => addItem("home")} className={btn}>
              + Player
            </button>
            <button type="button" onClick={() => addItem("away")} className={btn}>
              + Opponent
            </button>
            <button type="button" onClick={() => addItem("ball")} className={btn}>
              + Ball
            </button>
            <button type="button" onClick={() => addItem("cone")} className={btn}>
              + Cone
            </button>
          </div>

          {sel && (sel.kind === "home" || sel.kind === "away") && (
            <div className="mt-4 space-y-2 rounded-lg border border-neutral-700 p-3">
              <p className="text-xs font-semibold text-gold">Selected token</p>
              {sel.kind === "home" && (
                <select
                  value={sel.playerId ?? ""}
                  onChange={(e) => choosePlayer(sel.id, e.target.value)}
                  className={input}
                >
                  <option value="">Choose a squad player…</option>
                  {players.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.number} {p.name}
                    </option>
                  ))}
                </select>
              )}
              <div className="grid grid-cols-[80px_1fr] gap-2">
                <input
                  value={sel.label}
                  maxLength={3}
                  onChange={(e) => typeIntoItem(sel.id, { label: e.target.value })}
                  placeholder="No."
                  className={input}
                />
                <input
                  value={sel.name}
                  maxLength={14}
                  onChange={(e) => typeIntoItem(sel.id, { name: e.target.value })}
                  placeholder="Name"
                  className={input}
                />
              </div>
              <button type="button" onClick={() => deleteItem(sel.id)} className={btn}>
                Remove this token
              </button>
            </div>
          )}
          {sel && (sel.kind === "ball" || sel.kind === "cone") && (
            <button type="button" onClick={() => deleteItem(sel.id)} className={`mt-4 ${btn}`}>
              Remove the {sel.kind}
            </button>
          )}
        </div>

        <div className={card}>
          <p className="text-sm font-semibold">
            Steps (animation): step {index + 1} of {board.frames.length}
          </p>
          <div className="mt-3 flex flex-wrap items-center gap-2">
            {board.frames.map((_, i) => (
              <button
                key={i}
                type="button"
                onClick={() => {
                  setPlaying(false);
                  setFrameIdx(i);
                }}
                className={`h-9 w-9 rounded-lg border text-sm font-bold ${
                  i === index
                    ? "border-red-600 bg-red-600"
                    : "border-neutral-700 hover:border-red-600"
                }`}
              >
                {i + 1}
              </button>
            ))}
            <button
              type="button"
              onClick={addFrame}
              disabled={board.frames.length >= 12}
              className={btn}
            >
              + Add step
            </button>
            <button
              type="button"
              onClick={deleteFrame}
              disabled={board.frames.length < 2}
              className={btn}
            >
              Delete step
            </button>
          </div>
          <input
            value={frame.caption}
            onChange={(e) => setCaption(e.target.value)}
            placeholder="Caption for this step, e.g. The winger drops deep"
            className={`mt-3 ${input}`}
          />
          <p className="mt-2 text-xs text-neutral-500">
            A new step starts with the players where they are now. Move them to show what
            happens next.
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            {playing ? (
              <button type="button" onClick={() => setPlaying(false)} className={btn}>
                ⏹ Stop
              </button>
            ) : (
              <button
                type="button"
                onClick={play}
                disabled={board.frames.length < 2}
                className={btn}
              >
                ▶ Play
              </button>
            )}
            <button
              type="button"
              onClick={() =>
                exportBoardPng(svgRef.current, {
                  title,
                  caption: frame.caption,
                  filename: `${(title || "tactic").replace(/[^\w]+/g, "-").toLowerCase()}-step-${index + 1}.png`,
                })
              }
              className={btn}
            >
              🖼 Save image
            </button>
          </div>
        </div>

        {/* Save */}
        <form action={formAction} className={card}>
          <input type="hidden" name="id" value={tactic.id ?? ""} />
          <input type="hidden" name="data" value={JSON.stringify(board)} />

          <label className="block text-sm text-neutral-400">Title</label>
          <input
            name="title"
            required
            maxLength={80}
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g. Short corner routine"
            className={`mt-1 ${input}`}
          />

          <div className="mt-3 grid gap-3 sm:grid-cols-2">
            <div>
              <label className="block text-sm text-neutral-400">Category</label>
              <select name="category" defaultValue={tactic.category} className={`mt-1 ${input}`}>
                {categoryList.map(([key, c]) => (
                  <option key={key} value={key}>
                    {c.icon} {c.label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm text-neutral-400">Attach to a match (optional)</label>
              <select
                name="event_id"
                defaultValue={tactic.event_id ?? ""}
                className={`mt-1 ${input}`}
              >
                <option value="">No match</option>
                {matches.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.title} · {m.starts_at.slice(0, 10)}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <label className="mt-3 block text-sm text-neutral-400">Notes for the players</label>
          <textarea
            name="notes"
            rows={4}
            defaultValue={tactic.notes}
            maxLength={1000}
            placeholder="What each player must do…"
            className={`mt-1 ${input}`}
          />

          <label className="mt-3 flex items-center gap-2 text-sm">
            <input type="checkbox" name="published" defaultChecked={tactic.published === 1} />
            Show to players (in their portal)
          </label>

          {state?.error && <p className="mt-3 text-sm text-red-400">{state.error}</p>}
          {state?.ok && <p className="mt-3 text-sm text-green-400">{state.ok}</p>}

          <button
            type="submit"
            disabled={pending}
            className="mt-4 rounded-full bg-red-600 px-6 py-2 font-semibold hover:bg-red-500 disabled:opacity-50"
          >
            {pending ? "Saving..." : "Save tactic"}
          </button>
        </form>
      </div>
    </div>
  );
}