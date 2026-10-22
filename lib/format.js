export const TYPES = {
  training: { label: "Training", icon: "🏃" },
  match: { label: "Match", icon: "⚽" },
  meeting: { label: "Meeting", icon: "🗣️" },
};

// "2026-10-25T19:00" -> "Sun 25 Oct · 19:00"
export function formatWhen(s) {
  const d = new Date(s + ":00Z");
  const day = d.toLocaleDateString("en-GB", {
    weekday: "short",
    day: "numeric",
    month: "short",
    timeZone: "UTC",
  });
  return `${day} · ${s.slice(11, 16)}`;
}

// Current time in Jinzhou (UTC+8) in the same format as stored events
export function nowInJinzhou() {
  return new Date(Date.now() + 8 * 3600 * 1000).toISOString().slice(0, 16);
}