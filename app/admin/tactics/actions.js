"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import db from "@/lib/db";
import { requireAdmin } from "@/lib/auth";
import { sendPush } from "@/lib/push";
import { CATEGORIES, cleanBoard } from "@/lib/tacticsData";

function refresh() {
  revalidatePath("/admin/tactics");
  revalidatePath("/portal");
}

// Phone alert: only when a tactic becomes visible to players
function notify(id, title) {
  void sendPush({
    build: (t) => ({
      title: t("push.tactic"),
      body: title,
      url: `/portal/tactics/${id}`,
      tag: `tactic-${id}`,
    }),
  }).catch(() => {});
}

export async function saveTactic(prevState, formData) {
  await requireAdmin();

  const id = Number(formData.get("id")) || null;
  const title = String(formData.get("title") || "").trim();
  const category = String(formData.get("category") || "");
  const notes = String(formData.get("notes") || "").trim();
  const eventId = Number(formData.get("event_id")) || null;
  const published = formData.get("published") === "on" ? 1 : 0;
  const rawData = String(formData.get("data") || "");

  if (!title || title.length > 80) return { error: "Give it a title (max 80 characters)." };
  if (!CATEGORIES[category]) return { error: "Choose a category." };
  if (notes.length > 1000) return { error: "The notes are too long (max 1000 characters)." };
  if (rawData.length > 150000) return { error: "This board is too big. Remove some items." };

  const board = cleanBoard(rawData);
  if (!board) return { error: "The board could not be saved. Reload the page and try again." };
  if (board.items.length === 0) return { error: "Add some players to the board first." };

  if (eventId && !db.prepare("SELECT id FROM events WHERE id = ? AND type = 'match'").get(eventId)) {
    return { error: "Match not found." };
  }

  const json = JSON.stringify(board);

  if (id) {
    const before = db.prepare("SELECT published FROM tactics WHERE id = ?").get(id);

    db.prepare(
      `UPDATE tactics SET title = ?, category = ?, notes = ?, data = ?, event_id = ?,
         published = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?`
    ).run(title, category, notes, json, eventId, published, id);

    if (published && before && !before.published) notify(id, title);

    refresh();
    return {
      ok: published
        ? "Saved ✓ Players can see it."
        : "Saved ✓ (draft, players can't see it yet).",
    };
  }

  const result = db
    .prepare(
      `INSERT INTO tactics (title, category, notes, data, event_id, published)
       VALUES (?, ?, ?, ?, ?, ?)`
    )
    .run(title, category, notes, json, eventId, published);
  const newId = Number(result.lastInsertRowid);

  if (published) notify(newId, title);

  refresh();
  redirect(`/admin/tactics/${newId}`);
}

export async function setTacticPublished(formData) {
  await requireAdmin();
  const id = Number(formData.get("id"));
  const published = formData.get("published") === "1" ? 1 : 0;

  const before = db.prepare("SELECT published, title FROM tactics WHERE id = ?").get(id);
  if (!before) return;

  db.prepare("UPDATE tactics SET published = ? WHERE id = ?").run(published, id);
  if (published && !before.published) notify(id, before.title);

  refresh();
}

export async function deleteTactic(formData) {
  await requireAdmin();
  db.prepare("DELETE FROM tactics WHERE id = ?").run(Number(formData.get("id")));
  refresh();
}