"use server";

import { revalidatePath } from "next/cache";
import db from "@/lib/db";
import { requireAdmin } from "@/lib/auth";
import { CATEGORIES, parseMoney, formatMoney } from "@/lib/moneyFormat";

function refresh() {
  revalidatePath("/admin/money");
  revalidatePath("/portal");
}

export async function createCharge(prevState, formData) {
  await requireAdmin();

  const category = String(formData.get("category") || "");
  const title = String(formData.get("title") || "").trim();
  const reason = String(formData.get("reason") || "").trim();
  const dueAt = String(formData.get("due_at") || "");
  const mode = formData.get("mode") === "split" ? "split" : "each";
  const audience = formData.get("audience") === "selected" ? "selected" : "all";
  const cents = parseMoney(formData.get("amount"));

  if (!CATEGORIES[category]) return { error: "Choose a category." };
  if (!title || title.length > 120) return { error: "Write a short title (max 120 characters)." };
  if (reason.length > 500) return { error: "The reason is too long (max 500 characters)." };
  if (Number.isNaN(cents)) {
    return { error: "Enter a valid amount, for example 40 or 12.50." };
  }
  if (dueAt && !/^\d{4}-\d{2}-\d{2}$/.test(dueAt)) {
    return { error: "Choose a valid due date, or leave it empty." };
  }

  const allIds = db
    .prepare("SELECT id FROM players ORDER BY CAST(number AS INTEGER)")
    .all()
    .map((p) => p.id);
  const ids =
    audience === "all"
      ? allIds
      : [...new Set(formData.getAll("to").map(Number))].filter((id) => allIds.includes(id));
  if (ids.length === 0) return { error: "Choose at least one player." };

  // Amount per player. A split gives the remaining cents to the first players.
  let amounts = ids.map(() => cents);
  if (mode === "split") {
    const base = Math.floor(cents / ids.length);
    if (base === 0) return { error: `That total is too small to split between ${ids.length} players.` };
    const rest = cents - base * ids.length;
    amounts = ids.map((_, i) => base + (i < rest ? 1 : 0));
  }

  const create = db.transaction(() => {
    const result = db
      .prepare("INSERT INTO charges (category, title, reason, due_at) VALUES (?, ?, ?, ?)")
      .run(category, title, reason, dueAt || null);
    const insert = db.prepare(
      "INSERT INTO charge_items (charge_id, player_id, amount_cents) VALUES (?, ?, ?)"
    );
    ids.forEach((id, i) => insert.run(result.lastInsertRowid, id, amounts[i]));
  });
  create();

  refresh();
  const total = amounts.reduce((a, b) => a + b, 0);
  return {
    ok: `Charge created for ${ids.length} player${ids.length === 1 ? "" : "s"} (total ${formatMoney(total)}) ✓`,
  };
}

export async function setPaid(formData) {
  await requireAdmin();
  const chargeId = Number(formData.get("chargeId"));
  const playerId = Number(formData.get("playerId"));
  const paid = formData.get("paid") === "1";

  db.prepare(
    `UPDATE charge_items
     SET paid_at = CASE WHEN ? = 1 THEN CURRENT_TIMESTAMP ELSE NULL END,
         claimed_at = CASE WHEN ? = 1 THEN claimed_at ELSE NULL END
     WHERE charge_id = ? AND player_id = ?`
  ).run(paid ? 1 : 0, paid ? 1 : 0, chargeId, playerId);
  refresh();
}

export async function markAllPaid(formData) {
  await requireAdmin();
  const chargeId = Number(formData.get("chargeId"));
  db.prepare(
    "UPDATE charge_items SET paid_at = CURRENT_TIMESTAMP WHERE charge_id = ? AND paid_at IS NULL"
  ).run(chargeId);
  refresh();
}

export async function deleteCharge(formData) {
  await requireAdmin();
  const chargeId = Number(formData.get("chargeId"));
  db.prepare("DELETE FROM charge_items WHERE charge_id = ?").run(chargeId);
  db.prepare("DELETE FROM charges WHERE id = ?").run(chargeId);
  refresh();
}

export async function savePaymentInfo(prevState, formData) {
  await requireAdmin();
  const text = String(formData.get("payment_info") || "").trim();
  if (text.length > 500) return { error: "That note is too long (max 500 characters)." };

  db.prepare(
    `INSERT INTO site_settings (key, value) VALUES ('payment_info', ?)
     ON CONFLICT(key) DO UPDATE SET value = excluded.value`
  ).run(text);

  refresh();
  return { ok: "Saved ✓" };
}