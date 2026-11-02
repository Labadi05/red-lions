"use server";

import bcrypt from "bcryptjs";
import { redirect } from "next/navigation";
import db from "@/lib/db";
import { createSession, destroySession } from "@/lib/session";
import {
  getClientIp,
  secondsLocked,
  recordFailure,
  clearFailures,
  logLoginFailure,
} from "@/lib/rateLimit";

// Checked against when the username does not exist, so the answer takes equally long
const DUMMY_HASH = bcrypt.hashSync("not-a-real-password", 10);

const LOCK = { windowSec: 900, lockSec: 900 }; // 15 minutes

export async function login(prevState, formData) {
  const username = String(formData.get("username") || "")
    .trim()
    .toLowerCase()
    .slice(0, 40);
  const password = String(formData.get("password") || "").slice(0, 200);
  const ip = await getClientIp();

  const ipKey = `ip:${ip}`;
  const accountKey = `acct:${username}`;

  // Still locked? Do not even check the password.
  const wait = Math.max(secondsLocked(ipKey), secondsLocked(accountKey));
  if (wait > 0) {
    return { error: "locked", minutes: Math.ceil(wait / 60) };
  }

  const user = db.prepare("SELECT * FROM users WHERE username = ?").get(username);
  const correct = bcrypt.compareSync(password, user?.password_hash ?? DUMMY_HASH);

  if (!user || !correct) {
    const ipLocked = recordFailure(ipKey, { max: 20, ...LOCK });
    const accountLocked = recordFailure(accountKey, { max: 10, ...LOCK });

    logLoginFailure(username, ip, user ? "bad_password" : "unknown_user");
    if (ipLocked || accountLocked) logLoginFailure(username, ip, "lockout");

    return { error: "invalid" };
  }

  clearFailures(accountKey);
  await createSession(user);
  redirect("/portal");
}

export async function logout() {
  await destroySession();
  redirect("/");
}