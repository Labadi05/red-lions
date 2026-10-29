"use server";

import { revalidatePath } from "next/cache";
import db from "@/lib/db";
import { requireAdmin } from "@/lib/auth";

export async function openMotmVote(prevState, formData) {
  await requireAdmin();

  const eventId = Number(formData.get("eventId"));
  const event = db
    .prepare("SELECT id, title FROM events WHERE id = ? AND type = 'match'")
    .get(eventId);
  if (!event) return { error: "Match not found." };

  const existing = db
    .prepare("SELECT id FROM polls WHERE event_id = ? AND kind = 'motm'")
    .get(eventId);
  if (existing) return { error: "A vote already exists for this match." };

  const candidates = db
    .prepare(
      `SELECT p.id, p.number, p.name
       FROM match_stats s JOIN players p ON p.id = s.player_id
       WHERE s.event_id = ? AND s.played = 1
       ORDER BY CAST(p.number AS INTEGER)`
    )
    .all(eventId);
  if (candidates.length < 2) {
    return { error: "First enter who played (📊 Stats). At least 2 players are needed." };
  }

  // Closes in 48 hours, in Jinzhou time (UTC+8)
  const closesAt = new Date(Date.now() + (8 + 48) * 3600 * 1000)
    .toISOString()
    .slice(0, 16);

  const create = db.transaction(() => {
    const result = db
      .prepare(
        "INSERT INTO polls (question, closes_at, kind, event_id) VALUES (?, ?, 'motm', ?)"
      )
      .run(`⭐ Man of the match: ${event.title}`, closesAt, eventId);

    const insert = db.prepare(
      "INSERT INTO poll_options (poll_id, label, position, player_id) VALUES (?, ?, ?, ?)"
    );
    candidates.forEach((p, i) =>
      insert.run(result.lastInsertRowid, `${p.number} ${p.name}`, i, p.id)
    );
  });
  create();

  revalidatePath("/admin/events");
  revalidatePath("/admin/polls");
  revalidatePath("/portal");
  return { ok: "Vote opened for 48 hours ✓" };
}