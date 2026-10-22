import Link from "next/link";
import db from "@/lib/db";
import { formatWhen, nowInJinzhou } from "@/lib/format";

export const dynamic = "force-dynamic";
export const metadata = { title: "Fixtures & Results — Red Lions" };

function matchName(m) {
  return m.opponent ? `Red Lions vs ${m.opponent}` : m.title;
}

export default function FixturesPage() {
  const now = nowInJinzhou();

  const upcoming = db
    .prepare("SELECT * FROM events WHERE type = 'match' AND starts_at >= ? ORDER BY starts_at ASC")
    .all(now);
  const past = db
    .prepare("SELECT * FROM events WHERE type = 'match' AND starts_at < ? ORDER BY starts_at DESC")
    .all(now);

  const played = past.filter((m) => m.score_for !== null && m.score_against !== null);
  const wins = played.filter((m) => m.score_for > m.score_against).length;
  const draws = played.filter((m) => m.score_for === m.score_against).length;
  const losses = played.filter((m) => m.score_for < m.score_against).length;
  const goalsFor = played.reduce((sum, m) => sum + m.score_for, 0);
  const goalsAgainst = played.reduce((sum, m) => sum + m.score_against, 0);

  return (
    <main className="min-h-screen bg-neutral-950 px-6 py-12 text-white">
      <div className="mx-auto max-w-3xl">
        <Link href="/" className="text-sm text-red-400 hover:underline">
          ← Home
        </Link>
        <h1 className="mt-4 text-4xl font-bold">Fixtures & Results ⚽</h1>
        <p className="mt-2 text-neutral-400">Red Lions · Jinzhou</p>

        {played.length > 0 && (
          <div className="mt-8 grid grid-cols-5 gap-2 text-center">
            {[
              ["P", played.length],
              ["W", wins],
              ["D", draws],
              ["L", losses],
              ["Goals", `${goalsFor}-${goalsAgainst}`],
            ].map(([label, value]) => (
              <div
                key={label}
                className="rounded-xl border border-neutral-800 bg-neutral-900 py-3"
              >
                <div className="text-2xl font-black text-red-600">{value}</div>
                <div className="text-xs text-neutral-400">{label}</div>
              </div>
            ))}
          </div>
        )}

        <h2 className="mt-10 text-xl font-semibold text-red-500">Upcoming matches</h2>
        <div className="mt-4 space-y-3">
          {upcoming.length === 0 && (
            <p className="text-neutral-500">No upcoming matches announced yet.</p>
          )}
          {upcoming.map((m) => (
            <div
              key={m.id}
              className="rounded-xl border border-neutral-800 bg-neutral-900 p-5"
            >
              <div className="text-lg font-semibold">{matchName(m)}</div>
              <div className="mt-1 text-sm text-neutral-400">{formatWhen(m.starts_at)}</div>
              {m.location && (
                <div className="mt-1 text-sm text-neutral-500">📍 {m.location}</div>
              )}
            </div>
          ))}
        </div>

        <h2 className="mt-12 text-xl font-semibold text-red-500">Results</h2>
        <div className="mt-4 space-y-3">
          {past.length === 0 && <p className="text-neutral-500">No matches played yet.</p>}
          {past.map((m) => {
            const hasScore = m.score_for !== null && m.score_against !== null;
            const outcome = !hasScore
              ? null
              : m.score_for > m.score_against
              ? { label: "W", style: "bg-green-900 text-green-300" }
              : m.score_for < m.score_against
              ? { label: "L", style: "bg-red-900 text-red-300" }
              : { label: "D", style: "bg-neutral-700 text-neutral-200" };

            return (
              <div
                key={m.id}
                className="flex items-center gap-4 rounded-xl border border-neutral-800 bg-neutral-900 p-5"
              >
                <div className="min-w-0 flex-1">
                  <div className="font-semibold">{matchName(m)}</div>
                  <div className="mt-1 text-sm text-neutral-400">{formatWhen(m.starts_at)}</div>
                </div>
                {hasScore ? (
                  <>
                    <div className="text-2xl font-black">
                      {m.score_for} – {m.score_against}
                    </div>
                    <span className={`rounded-full px-2.5 py-1 text-xs font-bold ${outcome.style}`}>
                      {outcome.label}
                    </span>
                  </>
                ) : (
                  <span className="text-sm text-neutral-500">Result to come</span>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </main>
  );
}