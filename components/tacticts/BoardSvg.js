import { PITCH, toSvg } from "@/lib/tacticsData";

const GOLD = "#facc15";
const FONT = "Arial, Helvetica, sans-serif";

function Marker({ id, color }) {
  return (
    <marker
      id={id}
      viewBox="0 0 10 10"
      refX="8"
      refY="5"
      markerWidth="4"
      markerHeight="4"
      orient="auto-start-reverse"
    >
      <path d="M0 0 L10 5 L0 10 z" fill={color} />
    </marker>
  );
}

function Markings() {
  const line = { fill: "none", stroke: "#ffffff", strokeOpacity: 0.85, strokeWidth: 3 };
  return (
    <g>
      <rect x="0" y="0" width={PITCH.w} height={PITCH.h} fill="#15803d" />
      {Array.from({ length: 10 }, (_, i) => (
        <rect
          key={i}
          x="20"
          y={20 + i * 101}
          width="640"
          height="101"
          fill={i % 2 ? "#16843f" : "#15803d"}
        />
      ))}
      <rect x="20" y="20" width="640" height="1010" {...line} />
      <line x1="20" y1="525" x2="660" y2="525" {...line} />
      <circle cx="340" cy="525" r="92" {...line} />
      <circle cx="340" cy="525" r="5" fill="#ffffff" fillOpacity="0.85" />
      <rect x="138.5" y="20" width="403" height="165" {...line} />
      <rect x="138.5" y="865" width="403" height="165" {...line} />
      <rect x="248.5" y="20" width="183" height="55" {...line} />
      <rect x="248.5" y="975" width="183" height="55" {...line} />
      <circle cx="340" cy="130" r="5" fill="#ffffff" fillOpacity="0.85" />
      <circle cx="340" cy="920" r="5" fill="#ffffff" fillOpacity="0.85" />
      <path d="M 266.9 185 A 91.5 91.5 0 0 0 413.1 185" {...line} />
      <path d="M 266.9 865 A 91.5 91.5 0 0 1 413.1 865" {...line} />
    </g>
  );
}

function Shape({ d, erasing, onErase }) {
  const erase = erasing
    ? (e) => {
        e.stopPropagation();
        onErase?.(d.id);
      }
    : undefined;

  if (d.type === "text") {
    const [x, y] = toSvg(d.at);
    return (
      <text
        x={x}
        y={y}
        textAnchor="middle"
        fontSize="28"
        fontWeight="800"
        fontFamily={FONT}
        fill="#ffffff"
        stroke="#000000"
        strokeWidth="6"
        paintOrder="stroke"
        onPointerDown={erase}
        style={{ cursor: erasing ? "pointer" : "default" }}
      >
        {d.text}
      </text>
    );
  }

  const [x1, y1] = toSvg(d.a);
  const [x2, y2] = toSvg(d.b);
  const look =
    d.type === "pass"
      ? { stroke: GOLD, width: 6, dash: undefined, marker: "url(#rl-arrow-gold)" }
      : d.type === "run"
      ? { stroke: "#ffffff", width: 5, dash: "16 11", marker: "url(#rl-arrow-white)" }
      : { stroke: "#ffffff", width: 4, dash: undefined, marker: undefined };

  return (
    <g>
      <line
        x1={x1}
        y1={y1}
        x2={x2}
        y2={y2}
        stroke={look.stroke}
        strokeWidth={look.width}
        strokeDasharray={look.dash}
        strokeLinecap="round"
        markerEnd={look.marker}
      />
      {erasing && (
        <line
          data-ui
          x1={x1}
          y1={y1}
          x2={x2}
          y2={y2}
          stroke="transparent"
          strokeWidth="44"
          style={{ cursor: "pointer" }}
          onPointerDown={erase}
        />
      )}
    </g>
  );
}

function Token({ item, pos, selected, dragging, onPointerDown }) {
  const [px, py] = toSvg(pos);
  const x = Math.round(px * 10) / 10;
  const y = Math.round(py * 10) / 10;
  const player = item.kind === "home" || item.kind === "away";

  return (
    <g
      data-x={x}
      data-y={y}
      style={{
        transform: `translate(${x}px, ${y}px)`,
        transition: dragging ? "none" : "transform 1.1s ease-in-out",
        cursor: onPointerDown ? "grab" : "default",
      }}
      onPointerDown={onPointerDown ? (e) => onPointerDown(e, item) : undefined}
    >
      {onPointerDown && <circle r="42" fill="transparent" />}
      {selected && (
        <circle data-ui r="40" fill="none" stroke={GOLD} strokeWidth="4" strokeDasharray="7 6" />
      )}

      {item.kind === "ball" && <circle r="15" fill="#ffffff" stroke="#111111" strokeWidth="3" />}
      {item.kind === "cone" && (
        <polygon points="0,-24 18,18 -18,18" fill="#f97316" stroke="#ffffff" strokeWidth="3" />
      )}

      {item.kind === "home" && (
        <>
          <circle r="28" fill="#c70a08" stroke="#ffffff" strokeWidth="3" />
          <text y="9" textAnchor="middle" fontSize="26" fontWeight="800" fontFamily={FONT} fill="#ffffff">
            {item.label}
          </text>
        </>
      )}
      {item.kind === "away" && (
        <>
          <circle r="28" fill="#f8fafc" stroke="#0f172a" strokeWidth="3" />
          <text y="9" textAnchor="middle" fontSize="26" fontWeight="800" fontFamily={FONT} fill="#0f172a">
            {item.label}
          </text>
        </>
      )}

      {player && item.name && (
        <text
          y="54"
          textAnchor="middle"
          fontSize="18"
          fontWeight="700"
          fontFamily={FONT}
          fill="#ffffff"
          stroke="#000000"
          strokeWidth="4"
          paintOrder="stroke"
        >
          {item.name}
        </text>
      )}
    </g>
  );
}

// items: the board's items, positions: { itemId: [x, y] } for the step being shown,
// draw: arrows and labels of that step. Handlers are only given by the editor.
export default function BoardSvg({
  items,
  positions,
  draw = [],
  preview = null,
  selectedId = null,
  dragId = null,
  erasing = false,
  onErase,
  onItemPointerDown,
  onBackgroundPointerDown,
  onPointerMove,
  onPointerUp,
  frameKey = 0,
  svgRef,
  className = "",
}) {
  return (
    <svg
      ref={svgRef}
      viewBox={`0 0 ${PITCH.w} ${PITCH.h}`}
      className={`block w-full select-none ${className}`}
      style={{ touchAction: onBackgroundPointerDown ? "none" : "auto" }}
      onPointerDown={onBackgroundPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerCancel={onPointerUp}
    >
      <defs>
        <Marker id="rl-arrow-gold" color={GOLD} />
        <Marker id="rl-arrow-white" color="#ffffff" />
      </defs>

      <Markings />

      <g key={frameKey} className="rl-draw-in">
        {draw.map((d) => (
          <Shape key={d.id} d={d} erasing={erasing} onErase={onErase} />
        ))}
      </g>
      {preview && <Shape d={preview} />}

      {items.map((item) => (
        <Token
          key={item.id}
          item={item}
          pos={positions[item.id] ?? [0.5, 0.5]}
          selected={selectedId === item.id}
          dragging={dragId === item.id}
          onPointerDown={onItemPointerDown}
        />
      ))}
    </svg>
  );
}