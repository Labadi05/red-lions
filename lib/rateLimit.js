import { headers } from "next/headers";
import db from "@/lib/db";

const now = () => Math.floor(Date.now() / 1000);

// The visitor's address. Behind our server's proxy this comes from X-Forwarded-For.
export async function getClientIp() {
  const h = await headers();
  const forwarded = h.get("x-forwarded-for");
  const ip = (forwarded ? forwarded.split(",")[0] : h.get("x-real-ip")) || "local";
  return ip.trim().slice(0, 64);
}

// How many seconds this key is still locked (0 = not locked)
export function secondsLocked(key) {
  const row = db.prepare("SELECT locked_until FROM login_attempts WHERE key = ?").get(key);
  return row ? Math.max(row.locked_until - now(), 0) : 0;
}

// Counts one failure. Returns true if this failure just locked the key.
export function recordFailure(key, { max, windowSec, lockSec }) {
  const t = now();

  const run = db.transaction(() => {
    const row = db.prepare("SELECT * FROM login_attempts WHERE key = ?").get(key);

    let fails = 1;
    let windowStart = t;
    if (row && t - row.window_start <= windowSec) {
      fails = row.fails + 1;
      windowStart = row.window_start;
    }

    const locked = fails >= max;
    db.prepare(
      `INSERT INTO login_attempts (key, fails, window_start, locked_until)
       VALUES (?, ?, ?, ?)
       ON CONFLICT(key) DO UPDATE SET
         fails = excluded.fails,
         window_start = excluded.window_start,
         locked_until = excluded.locked_until`
    ).run(
      key,
      locked ? 0 : fails,
      locked ? t : windowStart,
      locked ? t + lockSec : row?.locked_until ?? 0
    );
    return locked;
  });

  return run();
}

export function clearFailures(key) {
  db.prepare("DELETE FROM login_attempts WHERE key = ?").run(key);
}

// Adds a line to the captain's "failed logins" list and tidies old data
export function logLoginFailure(username, ip, reason) {
  db.prepare("INSERT INTO login_failures (username, ip, reason) VALUES (?, ?, ?)").run(
    username.slice(0, 40),
    ip,
    reason
  );
  db.prepare("DELETE FROM login_failures WHERE at < datetime('now', '-30 days')").run();
  db.prepare(
    "DELETE FROM login_attempts WHERE locked_until < ? AND window_start < ?"
  ).run(now() - 86400, now() - 86400);
}