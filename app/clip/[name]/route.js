import fs from "fs";
import fsp from "fs/promises";
import path from "path";
import { Readable } from "stream";
import db from "@/lib/db";
import { getSession } from "@/lib/session";
import { UPLOAD_DIR } from "@/lib/media";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const TYPES = { mp4: "video/mp4", mov: "video/quicktime", webm: "video/webm" };

export async function GET(request, { params }) {
  const { name } = await params;

  // Only our own generated names are allowed
  const match = /^[a-f0-9-]{36}\.(mp4|mov|webm)$/.exec(name);
  if (!match) return new Response("Not found", { status: 404 });

  const row = db
    .prepare("SELECT visibility FROM media WHERE filename = ? AND kind = 'clip'")
    .get(name);
  if (!row) return new Response("Not found", { status: 404 });

  if (row.visibility !== "public") {
    const session = await getSession();
    if (!session) return new Response("Not found", { status: 404 });
  }

  const filePath = path.join(UPLOAD_DIR, name);
  let size;
  try {
    size = (await fsp.stat(filePath)).size;
  } catch {
    return new Response("Not found", { status: 404 });
  }

  const baseHeaders = {
    "Content-Type": TYPES[match[1]],
    "Accept-Ranges": "bytes",
    "X-Content-Type-Options": "nosniff",
    "Cache-Control":
      row.visibility === "public" ? "public, max-age=86400" : "private, max-age=3600",
  };

  const range = request.headers.get("range");
  if (!range) {
    return new Response(Readable.toWeb(fs.createReadStream(filePath)), {
      status: 200,
      headers: { ...baseHeaders, "Content-Length": String(size) },
    });
  }

  // Seeking: the browser asks for a piece of the file, e.g. "bytes=1000-"
  const m = /^bytes=(\d*)-(\d*)$/.exec(range);
  const unsatisfiable = () =>
    new Response(null, {
      status: 416,
      headers: { ...baseHeaders, "Content-Range": `bytes */${size}` },
    });
  if (!m || (m[1] === "" && m[2] === "")) return unsatisfiable();

  let start;
  let end;
  if (m[1] === "") {
    start = Math.max(size - Number(m[2]), 0);
    end = size - 1;
  } else {
    start = Number(m[1]);
    end = m[2] === "" ? size - 1 : Math.min(Number(m[2]), size - 1);
  }
  if (start > end || start >= size) return unsatisfiable();

  return new Response(Readable.toWeb(fs.createReadStream(filePath, { start, end })), {
    status: 206,
    headers: {
      ...baseHeaders,
      "Content-Range": `bytes ${start}-${end}/${size}`,
      "Content-Length": String(end - start + 1),
    },
  });
}