import { redirect } from "next/navigation";
import db from "@/lib/db";
import { getSession } from "@/lib/session";

// Call this at the top of any admin page or action.
export async function requireAdmin() {
  const session = await getSession();
  if (!session) redirect("/login");

  const user = db.prepare("SELECT * FROM users WHERE id = ?").get(session.uid);
  if (!user || user.role !== "admin") redirect("/portal");
  return user;
}