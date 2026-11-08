import Link from "next/link";
import db from "@/lib/db";
import PlayerPhoto from "@/components/PlayerPhoto";
import PublicShell from "@/components/PublicShell";
import { getT } from "@/lib/i18n";

export const dynamic = "force-dynamic";
export const metadata = { title: "Squad — Red Lions" };

const groups = [
  { position: "Goalkeeper", icon: "🧤" },
  { position: "Defender", icon: "🛡️" },
  { position: "Midfielder", icon: "⚡" },
  { position: "Forward", icon: "🔥" },
];

export default async function SquadPage() {
  const { t } = await getT();
  const players = db
    .prepare("SELECT * FROM players ORDER BY CAST(number AS INTEGER)")
    .all();

  return (
    <PublicShell title={t("squad.title")} subtitle={t("squad.subtitle")}>
      {groups.map((g, gi) => {
        const list = players.filter((p) => p.position === g.position);
        if (list.length === 0) return null;
        return (
          <section key={g.position} className="rl-reveal mt-10">
            <h2 className="flex items-center gap-3 text-xl font-bold">
              <span
                className={`h-6 w-1.5 rounded-full ${
                  gi % 2 === 0 ? "bg-red-600" : "bg-emerald-500"
                }`}
              />
              {g.icon} {t(`squad.group.${g.position}`)}
            </h2>
            <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
              {list.map((p) => (
                <Link
                  key={p.id}
                  href={`/squad/${p.id}`}
                  className="rl-tile group block overflow-hidden rounded-xl border border-neutral-800 bg-neutral-900 hover:border-gold"
                >
                  <div className="relative overflow-hidden">
                    <PlayerPhoto
                      player={p}
                      className="aspect-square w-full transition duration-500 group-hover:scale-110"
                    />
                    <span className="absolute start-2 top-2 rounded-md bg-red-600 px-2 py-0.5 text-sm font-black text-white">
                      {p.number}
                    </span>
                    {p.is_captain === 1 && (
                      <span className="absolute end-2 top-2 rounded-md bg-gold px-2 py-0.5 text-sm font-black text-neutral-950">
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
    </PublicShell>
  );
}