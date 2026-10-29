import db from "@/lib/db";

function playerIdForUser(userId) {
  return db.prepare("SELECT player_id FROM users WHERE id = ?").get(userId)?.player_id ?? null;
}

// How much each player owes / has paid
export function getBalances() {
  return db
    .prepare(
      `SELECT p.id, p.number, p.name,
              COALESCE(SUM(CASE WHEN i.paid_at IS NULL THEN i.amount_cents END), 0) AS owed,
              COALESCE(SUM(CASE WHEN i.paid_at IS NOT NULL THEN i.amount_cents END), 0) AS paid
       FROM players p LEFT JOIN charge_items i ON i.player_id = p.id
       GROUP BY p.id
       ORDER BY owed DESC, CAST(p.number AS INTEGER)`
    )
    .all();
}

// Every charge with its per-player rows (captain's view)
export function getCharges() {
  const charges = db.prepare("SELECT * FROM charges ORDER BY id DESC LIMIT 100").all();
  const items = db
    .prepare(
      `SELECT i.*, p.number, p.name
       FROM charge_items i JOIN players p ON p.id = i.player_id
       ORDER BY CAST(p.number AS INTEGER)`
    )
    .all();

  return charges.map((c) => {
    const its = items.filter((i) => i.charge_id === c.id);
    return {
      ...c,
      items: its,
      total: its.reduce((s, i) => s + i.amount_cents, 0),
      collected: its.filter((i) => i.paid_at).reduce((s, i) => s + i.amount_cents, 0),
      claims: its.filter((i) => !i.paid_at && i.claimed_at).length,
    };
  });
}

// One player's own payments (portal view)
export function getMyPayments(userId) {
  const playerId = playerIdForUser(userId);
  if (!playerId) return { open: [], paid: [], outstanding: 0 };

  const rows = db
    .prepare(
      `SELECT c.id, c.category, c.title, c.reason, c.due_at,
              i.amount_cents, i.paid_at, i.claimed_at
       FROM charge_items i JOIN charges c ON c.id = i.charge_id
       WHERE i.player_id = ?
       ORDER BY c.id DESC`
    )
    .all(playerId);

  const open = rows.filter((r) => !r.paid_at);
  return {
    open,
    paid: rows.filter((r) => r.paid_at).slice(0, 10),
    outstanding: open.reduce((s, r) => s + r.amount_cents, 0),
  };
}

// The "how to pay" note written by the captain
export function getPaymentInfo() {
  return (
    db.prepare("SELECT value FROM site_settings WHERE key = 'payment_info'").get()?.value ?? ""
  );
}