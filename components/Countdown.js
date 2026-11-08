"use client";

import { useEffect, useState } from "react";
import { useT } from "@/components/I18nProvider";

// Counts down to a match. Event times are stored in Jinzhou time (UTC+8).
export default function Countdown({ startsAt }) {
  const t = useT();
  const [left, setLeft] = useState(null);

  useEffect(() => {
    const target = new Date(`${startsAt}:00+08:00`).getTime();
    const tick = () => setLeft(Math.max(target - Date.now(), 0));
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [startsAt]);

  if (left === null) return <div className="h-[4.5rem]" />;

  const s = Math.floor(left / 1000);
  const parts = [
    [Math.floor(s / 86400), t("home.days")],
    [Math.floor((s % 86400) / 3600), t("home.hours")],
    [Math.floor((s % 3600) / 60), t("home.minutes")],
    [s % 60, t("home.seconds")],
  ];

  return (
    <div className="flex gap-2" dir="ltr">
      {parts.map(([n, label]) => (
        <div
          key={label}
          className="min-w-[3.6rem] rounded-lg bg-black/30 px-2 py-2 text-center"
        >
          <div className="text-2xl font-black tabular-nums">{String(n).padStart(2, "0")}</div>
          <div className="text-[10px] uppercase text-neutral-400">{label}</div>
        </div>
      ))}
    </div>
  );
}