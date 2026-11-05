import webpush from "web-push";
import db from "@/lib/db";
import { getDictionary } from "@/lib/i18n";
import { translate } from "@/lib/i18n/translate";

let configured = false;

function configure() {
  if (configured) return true;
  const { VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY, VAPID_SUBJECT } = process.env;
  if (!VAPID_PUBLIC_KEY || !VAPID_PRIVATE_KEY || !VAPID_SUBJECT) return false;
  webpush.setVapidDetails(VAPID_SUBJECT, VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY);
  configured = true;
  return true;
}

// Sends a phone alert.
//   playerIds: array of players to alert, or leave out for everyone
//   userIds:   array of user accounts (used for the test button)
//   build(t, lang) -> { title, body, url, tag }  (called once per language)
export async function sendPush({ playerIds = null, userIds = null, build }) {
  if (!configure()) return { sent: 0, failed: 0 };

  let rows;
  if (userIds) {
    if (userIds.length === 0) return { sent: 0, failed: 0 };
    const marks = userIds.map(() => "?").join(",");
    rows = db
      .prepare(`SELECT * FROM push_subscriptions WHERE user_id IN (${marks})`)
      .all(...userIds);
  } else if (playerIds) {
    if (playerIds.length === 0) return { sent: 0, failed: 0 };
    const marks = playerIds.map(() => "?").join(",");
    rows = db
      .prepare(
        `SELECT s.* FROM push_subscriptions s
         JOIN users u ON u.id = s.user_id
         WHERE u.player_id IN (${marks})`
      )
      .all(...playerIds);
  } else {
    rows = db.prepare("SELECT * FROM push_subscriptions").all();
  }
  if (rows.length === 0) return { sent: 0, failed: 0 };

  // One message per language
  const payloads = {};
  for (const lang of new Set(rows.map((r) => r.lang))) {
    const dict = getDictionary(lang);
    const t = (key, vars) => translate(dict, key, vars);
    payloads[lang] = JSON.stringify(build(t, lang));
  }

  let sent = 0;
  let failed = 0;

  await Promise.all(
    rows.map(async (r) => {
      try {
        await webpush.sendNotification(
          { endpoint: r.endpoint, keys: { p256dh: r.p256dh, auth: r.auth } },
          payloads[r.lang] ?? payloads.en,
          { TTL: 60 * 60 * 24, timeout: 10000 }
        );
        sent++;
      } catch (err) {
        failed++;
        // The phone removed the subscription: forget it
        if (err.statusCode === 404 || err.statusCode === 410) {
          db.prepare("DELETE FROM push_subscriptions WHERE id = ?").run(r.id);
        }
      }
    })
  );

  return { sent, failed };
}