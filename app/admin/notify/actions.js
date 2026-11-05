"use server";

import db from "@/lib/db";
import { requireAdmin } from "@/lib/auth";
import { sendPush } from "@/lib/push";

export async function sendManualPush(prevState, formData) {
  await requireAdmin();

  const title = String(formData.get("title") || "").trim();
  const body = String(formData.get("body") || "").trim();
  const audience = formData.get("audience") === "selected" ? "selected" : "all";

  if (!title || title.length > 60) return { error: "Write a short title (max 60 characters)." };
  if (body.length > 200) return { error: "The message is too long (max 200 characters)." };

  const allIds = db.prepare("SELECT id FROM players").all().map((p) => p.id);
  const ids =
    audience === "all"
      ? null
      : [...new Set(formData.getAll("to").map(Number))].filter((id) => allIds.includes(id));
  if (ids && ids.length === 0) return { error: "Choose at least one player." };

  const { sent, failed } = await sendPush({
    playerIds: ids,
    build: () => ({ title, body, url: "/portal", tag: "manual" }),
  });

  if (sent === 0 && failed === 0) {
    return { error: "No phones to alert yet. Players need to turn notifications on first." };
  }
  return { ok: `Sent to ${sent} device${sent === 1 ? "" : "s"}${failed ? ` (${failed} failed)` : ""} ✓` };
}