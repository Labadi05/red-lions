"use client";

import { useEffect, useState } from "react";
import { useT } from "@/components/I18nProvider";

// Counts down to an event. Event times are stored in Jinzhou time (UTC+8).
// light: dark boxes for use on a light background (the ticket)
export default function Countdown({ startsAt, light = false }) {
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

  const box = light ? "bg-neutral-900 text-white" : "bg-black/30";

  return (
    <div className="flex gap-2" dir="ltr">
      {parts.map(([n, label]) => (
        <div
          key={label}
          className={`min-w-[3.6rem] rounded-lg px-2 py-2 text-center ${box}`}
        >
          <div className="text-2xl font-black tabular-nums">{String(n).padStart(2, "0")}</div>
          <div className="text-[10px] uppercase text-neutral-400">{label}</div>
        </div>
      ))}
    </div>
  );
}