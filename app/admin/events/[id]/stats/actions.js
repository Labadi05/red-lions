"use server";

import { revalidatePath } from "next/cache";
import db from "@/lib/db";
import { requireAdmin } from "@/lib/auth";

// Whole number 0-20 (empty counts as 0), or NaN if invalid
function toCount(value) {
  const s = String(value ?? "").trim();
  if (s === "") return 0;
  const n = Number(s);
  return Number.isInteger(n) && n >= 0 && n <= 20 ? n : NaN;
}

export async function saveMatchStats(prevState, formData) {
  await requireAdmin();

  const eventId = Number(formData.get("eventId"));
  const event = db
    .prepare("SELECT id, score_for FROM events WHERE id = ? AND type = 'match'")
    .get(eventId);
  if (!event) return { error: "Match not found." };

  const players = db.prepare("SELECT id FROM players").all();
  const motmId = Number(formData.get("motm")) || null;
  if (motmId && !players.some((p) => p.id === motmId)) {
    return { error: "Unknown player." };
  }

  const rows = [];
  let totalGoals = 0;

  for (const p of players) {
    const goals = toCount(formData.get(`goals_${p.id}`));
    const assists = toCount(formData.get(`assists_${p.id}`));
    if (Number.isNaN(goals) || Number.isNaN(assists)) {
      return { error: "Goals and assists must be whole numbers from 0 to 20." };
    }
    const motm = motmId === p.id ? 1 : 0;
    // Anyone with a goal, assist or award obviously played
    const played =
      formData.get(`played_${p.id}`) === "on" || goals > 0 || assists > 0 || motm === 1
        ? 1
        : 0;

    totalGoals += goals;
    if (played) rows.push([eventId, p.id, played, goals, assists, motm]);
  }

  if (event.score_for !== null && totalGoals > event.score_for) {
    return {
      error: `You entered ${totalGoals} goals, but the final score says ${event.score_for}. Check the numbers.`,
    };
  }

  const save = db.transaction(() => {
    db.prepare("DELETE FROM match_stats WHERE event_id = ?").run(eventId);
    const insert = db.prepare(
      `INSERT INTO match_stats (event_id, player_id, played, goals, assists, motm)
       VALUES (?, ?, ?, ?, ?, ?)`
    );
    for (const r of rows) insert.run(...r);
  });
  save();

  revalidatePath("/stats");
  revalidatePath(`/admin/events/${eventId}/stats`);

  return { ok: `Saved ✓ (${rows.length} players, ${totalGoals} goals)` };
}