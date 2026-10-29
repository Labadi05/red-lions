"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import db from "@/lib/db";
import { requireAdmin } from "@/lib/auth";
import { nowInJinzhou } from "@/lib/format";

function refresh() {
  revalidatePath("/admin/polls");
  revalidatePath("/portal");
}

export async function createPoll(prevState, formData) {
  await requireAdmin();

  const question = String(formData.get("question") || "").trim();
  const labels = String(formData.get("options") || "")
    .split("\n")
    .map((s) => s.trim())
    .filter(Boolean);
  const closesAt = String(formData.get("closes_at") || "");

  if (!question || question.length > 200) {
    return { error: "Write the question (max 200 characters)." };
  }
  if (labels.length < 2 || labels.length > 8) {
    return { error: "Write between 2 and 8 options, one per line." };
  }
  if (labels.some((l) => l.length > 80)) {
    return { error: "Each option must be 80 characters or less." };
  }
  if (new Set(labels.map((l) => l.toLowerCase())).size !== labels.length) {
    return { error: "Options must all be different." };
  }
  if (closesAt) {
    if (!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(closesAt)) {
      return { error: "Choose a valid deadline, or leave it empty." };
    }
    if (closesAt <= nowInJinzhou()) {
      return { error: "The deadline must be in the future." };
    }
  }

  const create = db.transaction(() => {
    const result = db
      .prepare("INSERT INTO polls (question, closes_at) VALUES (?, ?)")
      .run(question, closesAt || null);
    const insert = db.prepare(
      "INSERT INTO poll_options (poll_id, label, position) VALUES (?, ?, ?)"
    );
    labels.forEach((label, i) => insert.run(result.lastInsertRowid, label, i));
  });
  create();

  refresh();
  redirect("/admin/polls");
}

export async function setPollClosed(formData) {
  await requireAdmin();
  const id = Number(formData.get("id"));
  const close = formData.get("closed") === "1";

  if (close) {
    db.prepare("UPDATE polls SET closed = 1 WHERE id = ?").run(id);
  } else {
    // Reopen. If the old deadline already passed, remove it so the poll really reopens.
    db.prepare(
      `UPDATE polls SET closed = 0,
         closes_at = CASE WHEN closes_at < ? THEN NULL ELSE closes_at END
       WHERE id = ?`
    ).run(nowInJinzhou(), id);
  }
  refresh();
}

export async function deletePoll(formData) {
  await requireAdmin();
  const id = Number(formData.get("id"));
  db.prepare("DELETE FROM poll_votes WHERE poll_id = ?").run(id);
  db.prepare("DELETE FROM poll_options WHERE poll_id = ?").run(id);
  db.prepare("DELETE FROM polls WHERE id = ?").run(id);
  refresh();
}

export async function applyMotmWinner(formData) {
  await requireAdmin();

  const pollId = Number(formData.get("pollId"));
  const optionId = Number(formData.get("optionId"));

  const poll = db.prepare("SELECT * FROM polls WHERE id = ? AND kind = 'motm'").get(pollId);
  const option = db
    .prepare("SELECT player_id FROM poll_options WHERE id = ? AND poll_id = ?")
    .get(optionId, pollId);
  if (!poll || !poll.event_id || !option?.player_id) return;

  // Only once the vote has closed
  const closed = poll.closed === 1 || (poll.closes_at && poll.closes_at < nowInJinzhou());
  if (!closed) return;

  const apply = db.transaction(() => {
    db.prepare("UPDATE match_stats SET motm = 0 WHERE event_id = ?").run(poll.event_id);
    db.prepare("UPDATE match_stats SET motm = 1 WHERE event_id = ? AND player_id = ?").run(
      poll.event_id,
      option.player_id
    );
  });
  apply();

  revalidatePath("/stats");
  revalidatePath("/squad");
  revalidatePath("/admin/polls");
  revalidatePath("/admin/events");
}