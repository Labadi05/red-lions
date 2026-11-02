import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";
import db from "@/lib/db";

const secret = () => new TextEncoder().encode(process.env.SESSION_SECRET);

export async function createSession(user) {
  const token = await new SignJWT({
    uid: user.id,
    role: user.role,
    name: user.username,
    v: user.pwv ?? 0,
  })
    .setProtectedHeader({ alg: "HS256" })
    .setExpirationTime("30d")
    .sign(secret());

  const jar = await cookies();
  jar.set("rl_session", token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 30,
  });
}

export async function getSession() {
  const jar = await cookies();
  const token = jar.get("rl_session")?.value;
  if (!token) return null;

  try {
    const { payload } = await jwtVerify(token, secret());

    // The session stops working if the account was deleted or its password was reset
    const user = db.prepare("SELECT pwv FROM users WHERE id = ?").get(payload.uid);
    if (!user || user.pwv !== (payload.v ?? 0)) return null;

    return payload;
  } catch {
    return null;
  }
}

export async function destroySession() {
  const jar = await cookies();
  jar.delete("rl_session");
}