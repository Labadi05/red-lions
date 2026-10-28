// Shows the player's photo, or their initials if no photo has been uploaded yet.
// Give it a size with className, e.g. "aspect-square w-full" or "h-16 w-16 rounded-lg".


export default function PlayerPhoto({ player, full = false, className = "" }) {
  if (player.photo) {
    const file = full ? player.photo : player.photo.replace(".webp", "-t.webp");
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={`/player-photo/${file}`}
        alt={player.name}
        loading="lazy"
        className={`object-cover ${className}`}
      />
    );
  }

  const initials = player.name
    .split(/\s+/)
    .map((w) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <div
      role="img"
      aria-label={player.name}
      className={`flex items-center justify-center bg-neutral-800 text-3xl font-black text-neutral-600 ${className}`}
    >
      {initials}
    </div>
  );
}