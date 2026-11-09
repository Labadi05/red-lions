// A circular progress ring (0 to 100) with something written in the middle
export default function Ring({ value, size = 64, stroke = 7, color = "#d4a017", children }) {
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const v = Math.max(0, Math.min(100, value ?? 0));

  return (
    <div className="relative shrink-0" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90" aria-hidden>
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke="rgba(255,255,255,0.12)"
          strokeWidth={stroke}
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke={color}
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={`${(v / 100) * c} ${c}`}
          className="rl-ring"
        />
      </svg>
      <div
        className="absolute inset-0 flex items-center justify-center text-sm font-black"
        dir="ltr"
      >
        {children}
      </div>
    </div>
  );
}