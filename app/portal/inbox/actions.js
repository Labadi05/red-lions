"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import db from "@/lib/db";
import { getSession } from "@/lib/session";
import { ACTION_KINDS, FEEDBACK_KINDS } from "@/lib/messageKinds";

async function requireUser() {
  const session = await getSession();
  if (!session) redirect("/login");
  return session;
}

function playerIdFor(userId) {
  return db.prepare("SELECT player_id FROM users WHERE id = ?").get(userId)?.player_id ?? null;
}

// Called when the inbox opens: marks everything as seen
export async function markAllRead() {
  const session = await requireUser();
  const playerId = playerIdFor(session.uid);
  if (!playerId) return;

  db.prepare(
    `UPDATE message_recipients SET read_at = CURRENT_TIMESTAMP
     WHERE player_id = ? AND read_at IS NULL`
  ).run(playerId);

  // Only the badge on the portal needs refreshing right away
  revalidatePath("/portal");
  revalidatePath("/admin/messages");
}

export async function setDone(formData) {
  const session = await requireUser();
  const playerId = playerIdFor(session.uid);
  if (!playerId) return;

  const messageId = Number(formData.get("messageId"));
  const done = formData.get("done") === "1";

  const message = db.prepare("SELECT kind FROM messages WHERE id = ?").get(messageId);
  if (!message || !ACTION_KINDS.includes(message.kind)) return;

  db.prepare(
    `UPDATE message_recipients
     SET done_at = CASE WHEN ? = 1 THEN CURRENT_TIMESTAMP ELSE NULL END
     WHERE message_id = ? AND player_id = ?`
  ).run(done ? 1 : 0, messageId, playerId);

  revalidatePath("/portal/inbox");
  revalidatePath("/admin/messages");
}

export async function sendFeedback(prevState, formData) {
  const session = await requireUser();

  const kind = String(formData.get("kind") || "");
  const subject = String(formData.get("subject") || "").trim();
  const body = String(formData.get("body") || "").trim();

  if (!FEEDBACK_KINDS[kind]) return { error: "Choose a type." };
  if (!subject || subject.length > 120) {
    return { error: "Write a short title (max 120 characters)." };
  }
  if (!body || body.length > 2000) {
    return { error: "Write your message (max 2000 characters)." };
  }

  // Simple spam protection: 10 per day per player
  const recent = db
    .prepare(
      `SELECT COUNT(*) AS n FROM feedback
       WHERE user_id = ? AND created_at > datetime('now', '-1 day')`
    )
    .get(session.uid).n;
  if (recent >= 10) {
    return { error: "You have sent a lot today. Please try again tomorrow." };
  }

  db.prepare("INSERT INTO feedback (user_id, kind, subject, body) VALUES (?, ?, ?, ?)").run(
    session.uid,
    kind,
    subject,
    body
  );

  revalidatePath("/admin");
  revalidatePath("/admin/feedback");
  revalidatePath("/portal/inbox");
  return { ok: "Sent to the captain ✓" };
}