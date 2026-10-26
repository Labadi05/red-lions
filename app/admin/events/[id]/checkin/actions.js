"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import db from "@/lib/db";
import { requireAdmin } from "@/lib/auth";

function refresh(eventId) {
  revalidatePath("/admin");
  revalidatePath("/portal");
  revalidatePath(`/admin/events/${eventId}/checkin`);
}

export async function saveCheckins(prevState, formData) {
  await requireAdmin();

  const eventId = Number(formData.get("eventId"));
  const event = db.prepare("SELECT id FROM events WHERE id = ?").get(eventId);
  if (!event) return { error: "Event not found." };

  const players = db.prepare("SELECT id FROM players").all();

  const save = db.transaction(() => {
    db.prepare("DELETE FROM checkins WHERE event_id = ?").run(eventId);
    const insert = db.prepare(
      "INSERT INTO checkins (event_id, player_id, attended) VALUES (?, ?, ?)"
    );
    for (const p of players) {
      insert.run(eventId, p.id, formData.get(`attended_${p.id}`) === "on" ? 1 : 0);
    }
  });
  save();

  refresh(eventId);
  return { ok: "Saved ✓ This event now counts in the attendance ranking." };
}

export async function removeCheckins(formData) {
  await requireAdmin();
  const eventId = Number(formData.get("eventId"));
  db.prepare("DELETE FROM checkins WHERE event_id = ?").run(eventId);
  refresh(eventId);
  redirect("/admin/events");
}