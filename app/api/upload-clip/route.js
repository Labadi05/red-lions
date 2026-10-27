import fs from "fs";
import fsp from "fs/promises";
import path from "path";
import crypto from "crypto";
import { Readable, Transform } from "stream";
import { pipeline } from "stream/promises";
import { revalidatePath } from "next/cache";
import db from "@/lib/db";
import { getSession } from "@/lib/session";
import { UPLOAD_DIR } from "@/lib/media";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const MAX_BYTES = 100 * 1024 * 1024;

function json(body, status = 200) {
  return Response.json(body, { status });
}

// Look at the first bytes to decide what the file really is
function detectType(head) {
  if (head.subarray(4, 8).toString("latin1") === "ftyp") {
    return head.subarray(8, 12).toString("latin1") === "qt  " ? "mov" : "mp4";
  }
  if (head[0] === 0x1a && head[1] === 0x45 && head[2] === 0xdf && head[3] === 0xa3) {
    return "webm";
  }
  return null;
}

export async function POST(request) {
  // Only the captain can upload
  const session = await getSession();
  const user = session
    ? db.prepare("SELECT role FROM users WHERE id = ?").get(session.uid)
    : null;
  if (!user || user.role !== "admin") return json({ error: "Not allowed." }, 403);

  const url = new URL(request.url);
  const caption = (url.searchParams.get("caption") || "").trim().slice(0, 200);
  const visibility = url.searchParams.get("visibility") === "players" ? "players" : "public";

  const declared = Number(request.headers.get("content-length") || 0);
  if (declared > MAX_BYTES) return json({ error: "That video is over 100 MB." }, 413);
  if (!request.body) return json({ error: "No file received." }, 400);

  await fsp.mkdir(UPLOAD_DIR, { recursive: true });
  const id = crypto.randomUUID();
  const partPath = path.join(UPLOAD_DIR, `${id}.part`);

  let total = 0;
  let head = Buffer.alloc(0);
  let ext = null;

  // Counts the size and checks the file type while it streams to disk
  const guard = new Transform({
    transform(chunk, _enc, cb) {
      total += chunk.length;
      if (total > MAX_BYTES) return cb(new Error("TOO_BIG"));
      if (!ext) {
        head = Buffer.concat([head, chunk.subarray(0, 12 - head.length)]);
        if (head.length >= 12) {
          ext = detectType(head);
          if (!ext) return cb(new Error("BAD_TYPE"));
        }
      }
      cb(null, chunk);
    },
    flush(cb) {
      cb(ext ? null : new Error("BAD_TYPE"));
    },
  });

  try {
    await pipeline(Readable.fromWeb(request.body), guard, fs.createWriteStream(partPath));
  } catch (err) {
    await fsp.rm(partPath, { force: true });
    if (err.message === "TOO_BIG") return json({ error: "That video is over 100 MB." }, 413);
    if (err.message === "BAD_TYPE") {
      return json({ error: "Unsupported file. Use an MP4, MOV or WebM video." }, 400);
    }
    return json({ error: "Upload failed. Please try again." }, 500);
  }

  const filename = `${id}.${ext}`;
  await fsp.rename(partPath, path.join(UPLOAD_DIR, filename));

  db.prepare(
    "INSERT INTO media (kind, filename, caption, visibility) VALUES ('clip', ?, ?, ?)"
  ).run(filename, caption, visibility);

  revalidatePath("/gallery");
  revalidatePath("/admin/media");
  return json({ ok: true });
}