"use client";

import { useEffect, useRef, useState } from "react";
import BoardSvg from "@/components/tactics/BoardSvg";
import { exportBoardPng } from "@/components/tactics/exportImage";
import { useT } from "@/components/I18nProvider";

// A read-only board with step buttons and a Play button (for players)
export default function TacticViewer({ board, title }) {
  const t = useT();
  const [index, setIndex] = useState(0);
  const [playing, setPlaying] = useState(false);
  const svgRef = useRef(null);

  const total = board.frames.length;
  const frame = board.frames[index];

  useEffect(() => {
    if (!playing) return;
    const id = setTimeout(() => {
      if (index + 1 >= total) setPlaying(false);
      else setIndex(index + 1);
    }, 2400);
    return () => clearTimeout(id);
  }, [playing, index, total]);

  function play() {
    setIndex(0);
    setPlaying(true);
  }

  function go(i) {
    setPlaying(false);
    setIndex(Math.max(0, Math.min(total - 1, i)));
  }

  const btn =
    "rounded-lg border border-neutral-600 px-4 py-2 text-sm font-semibold hover:border-gold disabled:opacity-40";

  return (
    <div>
      <div className="mx-auto max-w-md overflow-hidden rounded-2xl border border-[#1c3a29] shadow-[0_20px_50px_-20px_rgba(0,0,0,0.8)]">
        <BoardSvg
          svgRef={svgRef}
          items={board.items}
          positions={frame.pos}
          draw={frame.draw}
          frameKey={index}
        />
      </div>

      <div className="mx-auto mt-3 min-h-[3rem] max-w-md text-center">
        {total > 1 && (
          <p className="text-xs font-bold uppercase tracking-widest text-gold">
            {t("tactic.step", { n: index + 1, total })}
          </p>
        )}
        {frame.caption && <p className="mt-1 text-base text-neutral-100">{frame.caption}</p>}
      </div>

      <div className="mt-3 flex flex-wrap items-center justify-center gap-2">
        {total > 1 && (
          <>
            <button type="button" onClick={() => go(index - 1)} disabled={index === 0} className={btn}>
              {t("tactic.prev")}
            </button>
            {playing ? (
              <button
                type="button"
                onClick={() => setPlaying(false)}
                className={`${btn} border-red-600 bg-red-600`}
              >
                {t("tactic.stop")}
              </button>
            ) : (
              <button type="button" onClick={play} className={`${btn} border-red-600 bg-red-600`}>
                {t("tactic.play")}
              </button>
            )}
            <button
              type="button"
              onClick={() => go(index + 1)}
              disabled={index === total - 1}
              className={btn}
            >
              {t("tactic.next")}
            </button>
          </>
        )}
        <button
          type="button"
          onClick={() =>
            exportBoardPng(svgRef.current, {
              title,
              caption: frame.caption,
              filename: `${(title || "tactic").replace(/[^\w]+/g, "-").toLowerCase()}-step-${index + 1}.png`,
            })
          }
          className={btn}
        >
          {t("tactic.saveImage")}
        </button>
      </div>

      {total > 1 && (
        <div className="mt-4 flex justify-center gap-1.5" dir="ltr">
          {board.frames.map((_, i) => (
            <button
              key={i}
              type="button"
              onClick={() => go(i)}
              aria-label={`${i + 1}`}
              className={`h-2.5 rounded-full transition-all ${
                i === index ? "w-8 bg-gold" : "w-2.5 bg-neutral-600"
              }`}
            />
          ))}
        </div>
      )}
    </div>
  );
}