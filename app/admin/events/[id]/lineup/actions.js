"use server";

import { revalidatePath } from "next/cache";
import db from "@/lib/db";
import { requireAdmin } from "@/lib/auth";
import { FORMATIONS, slotCount } from "@/lib/formations";

export async function saveLineup(prevState, formData) {
  await requireAdmin();

  const eventId = Number(formData.get("eventId"));
  const formation = String(formData.get("formation") || "");
  const published = formData.get("published") === "on";

  const event = db.prepare("SELECT id, type FROM events WHERE id = ?").get(eventId);
  if (!event || event.type !== "match") return { error: "Match not found." };
  if (!FORMATIONS[formation]) return { error: "Choose a formation." };

  const validIds = new Set(db.prepare("SELECT id FROM players").all().map((p) => p.id));
  const n = slotCount(formation);

  const slots = [];
  for (let i = 0; i < n; i++) {
    const id = Number(formData.get(`slot_${i}`)) || null;
    if (id && !validIds.has(id)) return { error: "Unknown player." };
    slots.push(id);
  }
  const bench = formData.getAll("bench").map(Number).filter((id) => validIds.has(id));

  const starters = slots.filter(Boolean);
  const everyone = [...starters, ...bench];
  if (new Set(everyone).size !== everyone.length) {
    return { error: "A player is used twice (starting lineup and bench together). Fix the duplicates." };
  }
  if (published && starters.length !== n) {
    return { error: `Fill all ${n} positions before publishing.` };
  }

  db.prepare(
    "UPDATE events SET formation = ?, lineup = ?, bench = ?, lineup_published = ? WHERE id = ?"
  ).run(formation, JSON.stringify(slots), JSON.stringify(bench), published ? 1 : 0, eventId);

  revalidatePath("/portal");
  revalidatePath(`/admin/events/${eventId}/lineup`);

  return {
    ok: published
      ? "Saved and published to players ✅"
      : "Saved as a draft. Players can't see it yet.",
  };
}