"use server";

import fs from "fs/promises";
import path from "path";
import crypto from "crypto";
import sharp from "sharp";
import { revalidatePath } from "next/cache";
import db from "@/lib/db";
import { requireAdmin } from "@/lib/auth";
import { UPLOAD_DIR } from "@/lib/media";

const MAX_BYTES = 8 * 1024 * 1024;

async function removeFiles(photo) {
  if (!photo) return;
  await fs.rm(path.join(UPLOAD_DIR, photo), { force: true });
  await fs.rm(path.join(UPLOAD_DIR, photo.replace(".webp", "-t.webp")), { force: true });
}

function refresh(id) {
  revalidatePath("/squad");
  revalidatePath(`/squad/${id}`);
  revalidatePath("/admin/squad");
  revalidatePath("/portal");
}

export async function uploadPlayerPhoto(prevState, formData) {
  await requireAdmin();

  const id = Number(formData.get("id"));
  const file = formData.get("photo");

  const player = db.prepare("SELECT id, photo FROM players WHERE id = ?").get(id);
  if (!player) return { error: "Player not found." };
  if (!(file instanceof File) || file.size === 0) return { error: "Choose a photo." };
  if (file.size > MAX_BYTES) return { error: "That photo is over 8 MB." };

  await fs.mkdir(UPLOAD_DIR, { recursive: true });
  const name = `p-${crypto.randomUUID()}`;
  const fullPath = path.join(UPLOAD_DIR, `${name}.webp`);
  const thumbPath = path.join(UPLOAD_DIR, `${name}-t.webp`);

  try {
    const input = Buffer.from(await file.arrayBuffer());
    // rotate() fixes phone orientation. The "attention" crop tries to keep the face.
    const base = sharp(input, { limitInputPixels: 60_000_000 }).rotate();

    await base
      .clone()
      .resize({ width: 800, height: 800, fit: "cover", position: sharp.strategy.attention })
      .webp({ quality: 82 })
      .toFile(fullPath);
    await base
      .clone()
      .resize({ width: 300, height: 300, fit: "cover", position: sharp.strategy.attention })
      .webp({ quality: 75 })
      .toFile(thumbPath);
  } catch {
    await fs.rm(fullPath, { force: true });
    await fs.rm(thumbPath, { force: true });
    return { error: "That file is not a supported image. Use JPG, PNG or WebP." };
  }

  db.prepare("UPDATE players SET photo = ? WHERE id = ?").run(`${name}.webp`, id);
  await removeFiles(player.photo);

  refresh(id);
  return { ok: "Photo saved ✓" };
}

export async function removePlayerPhoto(formData) {
  await requireAdmin();

  const id = Number(formData.get("id"));
  const player = db.prepare("SELECT photo FROM players WHERE id = ?").get(id);
  if (!player) return;

  db.prepare("UPDATE players SET photo = NULL WHERE id = ?").run(id);
  await removeFiles(player.photo);
  refresh(id);
}