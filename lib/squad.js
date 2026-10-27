import db from "@/lib/db";

// How much history a player has. If any of these is above 0, deleting is not allowed.
export function playerUsage(playerId) {
  return db
    .prepare(
      `SELECT
         (SELECT COUNT(*) FROM users WHERE player_id = @id) AS accounts,
         (SELECT COUNT(*) FROM checkins WHERE player_id = @id) AS checkins,
         (SELECT COUNT(*) FROM match_stats WHERE player_id = @id) AS stats,
         (SELECT COUNT(*) FROM message_recipients WHERE player_id = @id) AS messages`
    )
    .get({ id: playerId });
}

export function canDeletePlayer(playerId) {
  const u = playerUsage(playerId);
  return u.accounts + u.checkins + u.stats + u.messages === 0;
}