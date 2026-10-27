"use server";

import fs from "fs/promises";
import path from "path";
import crypto from "crypto";
import sharp from "sharp";
import { revalidatePath } from "next/cache";
import db from "@/lib/db";
import { requireAdmin } from "@/lib/auth";
import { UPLOAD_DIR } from "@/lib/media";

const MAX_FILES = 10;
const MAX_BYTES = 8 * 1024 * 1024;

function refresh() {
  revalidatePath("/gallery");
  revalidatePath("/admin/media");
}

function pickVisibility(formData) {
  return formData.get("visibility") === "players" ? "players" : "public";
}

export async function uploadPhotos(prevState, formData) {
  await requireAdmin();

  const files = formData.getAll("photos").filter((f) => f instanceof File && f.size > 0);
  const caption = String(formData.get("caption") || "").trim().slice(0, 200);
  const visibility = pickVisibility(formData);

  if (files.length === 0) return { error: "Choose at least one photo." };
  if (files.length > MAX_FILES) {
    return { error: `Maximum ${MAX_FILES} photos at a time.` };
  }

  await fs.mkdir(UPLOAD_DIR, { recursive: true });

  let saved = 0;
  const failed = [];

  for (const file of files) {
    if (file.size > MAX_BYTES) {
      failed.push(`${file.name} (over 8 MB)`);
      continue;
    }

    const id = crypto.randomUUID();
    const fullPath = path.join(UPLOAD_DIR, `${id}.webp`);
    const thumbPath = path.join(UPLOAD_DIR, `${id}-t.webp`);

    try {
      const input = Buffer.from(await file.arrayBuffer());
      // rotate() fixes phone orientation; metadata (GPS etc.) is dropped by default
      const base = sharp(input, { limitInputPixels: 60_000_000 }).rotate();

      await base
        .clone()
        .resize({ width: 1600, height: 1600, fit: "inside", withoutEnlargement: true })
        .webp({ quality: 80 })
        .toFile(fullPath);
      await base
        .clone()
        .resize({ width: 480, height: 480, fit: "inside", withoutEnlargement: true })
        .webp({ quality: 70 })
        .toFile(thumbPath);

      db.prepare(
        "INSERT INTO media (kind, filename, caption, visibility) VALUES ('photo', ?, ?, ?)"
      ).run(`${id}.webp`, caption, visibility);
      saved++;
    } catch {
      await fs.rm(fullPath, { force: true });
      await fs.rm(thumbPath, { force: true });
      failed.push(`${file.name} (not a supported image)`);
    }
  }

  refresh();

  if (saved === 0) return { error: `Nothing uploaded: ${failed.join(", ")}` };
  return {
    ok:
      `Uploaded ${saved} photo${saved === 1 ? "" : "s"} ✓` +
      (failed.length ? ` Skipped: ${failed.join(", ")}` : ""),
  };
}

export async function addVideo(prevState, formData) {
  await requireAdmin();

  const title = String(formData.get("title") || "").trim().slice(0, 200);
  const raw = String(formData.get("url") || "").trim();
  const visibility = pickVisibility(formData);

  if (!title) return { error: "Give the video a title." };

  let url;
  try {
    url = new URL(raw);
  } catch {
    return { error: "That is not a valid link. Start it with https://" };
  }
  if (url.protocol !== "https:" && url.protocol !== "http:") {
    return { error: "Links must start with https://" };
  }

  db.prepare(
    "INSERT INTO media (kind, url, caption, visibility) VALUES ('video', ?, ?, ?)"
  ).run(url.toString(), title, visibility);

  refresh();
  return { ok: "Video added ✓" };
}

export async function setMediaVisibility(formData) {
  await requireAdmin();
  const id = Number(formData.get("id"));
  const visibility = formData.get("visibility") === "players" ? "players" : "public";
  db.prepare("UPDATE media SET visibility = ? WHERE id = ?").run(visibility, id);
  refresh();
}

export async function deleteMedia(formData) {
  await requireAdmin();
  const id = Number(formData.get("id"));

  const row = db.prepare("SELECT * FROM media WHERE id = ?").get(id);
  if (!row) return;

  if (row.kind === "photo" && row.filename) {
    const thumb = row.filename.replace(".webp", "-t.webp");
    await fs.rm(path.join(UPLOAD_DIR, row.filename), { force: true });
    await fs.rm(path.join(UPLOAD_DIR, thumb), { force: true });
  }
  db.prepare("DELETE FROM media WHERE id = ?").run(id);
  refresh();
}