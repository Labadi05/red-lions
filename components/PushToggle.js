"use client";

import { useEffect, useState } from "react";
import { useT, useLang } from "@/components/I18nProvider";
import {
  savePushSubscription,
  removePushSubscription,
  sendTestPush,
} from "@/app/portal/push-actions";

function urlBase64ToUint8Array(base64) {
  const padding = "=".repeat((4 - (base64.length % 4)) % 4);
  const raw = atob((base64 + padding).replace(/-/g, "+").replace(/_/g, "/"));
  return Uint8Array.from([...raw].map((c) => c.charCodeAt(0)));
}

export default function PushToggle({ publicKey }) {
  const t = useT();
  const lang = useLang();
  // loading | unsupported | ios | denied | off | on
  const [status, setStatus] = useState("loading");
  const [message, setMessage] = useState(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    async function check() {
      const hasWorker = "serviceWorker" in navigator;
      const hasPush = "PushManager" in window && "Notification" in window;
      if (!hasWorker || !hasPush) {
        const isIos = /iPhone|iPad|iPod/.test(navigator.userAgent);
        setStatus(isIos ? "ios" : "unsupported");
        return;
      }
      if (Notification.permission === "denied") {
        setStatus("denied");
        return;
      }
      const reg = await navigator.serviceWorker.ready;
      const sub = await reg.pushManager.getSubscription();
      if (sub) {
        // Keep this phone linked to the current account and language
        savePushSubscription(sub.toJSON(), lang).catch(() => {});
      }
      setStatus(sub ? "on" : "off");
    }
    check().catch(() => setStatus("unsupported"));
  }, [lang]);

  async function enable() {
    setBusy(true);
    setMessage(null);
    try {
      const permission = await Notification.requestPermission();
      if (permission !== "granted") {
        setStatus(permission === "denied" ? "denied" : "off");
        return;
      }
      const reg = await navigator.serviceWorker.ready;
      const sub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(publicKey),
      });
      const result = await savePushSubscription(sub.toJSON(), lang);
      if (result?.error) throw new Error(result.error);
      setStatus("on");
    } catch {
      setMessage(t("push.error"));
    } finally {
      setBusy(false);
    }
  }

  async function disable() {
    setBusy(true);
    setMessage(null);
    try {
      const reg = await navigator.serviceWorker.ready;
      const sub = await reg.pushManager.getSubscription();
      if (sub) {
        await removePushSubscription(sub.endpoint);
        await sub.unsubscribe();
      }
      setStatus("off");
    } catch {
      setMessage(t("push.error"));
    } finally {
      setBusy(false);
    }
  }

  async function test() {
    setBusy(true);
    setMessage(null);
    try {
      await sendTestPush();
      setMessage(t("push.testSent"));
    } catch {
      setMessage(t("push.error"));
    } finally {
      setBusy(false);
    }
  }

  // No keys set up on the server yet
  if (!publicKey) return null;

  const btn =
    "rounded-lg border border-neutral-700 px-4 py-1.5 text-sm hover:border-red-600 disabled:opacity-50";

  return (
    <div className="rounded-xl border border-neutral-800 bg-neutral-900 p-4">
      <div className="flex flex-wrap items-center gap-3">
        <span className="font-semibold">🔔 {t("push.settings")}</span>

        {status === "off" && (
          <button onClick={enable} disabled={busy} className={`${btn} border-red-600 bg-red-600 font-semibold`}>
            {t("push.enable")}
          </button>
        )}
        {status === "on" && (
          <>
            <span className="text-sm text-green-400">{t("push.on")}</span>
            <button onClick={test} disabled={busy} className={btn}>
              {t("push.test")}
            </button>
            <button onClick={disable} disabled={busy} className={btn}>
              {t("push.disable")}
            </button>
          </>
        )}
      </div>

      {status === "denied" && <p className="mt-2 text-sm text-yellow-400">{t("push.denied")}</p>}
      {status === "ios" && <p className="mt-2 text-sm text-neutral-400">{t("push.iosHint")}</p>}
      {status === "unsupported" && (
        <p className="mt-2 text-sm text-neutral-400">{t("push.unsupported")}</p>
      )}
      {message && <p className="mt-2 text-sm text-neutral-300">{message}</p>}
    </div>
  );
}