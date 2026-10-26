"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import db from "@/lib/db";
import { requireAdmin } from "@/lib/auth";
import { TYPES } from "@/lib/format";

// Empty -> null (no score yet). Otherwise a whole number 0-99, or NaN if invalid.
function parseScore(value) {
  const s = String(value ?? "").trim();
  if (s === "") return null;
  const n = Number(s);
  return Number.isInteger(n) && n >= 0 && n <= 99 ? n : NaN;
}

export async function saveEvent(prevState, formData) {
  await requireAdmin();

  const id = Number(formData.get("id")) || null;
  const type = String(formData.get("type") || "");
  const title = String(formData.get("title") || "").trim();
  const startsAt = String(formData.get("starts_at") || "");
  const location = String(formData.get("location") || "").trim();
  const notes = String(formData.get("notes") || "").trim();
  const opponent = String(formData.get("opponent") || "").trim().slice(0, 80);
  let scoreFor = parseScore(formData.get("score_for"));
  let scoreAgainst = parseScore(formData.get("score_against"));

  if (!TYPES[type]) return { error: "Choose a type." };
  if (!title || title.length > 120) return { error: "Title is required (max 120 characters)." };
  if (!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(startsAt)) {
    return { error: "Choose a date and time." };
  }
  if (Number.isNaN(scoreFor) || Number.isNaN(scoreAgainst)) {
    return { error: "Scores must be whole numbers from 0 to 99." };
  }
  if ((scoreFor === null) !== (scoreAgainst === null)) {
    return { error: "Fill in both scores, or leave both empty." };
  }
  // Only matches have an opponent and a score
  if (type !== "match") {
    scoreFor = null;
    scoreAgainst = null;
  }

  const opp = type === "match" ? opponent : "";

  if (id) {
    db.prepare(
      `UPDATE events SET type = ?, title = ?, starts_at = ?, location = ?, notes = ?,
         opponent = ?, score_for = ?, score_against = ? WHERE id = ?`
    ).run(type, title, startsAt, location, notes, opp, scoreFor, scoreAgainst, id);
  } else {
    db.prepare(
      `INSERT INTO events (type, title, starts_at, location, notes, opponent, score_for, score_against)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
    ).run(type, title, startsAt, location, notes, opp, scoreFor, scoreAgainst);
  }

  revalidatePath("/portal");
  revalidatePath("/fixtures");
  revalidatePath("/admin/events");
  redirect("/admin/events");
}

export async function deleteEvent(formData) {
  await requireAdmin();
  const id = Number(formData.get("id"));
  db.prepare("DELETE FROM attendance WHERE event_id = ?").run(id);
  db.prepare("DELETE FROM match_stats WHERE event_id = ?").run(id);
  db.prepare("DELETE FROM events WHERE id = ?").run(id);
  db.prepare("DELETE FROM checkins WHERE event_id = ?").run(id);

  revalidatePath("/portal");
  revalidatePath("/fixtures");
  revalidatePath("/admin/events");
}