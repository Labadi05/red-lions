import Link from "next/link";
import db from "@/lib/db";
import { getSession } from "@/lib/session";

export const dynamic = "force-dynamic";
export const metadata = { title: "Gallery — Red Lions" };

function PlayersBadge() {
  return (
    <span className="rounded-full bg-yellow-900 px-2 py-0.5 text-xs text-yellow-300">
      🔒 Players only
    </span>
  );
}

export default async function GalleryPage() {
  const session = await getSession();
  const where = session ? "" : "WHERE visibility = 'public'";
  const items = db
    .prepare(`SELECT * FROM media ${where} ORDER BY id DESC LIMIT 200`)
    .all();

  const photos = items.filter((m) => m.kind === "photo");
  const clips = items.filter((m) => m.kind === "clip");
  const links = items.filter((m) => m.kind === "video");

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
                  <span className="absolute left-2 top-2">
                    <PlayersBadge />
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
        {clips.length === 0 && links.length === 0 ? (
          <p className="mt-4 text-neutral-500">No videos yet.</p>
        ) : (
          <>
            {clips.length > 0 && (
              <div className="mt-4 grid gap-4 md:grid-cols-2">
                {clips.map((m) => (
                  <div
                    key={m.id}
                    className="overflow-hidden rounded-xl border border-neutral-800 bg-neutral-900"
                  >
                    <video
                      src={`/clip/${m.filename}`}
                      controls
                      preload="metadata"
                      playsInline
                      className="aspect-video w-full bg-black"
                    />
                    <div className="flex items-center gap-2 p-3">
                      <span className="min-w-0 flex-1 truncate text-sm">
                        {m.caption || "Red Lions clip"}
                      </span>
                      {m.visibility === "players" && <PlayersBadge />}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {links.length > 0 && (
              <div className="mt-4 space-y-3">
                {links.map((m) => (
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
                      <div className="text-xs text-neutral-500">
                        {new URL(m.url).hostname}
                      </div>
                    </div>
                    {m.visibility === "players" && <PlayersBadge />}
                  </a>
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </main>
  );
}