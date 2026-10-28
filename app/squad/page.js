import Link from "next/link";
import db from "@/lib/db";
import PlayerPhoto from "@/components/PlayerPhoto";

export const dynamic = "force-dynamic";
export const metadata = { title: "Squad — Red Lions" };

const groups = [
  { position: "Goalkeeper", title: "Goalkeeper", icon: "🧤" },
  { position: "Defender", title: "Defenders", icon: "🛡️" },
  { position: "Midfielder", title: "Midfielders", icon: "⚡" },
  { position: "Forward", title: "Forwards", icon: "🔥" },
];

export default function SquadPage() {
  const players = db
    .prepare("SELECT * FROM players ORDER BY CAST(number AS INTEGER)")
    .all();

  return (
    <main className="min-h-screen bg-neutral-950 px-6 py-12 text-white">
      <div className="mx-auto max-w-5xl">
        <Link href="/" className="text-sm text-red-400 hover:underline">
          ← Home
        </Link>
        <h1 className="mt-4 text-4xl font-bold">The Squad</h1>
        <p className="mt-2 text-neutral-400">Red Lions · Jinzhou. Tap a player to see their profile.</p>

        {groups.map((g) => {
          const list = players.filter((p) => p.position === g.position);
          if (list.length === 0) return null;
          return (
            <section key={g.position} className="mt-10">
              <h2 className="text-xl font-semibold text-red-500">
                {g.icon} {g.title}
              </h2>
              <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
                {list.map((p) => (
                  <Link
                    key={p.id}
                    href={`/squad/${p.id}`}
                    className="group block overflow-hidden rounded-xl border border-neutral-800 bg-neutral-900 hover:border-gold"
                  >
                    <div className="relative">
                      <PlayerPhoto
                        player={p}
                        className="aspect-square w-full transition group-hover:scale-105"
                      />
                      <span className="absolute left-2 top-2 rounded-md bg-red-600 px-2 py-0.5 text-sm font-black text-white">
                        {p.number}
                      </span>
                      {p.is_captain === 1 && (
                        <span className="absolute right-2 top-2 rounded-md bg-gold px-2 py-0.5 text-sm font-black text-neutral-950">
                          C
                        </span>
                      )}
                    </div>
                    <div className="p-3 font-medium">{p.name}</div>
                  </Link>
                ))}
              </div>
            </section>
          );
        })}
      </div>
    </main>
  );
}