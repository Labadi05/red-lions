import Link from "next/link";
import db from "@/lib/db";
import { requireAdmin } from "@/lib/auth";
import AccountForm from "./AccountForm";

export const dynamic = "force-dynamic";

export default async function AdminPage() {
  await requireAdmin();

  const players = db
    .prepare(
      `SELECT p.id, p.number, p.name, p.position, u.username
       FROM players p LEFT JOIN users u ON u.player_id = p.id
       ORDER BY CAST(p.number AS INTEGER)`
    )
    .all();

  return (
    <main className="min-h-screen bg-neutral-950 px-6 py-12 text-white">
      <div className="mx-auto max-w-4xl">
        <Link href="/portal" className="text-sm text-red-400 hover:underline">
          ← Portal
        </Link>
        <h1 className="mt-4 text-4xl font-bold">Captain&apos;s Dashboard 🦁</h1>
        <p className="mt-2 text-neutral-400">
                  <Link
          href="/admin/news"
          className="mt-6 inline-block rounded-full bg-red-600 px-5 py-2 text-sm font-semibold hover:bg-red-500"
        >
          📣 Manage announcements →
        </Link>
          Create or reset player logins. Send each player their username and
          password privately (for example on WeChat).
        </p>

        <h2 className="mt-10 text-xl font-semibold text-red-500">Player accounts</h2>
        <div className="mt-4 space-y-3">
          {players.map((p) => (
            <div
              key={p.id}
              className="rounded-xl border border-neutral-800 bg-neutral-900 p-4"
            >
              <div className="flex items-center gap-3">
                <span className="text-2xl font-black text-red-600">{p.number}</span>
                <span className="font-medium">{p.name}</span>
                <span className="text-sm text-neutral-500">{p.position}</span>
                <span
                  className={`ml-auto rounded-full px-2 py-0.5 text-xs ${
                    p.username
                      ? "bg-green-900 text-green-300"
                      : "bg-neutral-800 text-neutral-400"
                  }`}
                >
                  {p.username ? `Account: ${p.username}` : "No account"}
                </span>
              </div>
              <AccountForm
                playerId={p.id}
                hasAccount={Boolean(p.username)}
                defaultUsername={
                  p.username ??
                  `${p.name.toLowerCase().replace(/[^a-z0-9]/g, "")}${p.number}`
                }
              />
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}