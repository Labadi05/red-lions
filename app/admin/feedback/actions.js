"use server";

import { revalidatePath } from "next/cache";
import db from "@/lib/db";
import { requireAdmin } from "@/lib/auth";
import { FEEDBACK_STATUS } from "@/lib/messageKinds";

function refresh() {
  revalidatePath("/admin");
  revalidatePath("/admin/feedback");
  revalidatePath("/portal/inbox");
}

export async function reviewFeedback(formData) {
  await requireAdmin();

  const id = Number(formData.get("id"));
  const status = String(formData.get("status") || "");
  const reply = String(formData.get("reply") || "").trim().slice(0, 1000);
  if (!FEEDBACK_STATUS[status]) return;

  db.prepare(
    `UPDATE feedback
     SET status = ?, reply = ?,
         replied_at = CASE WHEN ? != '' THEN CURRENT_TIMESTAMP ELSE NULL END
     WHERE id = ?`
  ).run(status, reply, reply, id);
  refresh();
}

export async function deleteFeedback(formData) {
  await requireAdmin();
  const id = Number(formData.get("id"));
  db.prepare("DELETE FROM feedback WHERE id = ?").run(id);
  refresh();
}