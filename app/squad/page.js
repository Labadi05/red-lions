import Link from "next/link";
import db from "@/lib/db";

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
    <main className="min-h-screen bg-neutral-950 text-white px-6 py-12">
      <div className="mx-auto max-w-4xl">
        <Link href="/" className="text-sm text-red-400 hover:underline">
          ← Home
        </Link>
        <h1 className="mt-4 text-4xl font-bold">The Squad 🦁</h1>
        <p className="mt-2 text-neutral-400">Red Lions · Jinzhou</p>

        {groups.map((g) => (
          <section key={g.position} className="mt-10">
            <h2 className="text-xl font-semibold text-red-500">
              {g.icon} {g.title}
            </h2>
            <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
              {players
                .filter((p) => p.position === g.position)
                .map((p) => (
                  <div
                    key={p.id}
                    className="rounded-xl border border-neutral-800 bg-neutral-900 p-4"
                  >
                    <div className="text-3xl font-black text-red-600">
                      {p.number}
                    </div>
                    <div className="mt-1 font-medium">{p.name}</div>
                    {p.is_captain === 1 && (
                      <div className="mt-1 text-xs text-yellow-400">
                        Captain 🫡
                      </div>
                    )}
                  </div>
                ))}
            </div>
          </section>
        ))}
      </div>
    </main>
  );
}