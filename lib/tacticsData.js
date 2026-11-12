import { FORMATIONS } from "@/lib/formations";

export const CATEGORIES = {
  formation: { label: "Formation", icon: "📐" },
  attack: { label: "Attack", icon: "⚔️" },
  defense: { label: "Defense", icon: "🛡️" },
  corner: { label: "Corner", icon: "🚩" },
  freekick: { label: "Free kick", icon: "🎯" },
  penalty: { label: "Penalty", icon: "🥅" },
  pressing: { label: "Pressing", icon: "🔥" },
  other: { label: "Other", icon: "📋" },
};

// The pitch is drawn on a 680 x 1050 canvas with a 20 unit margin.
// Positions inside the board are stored as 0..1 (0,0 = top-left corner of the pitch).
export const PITCH = { w: 680, h: 1050, margin: 20 };

export function toSvg([x, y]) {
  return [
    PITCH.margin + x * (PITCH.w - 2 * PITCH.margin),
    PITCH.margin + y * (PITCH.h - 2 * PITCH.margin),
  ];
}

export function fromSvg([px, py]) {
  const clamp = (v) => Math.min(1, Math.max(0, v));
  return [
    clamp((px - PITCH.margin) / (PITCH.w - 2 * PITCH.margin)),
    clamp((py - PITCH.margin) / (PITCH.h - 2 * PITCH.margin)),
  ];
}

export function uid() {
  return Math.random().toString(36).slice(2, 8);
}

export function emptyBoard() {
  return { v: 1, items: [], frames: [{ pos: {}, draw: [], caption: "" }] };
}

// Where the 11 (or 7) players stand for a formation.
// "home" defends the bottom goal and attacks upwards. "away" is the mirror image.
export function formationSpots(formation, side = "home") {
  const lines = FORMATIONS[formation] ?? [];
  const spots = [{ role: "Goalkeeper", pos: [0.5, 0.92] }];

  lines.forEach((count, i) => {
    const y =
      lines.length === 1 ? 0.5 : 0.76 - i * ((0.76 - 0.26) / (lines.length - 1));
    const role = i === 0 ? "Defender" : i === lines.length - 1 ? "Forward" : "Midfielder";
    for (let j = 0; j < count; j++) {
      spots.push({ role, pos: [(j + 1) / (count + 1), y] });
    }
  });

  return side === "away" ? spots.map((s) => ({ ...s, pos: [s.pos[0], 1 - s.pos[1]] })) : spots;
}

// ---- Checking a board before it is saved (only the expected fields are kept) ----
const KINDS = ["home", "away", "ball", "cone"];
const DRAW_TYPES = ["run", "pass", "line"];
const ROLES = ["Goalkeeper", "Defender", "Midfielder", "Forward"];

const num01 = (v) => {
  const n = Number(v);
  return Number.isFinite(n) ? Math.min(1, Math.max(0, Math.round(n * 1000) / 1000)) : null;
};
const point = (p) => {
  if (!Array.isArray(p) || p.length !== 2) return null;
  const x = num01(p[0]);
  const y = num01(p[1]);
  return x === null || y === null ? null : [x, y];
};
const cleanId = (v) => String(v ?? "").replace(/[^a-zA-Z0-9]/g, "").slice(0, 12);

export function cleanBoard(raw) {
  let b;
  try {
    b = typeof raw === "string" ? JSON.parse(raw) : raw;
  } catch {
    return null;
  }
  if (!b || !Array.isArray(b.items) || !Array.isArray(b.frames)) return null;
  if (b.items.length > 60 || b.frames.length < 1 || b.frames.length > 12) return null;

  const ids = new Set();
  const items = [];
  for (const it of b.items) {
    const id = cleanId(it?.id);
    if (!id || ids.has(id) || !KINDS.includes(it?.kind)) return null;
    ids.add(id);
    items.push({
      id,
      kind: it.kind,
      label: String(it.label ?? "").slice(0, 3),
      name: String(it.name ?? "").slice(0, 14),
      role: ROLES.includes(it.role) ? it.role : "",
      playerId: Number.isInteger(it.playerId) ? it.playerId : null,
    });
  }

  const frames = [];
  for (const f of b.frames) {
    const pos = {};
    for (const id of ids) {
      const p = point(f?.pos?.[id]);
      if (!p) return null;
      pos[id] = p;
    }

    const draw = [];
    for (const d of Array.isArray(f?.draw) ? f.draw.slice(0, 80) : []) {
      const id = cleanId(d?.id) || uid();
      if (d?.type === "text") {
        const at = point(d.at);
        const text = String(d.text ?? "").trim().slice(0, 24);
        if (at && text) draw.push({ id, type: "text", at, text });
      } else if (DRAW_TYPES.includes(d?.type)) {
        const a = point(d.a);
        const bb = point(d.b);
        if (a && bb) draw.push({ id, type: d.type, a, b: bb });
      }
    }

    frames.push({ pos, draw, caption: String(f?.caption ?? "").slice(0, 80) });
  }

  return { v: 1, items, frames };
}