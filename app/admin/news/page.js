import Link from "next/link";
import db from "@/lib/db";
import { requireAdmin } from "@/lib/auth";
import NewsForm from "./NewsForm";
import CopyButton from "./CopyButton";
import { deleteAnnouncement } from "./actions";

export const dynamic = "force-dynamic";

export default async function AdminNewsPage() {
  await requireAdmin();

  const items = db.prepare("SELECT * FROM announcements ORDER BY id DESC").all();

  return (
    <main className="min-h-screen bg-neutral-950 px-6 py-12 text-white">
      <div className="mx-auto max-w-4xl">
        <Link href="/admin" className="text-sm text-red-400 hover:underline">
          ← Dashboard
        </Link>
        <h1 className="mt-4 text-4xl font-bold">Announcements 📣</h1>

        <h2 className="mt-8 text-xl font-semibold text-red-500">New announcement</h2>
        <div className="mt-4">
          <NewsForm />
        </div>

        <h2 className="mt-12 text-xl font-semibold text-red-500">Published</h2>
        <div className="mt-4 space-y-3">
          {items.length === 0 && (
            <p className="text-neutral-500">Nothing published yet.</p>
          )}
          {items.map((a) => (
            <div
              key={a.id}
              className="rounded-xl border border-neutral-800 bg-neutral-900 p-4"
            >
              <div className="flex items-center gap-3">
                <span className="font-semibold">{a.title}</span>
                <span
                  className={`rounded-full px-2 py-0.5 text-xs ${
                    a.visibility === "public"
                      ? "bg-green-900 text-green-300"
                      : "bg-yellow-900 text-yellow-300"
                  }`}
                >
                  {a.visibility === "public" ? "🌍 Public" : "🔒 Players only"}
                </span>
                <span className="ml-auto text-xs text-neutral-500">
                  {a.created_at.slice(0, 10)}
                </span>
              </div>
              <p className="mt-2 whitespace-pre-wrap text-sm text-neutral-300">
                {a.body}
              </p>
              <div className="mt-3 flex items-center gap-2">
                <Link
                  href={`/admin/news/${a.id}`}
                  className="rounded-lg border border-neutral-700 px-3 py-1 text-xs hover:border-red-600"
                >
                  Edit
                </Link>
                <CopyButton text={`🦁 RED LIONS\n\n${a.title}\n\n${a.body}`} />
                <form action={deleteAnnouncement} className="ml-auto">
                  <input type="hidden" name="id" value={a.id} />
                  <button className="rounded-lg border border-red-900 px-3 py-1 text-xs text-red-400 hover:bg-red-950">
                    Delete
                  </button>
                </form>
              </div>
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}