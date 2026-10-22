"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import db from "@/lib/db";
import { getSession } from "@/lib/session";

export async function setAttendance(formData) {
  const session = await getSession();
  if (!session) redirect("/login");

  const eventId = Number(formData.get("eventId"));
  const status = String(formData.get("status"));
  if (!["yes", "maybe", "no"].includes(status)) return;

  const event = db.prepare("SELECT id FROM events WHERE id = ?").get(eventId);
  if (!event) return;

  const reason = String(formData.get("reason") || "").trim().slice(0, 200);

  db.prepare(
    `INSERT INTO attendance (event_id, user_id, status, reason)
     VALUES (?, ?, ?, ?)
     ON CONFLICT(event_id, user_id)
     DO UPDATE SET status = excluded.status, reason = excluded.reason,
                   updated_at = CURRENT_TIMESTAMP`
  ).run(eventId, session.uid, status, reason);

  revalidatePath("/portal");
  revalidatePath("/admin/events");
}