import Link from "next/link";
import { redirect } from "next/navigation";
import db from "@/lib/db";
import { getSession } from "@/lib/session";
import { logout } from "../login/actions";

export const dynamic = "force-dynamic";

export default async function PortalPage() {
  const session = await getSession();
  if (!session) redirect("/login");

  const me = db
    .prepare(
      `SELECT u.username, u.role, p.name, p.number
       FROM users u LEFT JOIN players p ON p.id = u.player_id
       WHERE u.id = ?`
    )
    .get(session.uid);

  if (!me) redirect("/login");
    const announcements = db
    .prepare("SELECT * FROM announcements ORDER BY id DESC LIMIT 30")
    .all();

  return (
    <main className="min-h-screen bg-neutral-950 px-6 py-12 text-white">
      <div className="mx-auto max-w-4xl">
        <h1 className="text-4xl font-bold">
          Welcome, {me.name ?? me.username} 🦁
        </h1>
        <p className="mt-2 text-neutral-400">
          {me.number ? `#${me.number} · ` : ""}
          {me.role === "admin" ? "Captain (admin)" : "Player"}
        </p>

                <h2 className="mt-10 text-xl font-semibold text-red-500">Announcements</h2>
        <div className="mt-4 space-y-3">
          {announcements.length === 0 && (
            <p className="text-neutral-500">No announcements yet.</p>
          )}
          {announcements.map((a) => (
            <article
              key={a.id}
              className="rounded-xl border border-neutral-800 bg-neutral-900 p-5"
            >
              <div className="flex items-center gap-2 text-xs text-neutral-500">
                {a.created_at.slice(0, 10)}
                {a.visibility === "players" && (
                  <span className="rounded-full bg-yellow-900 px-2 py-0.5 text-yellow-300">
                    🔒 Players only
                  </span>
                )}
              </div>
              <h3 className="mt-1 text-lg font-semibold">{a.title}</h3>
              <p className="mt-2 whitespace-pre-wrap text-neutral-300">{a.body}</p>
            </article>
          ))}
        </div>
        {me.role === "admin" && (
          <Link
            href="/admin"
            className="mt-6 inline-block rounded-full bg-red-600 px-5 py-2 text-sm font-semibold hover:bg-red-500"
          >
            Captain&apos;s Dashboard →
          </Link>
        )}
        <form action={logout} className="mt-8">
          <button className="rounded-full border border-neutral-700 px-5 py-2 text-sm hover:border-red-600">
            Log out
          </button>
        </form>
      </div>
    </main>
  );
}