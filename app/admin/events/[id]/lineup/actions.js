"use server";

import { revalidatePath } from "next/cache";
import db from "@/lib/db";
import { requireAdmin } from "@/lib/auth";
import { FORMATIONS, slotCount } from "@/lib/formations";
import { sendPush } from "@/lib/push";

export async function saveLineup(prevState, formData) {
  await requireAdmin();

  const eventId = Number(formData.get("eventId"));
  const formation = String(formData.get("formation") || "");
  const published = formData.get("published") === "on";

  const event = db
    .prepare(
      "SELECT id, type, title, formation, lineup, bench, lineup_published FROM events WHERE id = ?"
    )
    .get(eventId);
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

  const lineupJson = JSON.stringify(slots);
  const benchJson = JSON.stringify(bench);

  db.prepare(
    "UPDATE events SET formation = ?, lineup = ?, bench = ?, lineup_published = ? WHERE id = ?"
  ).run(formation, lineupJson, benchJson, published ? 1 : 0, eventId);

  // Alert the players when the lineup is published, or changed after being published
  if (published) {
    const wasPublished = event.lineup_published === 1;
    const changed =
      event.formation !== formation || event.lineup !== lineupJson || event.bench !== benchJson;

    if (!wasPublished || changed) {
      void sendPush({
        build: (t) => ({
          title: wasPublished ? t("push.lineupUpdated") : t("push.lineup"),
          body: event.title,
          url: "/portal",
          tag: `lineup-${eventId}`,
        }),
      }).catch(() => {});
    }
  }

  revalidatePath("/portal");
  revalidatePath(`/admin/events/${eventId}/lineup`);

  return {
    ok: published
      ? "Saved and published to players ✅ They were notified."
      : "Saved as a draft. Players can't see it yet.",
  };
}