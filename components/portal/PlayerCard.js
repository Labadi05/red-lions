import Logo from "@/components/Logo";
import PlayerPhoto from "@/components/PlayerPhoto";

// The gold football card. labels: { app, goals, assists, motm }
export default function PlayerCard({ player, number, position, isCaptain, stats, labels }) {
  const items = [
    [labels.app, stats.apps],
    [labels.goals, stats.goals],
    [labels.assists, stats.assists],
    [labels.motm, stats.motm],
  ];

  return (
    <div className="rl-tilt mx-auto w-full max-w-[300px]">
      <div className="rounded-[28px] bg-gradient-to-b from-[#f6dd8f] via-[#d4a017] to-[#7a4f00] p-[3px] shadow-[0_24px_60px_-18px_rgba(212,160,23,0.6)]">
        <div className="rl-card-shine relative overflow-hidden rounded-[25px] bg-gradient-to-b from-[#12301f] to-[#050d08] px-5 pb-5 pt-4">
          <div className="flex items-start justify-between">
            <div>
              <div className="text-5xl font-black leading-none text-gold" dir="ltr">
                {number ?? "—"}
              </div>
              <div className="mt-1 text-xs font-bold uppercase tracking-widest text-gold/80">
                {position}
              </div>
            </div>
            <Logo width={38} />
          </div>

          <div className="relative mx-auto mt-3 h-44 w-44">
            <PlayerPhoto player={player} className="h-full w-full rounded-2xl" />
            {isCaptain && (
              <span className="absolute -bottom-2 end-0 rounded-md bg-gold px-2 py-0.5 text-sm font-black text-neutral-950">
                C
              </span>
            )}
          </div>

          <div className="mt-4 text-center text-2xl font-black uppercase tracking-wide">
            {player.name}
          </div>

          <div className="mx-auto my-3 h-px w-3/4 bg-gold/40" />

          <div className="grid grid-cols-4 text-center">
            {items.map(([label, value]) => (
              <div key={label}>
                <div className="text-xl font-black" dir="ltr">
                  {value}
                </div>
                <div className="text-[10px] font-bold uppercase text-gold/80">{label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}