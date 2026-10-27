import Link from "next/link";
import db from "@/lib/db";
import { getSession } from "@/lib/session";

export const dynamic = "force-dynamic";
export const metadata = { title: "Gallery — Red Lions" };

export default async function GalleryPage() {
  const session = await getSession();
  const where = session ? "" : "WHERE visibility = 'public'";
  const items = db
    .prepare(`SELECT * FROM media ${where} ORDER BY id DESC LIMIT 200`)
    .all();

  const photos = items.filter((m) => m.kind === "photo");
  const videos = items.filter((m) => m.kind === "video");

  return (
    <main className="min-h-screen bg-neutral-950 px-6 py-12 text-white">
      <div className="mx-auto max-w-5xl">
        <Link href="/" className="text-sm text-red-400 hover:underline">
          ← Home
        </Link>
        <h1 className="mt-4 text-4xl font-bold">Gallery 📸</h1>
        <p className="mt-2 text-neutral-400">Red Lions moments</p>

        <h2 className="mt-10 text-xl font-semibold text-red-500">Photos</h2>
        {photos.length === 0 ? (
          <p className="mt-4 text-neutral-500">No photos yet.</p>
        ) : (
          <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
            {photos.map((m) => (
              <a
                key={m.id}
                href={`/media/${m.filename}`}
                target="_blank"
                rel="noopener noreferrer"
                className="group relative block overflow-hidden rounded-xl border border-neutral-800"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={`/media/${m.filename.replace(".webp", "-t.webp")}`}
                  alt={m.caption || "Red Lions photo"}
                  loading="lazy"
                  className="aspect-square w-full object-cover transition group-hover:scale-105"
                />
                {m.visibility === "players" && (
                  <span className="absolute left-2 top-2 rounded-full bg-yellow-900 px-2 py-0.5 text-xs text-yellow-300">
                    🔒 Players only
                  </span>
                )}
                {m.caption && (
                  <span className="absolute inset-x-0 bottom-0 truncate bg-black/60 px-2 py-1 text-xs">
                    {m.caption}
                  </span>
                )}
              </a>
            ))}
          </div>
        )}

        <h2 className="mt-12 text-xl font-semibold text-red-500">Videos</h2>
        {videos.length === 0 ? (
          <p className="mt-4 text-neutral-500">No videos yet.</p>
        ) : (
          <div className="mt-4 space-y-3">
            {videos.map((m) => (
              <a
                key={m.id}
                href={m.url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-4 rounded-xl border border-neutral-800 bg-neutral-900 p-4 hover:border-red-600"
              >
                <span className="text-3xl">▶️</span>
                <div className="min-w-0 flex-1">
                  <div className="truncate font-semibold">{m.caption}</div>
                  <div className="text-xs text-neutral-500">{new URL(m.url).hostname}</div>
                </div>
                {m.visibility === "players" && (
                  <span className="rounded-full bg-yellow-900 px-2 py-0.5 text-xs text-yellow-300">
                    🔒 Players only
                  </span>
                )}
              </a>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}