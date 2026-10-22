"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import db from "@/lib/db";
import { requireAdmin } from "@/lib/auth";

export async function saveAnnouncement(prevState, formData) {
  await requireAdmin();

  const id = Number(formData.get("id")) || null;
  const title = String(formData.get("title") || "").trim();
  const body = String(formData.get("body") || "").trim();
  const visibility = formData.get("visibility") === "public" ? "public" : "players";

  if (!title || title.length > 120) {
    return { error: "Title is required (max 120 characters)." };
  }
  if (!body) return { error: "Write the announcement text." };

  if (id) {
    db.prepare(
      "UPDATE announcements SET title = ?, body = ?, visibility = ? WHERE id = ?"
    ).run(title, body, visibility, id);
  } else {
    db.prepare(
      "INSERT INTO announcements (title, body, visibility) VALUES (?, ?, ?)"
    ).run(title, body, visibility);
  }

  revalidatePath("/news");
  revalidatePath("/portal");
  revalidatePath("/admin/news");
  redirect("/admin/news");
}

export async function deleteAnnouncement(formData) {
  await requireAdmin();
  const id = Number(formData.get("id"));
  db.prepare("DELETE FROM announcements WHERE id = ?").run(id);

  revalidatePath("/news");
  revalidatePath("/portal");
  revalidatePath("/admin/news");
}