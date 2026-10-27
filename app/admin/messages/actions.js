"use server";

import { revalidatePath } from "next/cache";
import db from "@/lib/db";
import { requireAdmin } from "@/lib/auth";
import { KINDS } from "@/lib/messageKinds";

function refresh() {
  revalidatePath("/admin/messages");
  revalidatePath("/portal");
  revalidatePath("/portal/inbox");
}

export async function sendMessage(prevState, formData) {
  await requireAdmin();

  const kind = String(formData.get("kind") || "");
  const subject = String(formData.get("subject") || "").trim();
  const body = String(formData.get("body") || "").trim();
  const dueAt = String(formData.get("due_at") || "");
  const audience = formData.get("audience") === "all" ? "all" : "selected";

  if (!KINDS[kind]) return { error: "Choose a type." };
  if (!subject || subject.length > 120) {
    return { error: "Write a short title (max 120 characters)." };
  }
  if (body.length > 2000) return { error: "The message is too long (max 2000 characters)." };
  if (dueAt && !/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(dueAt)) {
    return { error: "Choose a valid due date, or leave it empty." };
  }

  const players = db.prepare("SELECT id, is_captain FROM players").all();
  const allIds = players.map((p) => p.id);

  let ids;
  if (audience === "all") {
    // Everyone except the captain himself
    ids = players.filter((p) => !p.is_captain).map((p) => p.id);
  } else {
    ids = [...new Set(formData.getAll("to").map(Number))].filter((id) => allIds.includes(id));
  }
  if (ids.length === 0) return { error: "Choose at least one player." };

  const create = db.transaction(() => {
    const result = db
      .prepare("INSERT INTO messages (kind, subject, body, due_at) VALUES (?, ?, ?, ?)")
      .run(kind, subject, body, dueAt || null);
    const insert = db.prepare(
      "INSERT INTO message_recipients (message_id, player_id) VALUES (?, ?)"
    );
    for (const id of ids) insert.run(result.lastInsertRowid, id);
  });
  create();

  refresh();
  return { ok: `Sent to ${ids.length} player${ids.length === 1 ? "" : "s"} ✓` };
}

export async function deleteMessage(formData) {
  await requireAdmin();
  const id = Number(formData.get("id"));
  db.prepare("DELETE FROM message_recipients WHERE message_id = ?").run(id);
  db.prepare("DELETE FROM messages WHERE id = ?").run(id);
  refresh();
}