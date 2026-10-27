import db from "@/lib/db";

export const SETTING_KEYS = [
  "instagram_url",
  "facebook_url",
  "tiktok_url",
  "youtube_url",
  "wechat_id",
  "whatsapp",
  "email",
  "contact_note",
  "about_text",
];

// Returns every setting, with an empty string for the ones not filled in yet
export function getSettings() {
  const settings = Object.fromEntries(SETTING_KEYS.map((k) => [k, ""]));
  const rows = db.prepare("SELECT key, value FROM site_settings").all();
  for (const row of rows) {
    if (row.key in settings) settings[row.key] = row.value;
  }
  return settings;
}