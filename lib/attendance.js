import db from "@/lib/db";

const EVENT_TYPES = ["training", "match", "meeting"];

export function rateColor(rate) {
  if (rate >= 80) return "text-green-400";
  if (rate >= 50) return "text-yellow-400";
  return "text-red-400";
}

// Ranking of all players, only counting events that have been checked in.
export function getRanking(type = "all") {
  const t = EVENT_TYPES.includes(type) ? type : "all";

  const rows = db
    .prepare(
      `SELECT p.id, p.number, p.name,
              COUNT(c.event_id) AS events,
              SUM(c.attended) AS attended,
              SUM(CASE WHEN a.status IS NOT NULL THEN 1 ELSE 0 END) AS responded,
              SUM(CASE WHEN a.status = 'yes' AND c.attended = 0 THEN 1 ELSE 0 END) AS no_shows,
              SUM(CASE WHEN a.status = 'no' THEN 1 ELSE 0 END) AS declined
       FROM players p
       JOIN checkins c ON c.player_id = p.id
       JOIN events e ON e.id = c.event_id
       LEFT JOIN users u ON u.player_id = p.id
       LEFT JOIN attendance a ON a.event_id = c.event_id AND a.user_id = u.id
       WHERE (? = 'all' OR e.type = ?)
       GROUP BY p.id`
    )
    .all(t, t);

  return rows
    .map((r) => ({
      ...r,
      rate: r.events ? Math.round((100 * r.attended) / r.events) : 0,
      responseRate: r.events ? Math.round((100 * r.responded) / r.events) : 0,
    }))
    .sort(
      (a, b) => b.rate - a.rate || b.attended - a.attended || a.name.localeCompare(b.name)
    );
}

// One player's own summary + recent history (for the players' portal)
export function getMyAttendance(userId) {
  const user = db.prepare("SELECT player_id FROM users WHERE id = ?").get(userId);
  if (!user?.player_id) return { summary: null, history: [] };

  const summary = getRanking("all").find((r) => r.id === user.player_id) ?? null;

  const history = db
    .prepare(
      `SELECT e.title, e.type, e.starts_at, c.attended, a.status
       FROM checkins c
       JOIN events e ON e.id = c.event_id
       LEFT JOIN attendance a ON a.event_id = e.id AND a.user_id = ?
       WHERE c.player_id = ?
       ORDER BY e.starts_at DESC
       LIMIT 8`
    )
    .all(userId, user.player_id);

  return { summary, history };
}