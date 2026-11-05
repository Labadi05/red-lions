"use server";

import { revalidatePath } from "next/cache";
import db from "@/lib/db";
import { requireAdmin } from "@/lib/auth";
import { POSITIONS } from "@/lib/positions";
import { sendPush } from "@/lib/push";

// Rebuilds the teams from scratch, keeping only the fields we expect
function cleanTeams(raw) {
  let parsed;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return null;
  }
  if (!Array.isArray(parsed?.teams) || parsed.teams.length < 2 || parsed.teams.length > 4) {
    return null;
  }

  const teams = [];
  for (const t of parsed.teams) {
    if (!Array.isArray(t?.players) || t.players.length === 0 || t.players.length > 30) {
      return null;
    }

    const players = [];
    for (const p of t.players) {
      const number = String(p?.number ?? "").slice(0, 3);
      const name = String(p?.name ?? "").slice(0, 30);
      if (!number || !name || !POSITIONS.includes(p?.position)) return null;
      players.push({ number, name, position: p.position });
    }

    let order = null;
    if (Array.isArray(t.order)) {
      order = t.order.slice(0, 30).map((p) => ({
        number: String(p?.number ?? "").slice(0, 3),
        name: String(p?.name ?? "").slice(0, 30),
      }));
    }
    teams.push({ players, order });
  }
  return { teams };
}

// Publishes the teams as a players-only announcement
export async function postTeams(prevState, formData) {
  await requireAdmin();

  const title = String(formData.get("title") || "").trim();
  const body = String(formData.get("body") || "").trim();
  const data = cleanTeams(String(formData.get("data") || ""));

  if (!title || title.length > 120) {
    return { error: "Write a short title (max 120 characters)." };
  }
  if (!body || body.length > 3000 || !data) {
    return { error: "Nothing to post. Shuffle the teams first." };
  }

  db.prepare(
    `INSERT INTO announcements (title, body, visibility, kind, data)
     VALUES (?, ?, 'players', 'teams', ?)`
  ).run(title, body, JSON.stringify(data));

    void sendPush({
    build: (t) => ({ title: t("push.teams"), body: title, url: "/portal", tag: "teams" }),
  }).catch(() => {});

  revalidatePath("/portal");
  revalidatePath("/admin/news");
  return { ok: "Posted to the players' portal ✓" };
}