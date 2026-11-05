import Link from "next/link";
import db from "@/lib/db";
import { requireAdmin } from "@/lib/auth";
import NotifyForm from "./NotifyForm";

export const dynamic = "force-dynamic";

export default async function AdminNotifyPage() {
  await requireAdmin();

  const players = db
    .prepare(
      `SELECT p.id, p.number, p.name, COUNT(s.id) AS devices
       FROM players p
       LEFT JOIN users u ON u.player_id = p.id
       LEFT JOIN push_subscriptions s ON s.user_id = u.id
       GROUP BY p.id
       ORDER BY CAST(p.number AS INTEGER)`
    )
    .all();

  const on = players.filter((p) => p.devices > 0).length;
  const configured = Boolean(process.env.VAPID_PUBLIC_KEY && process.env.VAPID_PRIVATE_KEY);

  return (
    <main className="min-h-screen bg-neutral-950 px-6 py-12 text-white">
      <div className="mx-auto max-w-3xl">
        <Link href="/admin" className="text-sm text-red-400 hover:underline">
          ← Dashboard
        </Link>
        <h1 className="mt-4 text-4xl font-bold">Notify 🔔</h1>
        <p className="mt-2 text-neutral-400">
          Send a custom alert to your players&apos; phones. Alerts also go out automatically for
          new announcements, new events, schedule changes and messages or tasks.
        </p>

        {!configured && (
          <p className="mt-4 rounded-lg border border-yellow-800 bg-yellow-950 p-3 text-sm text-yellow-300">
            Notifications are not set up on this server yet (the VAPID keys are missing in
            .env.local).
          </p>
        )}

        <p className="mt-6 text-sm text-neutral-300">
          <span className="text-2xl font-black text-red-600">{on}</span> of {players.length}{" "}
          players have notifications on. They turn them on from their portal.
        </p>

        <div className="mt-6">
          <NotifyForm players={players} />
        </div>
      </div>
    </main>
  );
}