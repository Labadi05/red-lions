"use server";

import bcrypt from "bcryptjs";
import { redirect } from "next/navigation";
import db from "@/lib/db";
import { createSession, destroySession } from "@/lib/session";

export async function login(prevState, formData) {
  const username = String(formData.get("username") || "").trim().toLowerCase();
  const password = String(formData.get("password") || "");

  const user = db.prepare("SELECT * FROM users WHERE username = ?").get(username);
  if (!user || !bcrypt.compareSync(password, user.password_hash)) {
    return { error: "Wrong username or password." };
  }

  await createSession(user);
  redirect("/portal");
}

export async function logout() {
  await destroySession();
  redirect("/");
}