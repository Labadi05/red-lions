"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import db from "@/lib/db";
import { getSession } from "@/lib/session";
import { nowInJinzhou } from "@/lib/format";

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

export async function vote(formData) {
  const session = await getSession();
  if (!session) redirect("/login");

  const pollId = Number(formData.get("pollId"));
  const optionId = Number(formData.get("optionId"));

  const poll = db.prepare("SELECT * FROM polls WHERE id = ?").get(pollId);
  if (!poll) return;
  // Voting is closed manually or by deadline
  if (poll.closed === 1 || (poll.closes_at && poll.closes_at < nowInJinzhou())) return;

  const option = db
    .prepare("SELECT id, player_id FROM poll_options WHERE id = ? AND poll_id = ?")
    .get(optionId, pollId);
  if (!option) return;

  // In a man-of-the-match vote, nobody can vote for themselves
  if (poll.kind === "motm" && option.player_id) {
    const me = db.prepare("SELECT player_id FROM users WHERE id = ?").get(session.uid);
    if (me?.player_id === option.player_id) return;
  }

  db.prepare(
    `INSERT INTO poll_votes (poll_id, user_id, option_id)
     VALUES (?, ?, ?)
     ON CONFLICT(poll_id, user_id) DO UPDATE SET option_id = excluded.option_id`
  ).run(pollId, session.uid, optionId);

  revalidatePath("/portal");
  revalidatePath("/admin/polls");
}

export async function claimPaid(formData) {
  const session = await getSession();
  if (!session) redirect("/login");

  const me = db.prepare("SELECT player_id FROM users WHERE id = ?").get(session.uid);
  if (!me?.player_id) return;

  const chargeId = Number(formData.get("chargeId"));
  const claim = formData.get("claim") === "1";

  // Only the player's own, still unpaid item can be flagged
  db.prepare(
    `UPDATE charge_items
     SET claimed_at = CASE WHEN ? = 1 THEN CURRENT_TIMESTAMP ELSE NULL END
     WHERE charge_id = ? AND player_id = ? AND paid_at IS NULL`
  ).run(claim ? 1 : 0, chargeId, me.player_id);

  revalidatePath("/portal");
  revalidatePath("/admin/money");
}