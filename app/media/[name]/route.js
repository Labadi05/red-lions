import fs from "fs/promises";
import path from "path";
import db from "@/lib/db";
import { getSession } from "@/lib/session";
import { UPLOAD_DIR } from "@/lib/media";

export async function GET(request, { params }) {
  const { name } = await params;

  // Only our own generated names are allowed: <uuid>.webp or <uuid>-t.webp
  const match = /^([a-f0-9-]{36})(-t)?\.webp$/.exec(name);
  if (!match) return new Response("Not found", { status: 404 });

  const row = db
    .prepare("SELECT visibility FROM media WHERE filename = ?")
    .get(`${match[1]}.webp`);
  if (!row) return new Response("Not found", { status: 404 });

  if (row.visibility !== "public") {
    const session = await getSession();
    if (!session) return new Response("Not found", { status: 404 });
  }

  try {
    const data = await fs.readFile(path.join(UPLOAD_DIR, name));
    return new Response(data, {
      headers: {
        "Content-Type": "image/webp",
        "Cache-Control":
          row.visibility === "public"
            ? "public, max-age=86400"
            : "private, max-age=3600",
      },
    });
  } catch {
    return new Response("Not found", { status: 404 });
  }
}