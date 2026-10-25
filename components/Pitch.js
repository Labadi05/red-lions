import { FORMATIONS } from "@/lib/formations";

export default function Pitch({ formation, slotIds, playersById }) {
  const lines = FORMATIONS[formation] ?? [];

  // Index of the first slot of each line (slot 0 is the goalkeeper)
  const starts = [];
  let cursor = 1;
  for (const count of lines) {
    starts.push(cursor);
    cursor += count;
  }

  function slot(i) {
    const p = playersById[slotIds[i]];
    return (
      <div key={i} className="flex w-16 flex-col items-center text-center">
        <div
          className={`flex h-10 w-10 items-center justify-center rounded-full border-2 text-sm font-black text-white ${
            p ? "border-white bg-red-600" : "border-dashed border-white/50 bg-black/20"
          }`}
        >
          {p ? p.number : "?"}
        </div>
        <div className="mt-1 w-full truncate text-xs font-medium text-white">
          {p ? p.name : ""}
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-xl border-2 border-white/30 bg-green-700 px-3 py-6">
      <div className="flex flex-col gap-6">
        {[...lines.keys()].reverse().map((li) => (
          <div key={li} className="flex justify-around">
            {Array.from({ length: lines[li] }, (_, k) => slot(starts[li] + k))}
          </div>
        ))}
        <div className="flex justify-around">{slot(0)}</div>
      </div>
    </div>
  );
}