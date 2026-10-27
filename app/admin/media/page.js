import Link from "next/link";
import db from "@/lib/db";
import { requireAdmin } from "@/lib/auth";
import { PhotoForm, VideoForm } from "./MediaForms";
import ClipForm from "./ClipForm";
import { setMediaVisibility, deleteMedia } from "./actions";

export const dynamic = "force-dynamic";

export default async function AdminMediaPage() {
  await requireAdmin();
  const items = db.prepare("SELECT * FROM media ORDER BY id DESC LIMIT 200").all();

  return (
    <main className="min-h-screen bg-neutral-950 px-6 py-12 text-white">
      <div className="mx-auto max-w-4xl">
        <Link href="/admin" className="text-sm text-red-400 hover:underline">
          ← Dashboard
        </Link>
        <h1 className="mt-4 text-4xl font-bold">Gallery 📸</h1>

        <div className="mt-8 grid gap-6 md:grid-cols-2">
          <PhotoForm />
          <ClipForm />
          <div className="md:col-span-2">
            <VideoForm />
          </div>
        </div>

        <h2 className="mt-12 text-xl font-semibold text-red-500">
          All items ({items.length})
        </h2>
        <div className="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-3">
          {items.length === 0 && <p className="text-neutral-500">Nothing yet.</p>}
          {items.map((m) => (
            <div
              key={m.id}
              className="overflow-hidden rounded-xl border border-neutral-800 bg-neutral-900"
            >
              {m.kind === "photo" && (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={`/media/${m.filename.replace(".webp", "-t.webp")}`}
                  alt={m.caption || "Red Lions photo"}
                  loading="lazy"
                  className="aspect-square w-full object-cover"
                />
              )}
              {m.kind === "clip" && (
                <video
                  src={`/clip/${m.filename}`}
                  controls
                  preload="metadata"
                  playsInline
                  className="aspect-square w-full bg-black object-cover"
                />
              )}
              {m.kind === "video" && (
                <a
                  href={m.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex aspect-square w-full items-center justify-center bg-neutral-800 text-5xl hover:bg-neutral-700"
                >
                  ▶️
                </a>
              )}

              <div className="p-3">
                <p className="truncate text-sm">
                  {m.kind === "clip" ? "🎞️ " : ""}
                  {m.caption || "No caption"}
                </p>
                <div className="mt-2 flex flex-wrap items-center gap-2">
                  <form action={setMediaVisibility}>
                    <input type="hidden" name="id" value={m.id} />
                    <input
                      type="hidden"
                      name="visibility"
                      value={m.visibility === "public" ? "players" : "public"}
                    />
                    <button
                      className={`rounded-full px-2 py-0.5 text-xs ${
                        m.visibility === "public"
                          ? "bg-green-900 text-green-300"
                          : "bg-yellow-900 text-yellow-300"
                      }`}
                      title="Click to switch"
                    >
                      {m.visibility === "public" ? "🌍 Public" : "🔒 Players only"}
                    </button>
                  </form>
                  <form action={deleteMedia} className="ml-auto">
                    <input type="hidden" name="id" value={m.id} />
                    <button className="rounded-lg border border-red-900 px-2 py-0.5 text-xs text-red-400 hover:bg-red-950">
                      Delete
                    </button>
                  </form>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}