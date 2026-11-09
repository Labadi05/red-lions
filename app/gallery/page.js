import db from "@/lib/db";
import { getSession } from "@/lib/session";
import PublicShell from "@/components/PublicShell";
import { getT } from "@/lib/i18n";

export const dynamic = "force-dynamic";
export const metadata = { title: "Gallery — Red Lions" };

function PlayersBadge({ label }) {
  return (
    <span className="rounded-full bg-yellow-900 px-2 py-0.5 text-xs text-yellow-300">
      {label}
    </span>
  );
}

export default async function GalleryPage() {
  const { t } = await getT();
  const session = await getSession();
  const where = session ? "" : "WHERE visibility = 'public'";
  const items = db
    .prepare(`SELECT * FROM media ${where} ORDER BY id DESC LIMIT 200`)
    .all();

  const photos = items.filter((m) => m.kind === "photo");
  const clips = items.filter((m) => m.kind === "clip");
  const links = items.filter((m) => m.kind === "video");
  const playersOnly = t("common.playersOnly");

  return (
    <PublicShell title={`${t("gallery.title")} 📸`} subtitle={t("gallery.subtitle")}>
      <h2 className="flex items-center gap-3 text-xl font-bold">
        <span className="h-6 w-1.5 rounded-full bg-red-600" />
        {t("gallery.photos")}
      </h2>
      {photos.length === 0 ? (
        <p className="mt-4 text-neutral-400">{t("gallery.noPhotos")}</p>
      ) : (
        <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
          {photos.map((m) => (
            <a
              key={m.id}
              href={`/media/${m.filename}`}
              target="_blank"
              rel="noopener noreferrer"
              className="rl-tile rl-reveal group relative block overflow-hidden rounded-xl border border-neutral-800"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={`/media/${m.filename.replace(".webp", "-t.webp")}`}
                alt={m.caption || t("gallery.photoAlt")}
                loading="lazy"
                className="aspect-square w-full object-cover transition duration-500 group-hover:scale-110"
              />
              {m.visibility === "players" && (
                <span className="absolute start-2 top-2">
                  <PlayersBadge label={playersOnly} />
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

      <h2 className="mt-12 flex items-center gap-3 text-xl font-bold">
        <span className="h-6 w-1.5 rounded-full bg-emerald-500" />
        {t("gallery.videos")}
      </h2>
      {clips.length === 0 && links.length === 0 ? (
        <p className="mt-4 text-neutral-400">{t("gallery.noVideos")}</p>
      ) : (
        <>
          {clips.length > 0 && (
            <div className="mt-4 grid gap-4 md:grid-cols-2">
              {clips.map((m) => (
                <div
                  key={m.id}
                  className="rl-reveal overflow-hidden rounded-xl border border-neutral-800 bg-neutral-900"
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
                      {m.caption || t("gallery.clipFallback")}
                    </span>
                    {m.visibility === "players" && <PlayersBadge label={playersOnly} />}
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
                  className="rl-tile rl-reveal flex items-center gap-4 rounded-xl border border-neutral-800 bg-neutral-900 p-4 hover:border-red-600"
                >
                  <span className="text-3xl">▶️</span>
                  <div className="min-w-0 flex-1">
                    <div className="truncate font-semibold">{m.caption}</div>
                    <div className="text-xs text-neutral-400" dir="ltr">
                      {new URL(m.url).hostname}
                    </div>
                  </div>
                  {m.visibility === "players" && <PlayersBadge label={playersOnly} />}
                </a>
              ))}
            </div>
          )}
        </>
      )}
    </PublicShell>
  );
}