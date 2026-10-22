import Link from "next/link";
import db from "@/lib/db";

export const dynamic = "force-dynamic";
export const metadata = { title: "News — Red Lions" };

export default function NewsPage() {
  const items = db
    .prepare("SELECT * FROM announcements WHERE visibility = 'public' ORDER BY id DESC")
    .all();

  return (
    <main className="min-h-screen bg-neutral-950 px-6 py-12 text-white">
      <div className="mx-auto max-w-3xl">
        <Link href="/" className="text-sm text-red-400 hover:underline">
          ← Home
        </Link>
        <h1 className="mt-4 text-4xl font-bold">News 📰</h1>
        <p className="mt-2 text-neutral-400">Official Red Lions announcements</p>

        <div className="mt-8 space-y-4">
          {items.length === 0 && (
            <p className="text-neutral-500">No news yet. Check back soon!</p>
          )}
          {items.map((a) => (
            <article
              key={a.id}
              className="rounded-xl border border-neutral-800 bg-neutral-900 p-5"
            >
              <div className="text-xs text-neutral-500">{a.created_at.slice(0, 10)}</div>
              <h2 className="mt-1 text-xl font-semibold">{a.title}</h2>
              <p className="mt-2 whitespace-pre-wrap text-neutral-300">{a.body}</p>
            </article>
          ))}
        </div>
      </div>
    </main>
  );
}