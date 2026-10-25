// Players per line, from defense to attack (the goalkeeper is added automatically)
export const FORMATIONS = {
  "4-4-2": [4, 4, 2],
  "4-3-3": [4, 3, 3],
  "4-2-3-1": [4, 2, 3, 1],
  "3-5-2": [3, 5, 2],
  "3-4-3": [3, 4, 3],
  "5-3-2": [5, 3, 2],
  // 7-a-side
  "2-3-1": [2, 3, 1],
  "3-2-1": [3, 2, 1],
  "2-2-2": [2, 2, 2],
};

export function slotCount(formation) {
  return 1 + (FORMATIONS[formation] ?? []).reduce((a, b) => a + b, 0);
}

// Slot 0 is the goalkeeper, then defenders, midfielders, attackers (left to right)
export function slotLabel(formation, index) {
  if (index === 0) return "GK";
  const lines = FORMATIONS[formation] ?? [];
  let cursor = 1;
  for (let li = 0; li < lines.length; li++) {
    if (index < cursor + lines[li]) {
      const name = li === 0 ? "DEF" : li === lines.length - 1 ? "ATT" : "MID";
      return `${name} ${index - cursor + 1}`;
    }
    cursor += lines[li];
  }
  return `Slot ${index}`;
}