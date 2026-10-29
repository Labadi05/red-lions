export const CATEGORIES = {
  pitch: { label: "Pitch rental", icon: "🏟️" },
  water: { label: "Water & drinks", icon: "💧" },
  fine: { label: "Fine", icon: "⚠️" },
  equipment: { label: "Equipment", icon: "👕" },
  other: { label: "Other", icon: "💬" },
};

// 4000 -> "¥40", 3334 -> "¥33.34"
export function formatMoney(cents) {
  return cents % 100 === 0 ? `¥${cents / 100}` : `¥${(cents / 100).toFixed(2)}`;
}

// "40", "40.5", "40,50" -> cents. Returns NaN if it is not a valid positive amount.
export function parseMoney(value) {
  const s = String(value ?? "").trim().replace(",", ".");
  if (!/^\d{1,6}(\.\d{1,2})?$/.test(s)) return NaN;
  const cents = Math.round(Number(s) * 100);
  return cents > 0 ? cents : NaN;
}