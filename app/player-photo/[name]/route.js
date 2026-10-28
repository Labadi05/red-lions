import fs from "fs/promises";
import path from "path";
import db from "@/lib/db";
import { UPLOAD_DIR } from "@/lib/media";

export async function GET(request, { params }) {
  const { name } = await params;

  // Only our own generated names: p-<uuid>.webp or p-<uuid>-t.webp
  const match = /^(p-[a-f0-9-]{36})(-t)?\.webp$/.exec(name);
  if (!match) return new Response("Not found", { status: 404 });

  const row = db.prepare("SELECT id FROM players WHERE photo = ?").get(`${match[1]}.webp`);
  if (!row) return new Response("Not found", { status: 404 });

  try {
    const data = await fs.readFile(path.join(UPLOAD_DIR, name));
    return new Response(data, {
      headers: {
        "Content-Type": "image/webp",
        // A replaced photo gets a new file name, so long caching is safe
        "Cache-Control": "public, max-age=31536000, immutable",
      },
    });
  } catch {
    return new Response("Not found", { status: 404 });
  }
}