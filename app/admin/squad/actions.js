"use server";

import { revalidatePath } from "next/cache";
import db from "@/lib/db";
import { requireAdmin } from "@/lib/auth";
import { POSITIONS } from "@/lib/positions";
import { canDeletePlayer } from "@/lib/squad";

function refresh() {
  revalidatePath("/squad");
  revalidatePath("/admin");
  revalidatePath("/admin/squad");
}

function readFields(formData) {
  const rawNumber = String(formData.get("number") || "").trim();
  const name = String(formData.get("name") || "").trim();
  const position = String(formData.get("position") || "");

  if (!/^\d{1,2}$/.test(rawNumber)) {
    return { error: "Shirt number must be 1 or 2 digits (0 to 99)." };
  }
  if (!name || name.length > 30) {
    return { error: "Name is required (max 30 characters)." };
  }
  if (!POSITIONS.includes(position)) return { error: "Choose a position." };

  // 7 -> "07", so the same number cannot be entered twice in different forms
  return { number: rawNumber.padStart(2, "0"), name, position };
}

export async function addPlayer(prevState, formData) {
  await requireAdmin();

  const fields = readFields(formData);
  if (fields.error) return { error: fields.error };

  const taken = db.prepare("SELECT name FROM players WHERE number = ?").get(fields.number);
  if (taken) return { error: `Number ${fields.number} is already used by ${taken.name}.` };

  db.prepare(
    "INSERT INTO players (number, name, position, is_captain) VALUES (?, ?, ?, 0)"
  ).run(fields.number, fields.name, fields.position);

  refresh();
  return { ok: `${fields.name} added ✓ Create their login in the dashboard.` };
}

export async function updatePlayer(prevState, formData) {
  await requireAdmin();

  const id = Number(formData.get("id"));
  const fields = readFields(formData);
  if (fields.error) return { error: fields.error };

  const taken = db.prepare("SELECT id, name FROM players WHERE number = ?").get(fields.number);
  if (taken && taken.id !== id) {
    return { error: `Number ${fields.number} is already used by ${taken.name}.` };
  }

  db.prepare("UPDATE players SET number = ?, name = ?, position = ? WHERE id = ?").run(
    fields.number,
    fields.name,
    fields.position,
    id
  );

  refresh();
  return { ok: "Saved ✓" };
}

export async function deletePlayer(prevState, formData) {
  await requireAdmin();

  const id = Number(formData.get("id"));
  const player = db.prepare("SELECT is_captain FROM players WHERE id = ?").get(id);
  if (!player) return { error: "Player not found." };
  if (player.is_captain) return { error: "The captain cannot be deleted." };
  if (!canDeletePlayer(id)) {
    return { error: "This player has history (account, attendance, stats or messages)." };
  }

  db.prepare("DELETE FROM players WHERE id = ?").run(id);
  refresh();
  return { ok: "Deleted." };
}