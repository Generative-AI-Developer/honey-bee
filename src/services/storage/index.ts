import "server-only";
import { randomBytes } from "node:crypto";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { v2 as cloudinary } from "cloudinary";
import { env, isProd } from "@/lib/env";

// Image storage: Cloudinary when configured (CDN + automatic resizing), otherwise the
// local public/uploads folder (development only — files there are not backed up).

export const ALLOWED_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp", "image/avif"] as const;
export const MAX_UPLOAD_BYTES = 5 * 1024 * 1024;

const useCloudinary = Boolean(env.CLOUDINARY_CLOUD_NAME && env.CLOUDINARY_API_KEY && env.CLOUDINARY_API_SECRET);
if (useCloudinary) {
  cloudinary.config({ cloud_name: env.CLOUDINARY_CLOUD_NAME, api_key: env.CLOUDINARY_API_KEY, api_secret: env.CLOUDINARY_API_SECRET, secure: true });
}

export type StoredFile = { url: string; publicId: string | null };

/** Sniffs the real file type from magic bytes so a renamed script can't pass as an image. */
function detectImageType(buf: Buffer): (typeof ALLOWED_IMAGE_TYPES)[number] | null {
  if (buf[0] === 0xff && buf[1] === 0xd8 && buf[2] === 0xff) return "image/jpeg";
  if (buf.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))) return "image/png";
  if (buf.subarray(0, 4).toString() === "RIFF" && buf.subarray(8, 12).toString() === "WEBP") return "image/webp";
  if (buf.subarray(4, 12).toString() === "ftypavif") return "image/avif";
  return null;
}

export async function storeImage(file: File, folder: "products" | "categories" | "banners" | "receipts" | "videos"): Promise<StoredFile> {
  if (file.size === 0) throw new Error("The file is empty.");
  if (file.size > MAX_UPLOAD_BYTES) throw new Error("Images must be 5 MB or smaller.");
  const buf = Buffer.from(await file.arrayBuffer());
  const type = detectImageType(buf);
  if (!type) throw new Error("Please upload a JPG, PNG, WebP or AVIF image.");

  const name = randomBytes(16).toString("hex");

  if (useCloudinary) {
    const res = await new Promise<{ secure_url: string; public_id: string }>((resolve, reject) => {
      cloudinary.uploader
        .upload_stream({ folder: `honeybee/${folder}`, public_id: name, resource_type: "image", overwrite: false }, (err, result) =>
          err || !result ? reject(err ?? new Error("Upload failed")) : resolve(result),
        )
        .end(buf);
    });
    return { url: res.secure_url, publicId: res.public_id };
  }

  if (isProd) throw new Error("Image uploads need Cloudinary to be configured (see .env.example).");
  const dir = path.join(process.cwd(), "public", "uploads", folder);
  await mkdir(dir, { recursive: true });
  const ext = type.split("/")[1];
  await writeFile(path.join(dir, `${name}.${ext}`), buf);
  return { url: `/uploads/${folder}/${name}.${ext}`, publicId: null };
}

export async function deleteImage(publicId: string | null | undefined) {
  if (!publicId || !useCloudinary) return;
  await cloudinary.uploader.destroy(publicId).catch((e) => console.error("[storage] delete failed", publicId, e));
}

// ───────────── videos ─────────────

export const MAX_VIDEO_BYTES = 60 * 1024 * 1024;

function detectVideoType(buf: Buffer): "video/mp4" | "video/webm" | null {
  if (buf.subarray(4, 8).toString() === "ftyp") return "video/mp4"; // MP4 / MOV-family container
  if (buf.subarray(0, 4).equals(Buffer.from([0x1a, 0x45, 0xdf, 0xa3]))) return "video/webm";
  return null;
}

/** Stores a short video (MP4 or WebM, ≤ 60 MB). Cloudinary when configured, else public/uploads (dev). */
export async function storeVideo(file: File): Promise<StoredFile> {
  if (file.size === 0) throw new Error("The file is empty.");
  if (file.size > MAX_VIDEO_BYTES) throw new Error("Videos must be 60 MB or smaller. Shorter clips load faster for shoppers.");
  const buf = Buffer.from(await file.arrayBuffer());
  const type = detectVideoType(buf);
  if (!type) throw new Error("Please upload an MP4 or WebM video.");
  const name = randomBytes(16).toString("hex");

  if (useCloudinary) {
    const res = await new Promise<{ secure_url: string; public_id: string }>((resolve, reject) => {
      cloudinary.uploader
        .upload_stream({ folder: "honeybee/videos", public_id: name, resource_type: "video", overwrite: false }, (err, result) =>
          err || !result ? reject(err ?? new Error("Upload failed")) : resolve(result),
        )
        .end(buf);
    });
    return { url: res.secure_url, publicId: res.public_id };
  }

  if (isProd) throw new Error("Video uploads need Cloudinary to be configured (see .env.example).");
  const dir = path.join(process.cwd(), "public", "uploads", "videos");
  await mkdir(dir, { recursive: true });
  const ext = type === "video/mp4" ? "mp4" : "webm";
  await writeFile(path.join(dir, `${name}.${ext}`), buf);
  return { url: `/uploads/videos/${name}.${ext}`, publicId: null };
}
