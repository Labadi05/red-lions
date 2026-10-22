"use server";

import bcrypt from "bcryptjs";
import { revalidatePath } from "next/cache";
import db from "@/lib/db";
import { requireAdmin } from "@/lib/auth";

export async function saveAccount(prevState, formData) {
  await requireAdmin();

  const playerId = Number(formData.get("playerId"));
  const username = String(formData.get("username") || "").trim().toLowerCase();
  const password = String(formData.get("password") || "");

  if (!/^[a-z0-9_]{3,20}$/.test(username)) {
    return { error: "Username: 3-20 letters, numbers or _ only." };
  }
  if (password.length < 6) {
    return { error: "Password must be at least 6 characters." };
  }

  const player = db.prepare("SELECT id FROM players WHERE id = ?").get(playerId);
  if (!player) return { error: "Player not found." };

  const existing = db.prepare("SELECT id FROM users WHERE player_id = ?").get(playerId);
  const taken = db.prepare("SELECT id FROM users WHERE username = ?").get(username);
  if (taken && taken.id !== existing?.id) {
    return { error: "That username is already used." };
  }

  const hash = bcrypt.hashSync(password, 10);
  if (existing) {
    db.prepare("UPDATE users SET username = ?, password_hash = ? WHERE id = ?").run(
      username,
      hash,
      existing.id
    );
  } else {
    db.prepare(
      "INSERT INTO users (username, password_hash, role, player_id) VALUES (?, ?, 'player', ?)"
    ).run(username, hash, playerId);
  }

  revalidatePath("/admin");
  return { ok: `Saved. Username: ${username}` };
}