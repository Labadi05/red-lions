"use server";

import { revalidatePath } from "next/cache";
import db from "@/lib/db";
import { requireAdmin } from "@/lib/auth";

const URL_FIELDS = ["instagram_url", "facebook_url", "tiktok_url", "youtube_url"];
const TEXT_LIMITS = {
  wechat_id: 60,
  whatsapp: 30,
  email: 100,
  contact_note: 300,
  about_text: 3000,
};

export async function saveSettings(prevState, formData) {
  await requireAdmin();

  const values = {};

  for (const key of URL_FIELDS) {
    const raw = String(formData.get(key) || "").trim();
    if (raw) {
      let url;
      try {
        url = new URL(raw);
      } catch {
        return { error: `"${raw}" is not a valid link. Start it with https://` };
      }
      if (url.protocol !== "https:" && url.protocol !== "http:") {
        return { error: "Links must start with https://" };
      }
      values[key] = url.toString();
    } else {
      values[key] = "";
    }
  }

  for (const [key, max] of Object.entries(TEXT_LIMITS)) {
    const raw = String(formData.get(key) || "").trim();
    if (raw.length > max) {
      return { error: `That text is too long (maximum ${max} characters).` };
    }
    values[key] = raw;
  }

  if (values.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(values.email)) {
    return { error: "That email address does not look right." };
  }
  if (values.whatsapp && values.whatsapp.replace(/\D/g, "").length < 7) {
    return { error: "WhatsApp number: use the full number with country code, e.g. +212..." };
  }

  const upsert = db.prepare(
    `INSERT INTO site_settings (key, value) VALUES (?, ?)
     ON CONFLICT(key) DO UPDATE SET value = excluded.value`
  );
  const save = db.transaction(() => {
    for (const [key, value] of Object.entries(values)) upsert.run(key, value);
  });
  save();

  revalidatePath("/contact");
  revalidatePath("/about");
  revalidatePath("/admin/settings");
  return { ok: "Saved ✓" };
}