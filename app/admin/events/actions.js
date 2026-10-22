"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import db from "@/lib/db";
import { requireAdmin } from "@/lib/auth";
import { TYPES } from "@/lib/format";

export async function saveEvent(prevState, formData) {
  await requireAdmin();

  const id = Number(formData.get("id")) || null;
  const type = String(formData.get("type") || "");
  const title = String(formData.get("title") || "").trim();
  const startsAt = String(formData.get("starts_at") || "");
  const location = String(formData.get("location") || "").trim();
  const notes = String(formData.get("notes") || "").trim();

  if (!TYPES[type]) return { error: "Choose a type." };
  if (!title || title.length > 120) return { error: "Title is required (max 120 characters)." };
  if (!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(startsAt)) {
    return { error: "Choose a date and time." };
  }

  if (id) {
    db.prepare(
      "UPDATE events SET type = ?, title = ?, starts_at = ?, location = ?, notes = ? WHERE id = ?"
    ).run(type, title, startsAt, location, notes, id);
  } else {
    db.prepare(
      "INSERT INTO events (type, title, starts_at, location, notes) VALUES (?, ?, ?, ?, ?)"
    ).run(type, title, startsAt, location, notes);
  }

  revalidatePath("/portal");
  revalidatePath("/admin/events");
  redirect("/admin/events");
}

export async function deleteEvent(formData) {
  await requireAdmin();
  const id = Number(formData.get("id"));
  db.prepare("DELETE FROM attendance WHERE event_id = ?").run(id);
  db.prepare("DELETE FROM events WHERE id = ?").run(id);

  revalidatePath("/portal");
  revalidatePath("/admin/events");
}