import { POSITIONS } from "@/lib/positions";

export const TEAMS = [
  { name: "Red team", icon: "🔴", border: "border-red-600" },
  { name: "Green team", icon: "🟢", border: "border-green-600" },
  { name: "White team", icon: "⚪", border: "border-neutral-300" },
  { name: "Gold team", icon: "🟡", border: "border-gold" },
];

const SHORT = { Goalkeeper: "GK", Defender: "DEF", Midfielder: "MID", Forward: "FWD" };

// teams: [{ players: [{ number, name, position }], order: [{ number, name }] | null }]
// inner: set when the cards sit inside another card (darker background).
// labels (optional): { teams: [4 team names], shootingOrder, short: { Goalkeeper, ... } }
// Without labels, English is used (the captain's dashboard).
export default function TeamCards({ teams, inner = false, labels }) {
  const bg = inner ? "bg-neutral-950" : "bg-neutral-900";
  const names = labels?.teams ?? TEAMS.map((t) => t.name);
  const shootingOrder = labels?.shootingOrder ?? "Shooting order";
  const short = labels?.short ?? SHORT;

  return (
    <div className="grid gap-4 md:grid-cols-2">
      {teams.map((team, i) => {
        const style = TEAMS[i] ?? TEAMS[0];
        return (
          <div key={i} className={`rounded-xl border-2 p-5 ${bg} ${style.border}`}>
            <h3 className="text-lg font-bold">
              {style.icon} {names[i] ?? style.name}{" "}
              <span className="text-sm font-normal text-neutral-400">
                ({team.players.length})
              </span>
            </h3>

            <div className="mt-3 space-y-2">
              {POSITIONS.map((position) => {
                const list = team.players.filter((p) => p.position === position);
                if (list.length === 0) return null;
                return (
                  <div key={position} className="flex gap-3 text-sm">
                    <span className="w-12 shrink-0 text-xs font-semibold text-neutral-500">
                      {short[position]}
                    </span>
                    <span>
                      {list.map((p, n) => (
                        <span key={`${p.number}-${n}`}>
                          {n > 0 && ", "}
                          <span className="font-black text-red-600">{p.number}</span> {p.name}
                        </span>
                      ))}
                    </span>
                  </div>
                );
              })}
            </div>

            {team.order && team.order.length > 0 && (
              <div className="mt-4 border-t border-neutral-800 pt-3">
                <p className="text-xs uppercase text-neutral-500">{shootingOrder}</p>
                <ol className="mt-1 list-inside list-decimal text-sm">
                  {team.order.map((p, n) => (
                    <li key={`${p.number}-${n}`}>
                      {p.number} {p.name}
                    </li>
                  ))}
                </ol>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}