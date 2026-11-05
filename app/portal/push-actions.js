"use server";

import db from "@/lib/db";
import { getSession } from "@/lib/session";
import { sendPush } from "@/lib/push";

// Only the real browser push services are accepted
function isPushService(endpoint) {
  try {
    const url = new URL(endpoint);
    const host = url.hostname;
    return (
      url.protocol === "https:" &&
      (host === "fcm.googleapis.com" ||
        host === "web.push.apple.com" ||
        host.endsWith(".push.apple.com") ||
        host.endsWith(".push.services.mozilla.com") ||
        host.endsWith(".notify.windows.com"))
    );
  } catch {
    return false;
  }
}

export async function savePushSubscription(sub, lang) {
  const session = await getSession();
  if (!session) return { error: "login" };

  const endpoint = String(sub?.endpoint || "");
  const p256dh = String(sub?.keys?.p256dh || "");
  const auth = String(sub?.keys?.auth || "");
  if (!isPushService(endpoint) || endpoint.length > 1000 || !p256dh || !auth) {
    return { error: "invalid" };
  }

  db.prepare(
    `INSERT INTO push_subscriptions (user_id, endpoint, p256dh, auth, lang)
     VALUES (?, ?, ?, ?, ?)
     ON CONFLICT(endpoint) DO UPDATE SET
       user_id = excluded.user_id,
       p256dh = excluded.p256dh,
       auth = excluded.auth,
       lang = excluded.lang`
  ).run(session.uid, endpoint, p256dh, auth, lang === "ar" ? "ar" : "en");

  return { ok: true };
}

export async function removePushSubscription(endpoint) {
  const session = await getSession();
  if (!session) return { error: "login" };

  db.prepare("DELETE FROM push_subscriptions WHERE endpoint = ? AND user_id = ?").run(
    String(endpoint || ""),
    session.uid
  );
  return { ok: true };
}

export async function sendTestPush() {
  const session = await getSession();
  if (!session) return { error: "login" };

  const result = await sendPush({
    userIds: [session.uid],
    build: (t) => ({
      title: t("push.test.title"),
      body: t("push.test.body"),
      url: "/portal",
      tag: "test",
    }),
  });
  return result;
}