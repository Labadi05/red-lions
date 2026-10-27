import db from "@/lib/db";

function playerIdForUser(userId) {
  return db.prepare("SELECT player_id FROM users WHERE id = ?").get(userId)?.player_id ?? null;
}

// Number of unread messages (for the badge in the portal)
export function getUnreadCount(userId) {
  const playerId = playerIdForUser(userId);
  if (!playerId) return 0;
  return db
    .prepare(
      "SELECT COUNT(*) AS n FROM message_recipients WHERE player_id = ? AND read_at IS NULL"
    )
    .get(playerId).n;
}

// This player's messages, newest first
export function getInbox(userId) {
  const playerId = playerIdForUser(userId);
  if (!playerId) return [];
  return db
    .prepare(
      `SELECT m.id AS message_id, m.kind, m.subject, m.body, m.due_at, m.created_at,
              r.read_at, r.done_at
       FROM message_recipients r
       JOIN messages m ON m.id = r.message_id
       WHERE r.player_id = ?
       ORDER BY m.id DESC`
    )
    .all(playerId);
}

// What this player has sent to the captain
export function getMyFeedback(userId) {
  return db
    .prepare("SELECT * FROM feedback WHERE user_id = ? ORDER BY id DESC LIMIT 50")
    .all(userId);
}