import * as Minio from "minio";
import { randomUUID } from "crypto";
import path from "path";

const globalForMinio = globalThis as unknown as {
  minioClient: Minio.Client | undefined;
};

export const minioClient: Minio.Client =
  globalForMinio.minioClient ??
  new Minio.Client({
    endPoint: process.env.MINIO_ENDPOINT || "localhost",
    port: parseInt(process.env.MINIO_PORT || "9000"),
    useSSL: process.env.MINIO_USE_SSL === "true",
    accessKey: process.env.MINIO_ACCESS_KEY || "",
    secretKey: process.env.MINIO_SECRET_KEY || "",
  });

if (process.env.NODE_ENV !== "production") {
  globalForMinio.minioClient = minioClient;
}

export const MINIO_BUCKET = process.env.MINIO_BUCKET || "aichat-media";

/** Presigned URL expire time: 7 hari */
export const PRESIGNED_URL_EXPIRY = 7 * 24 * 60 * 60;

// ── MIME type → MediaType mapping ─────────────────────────────────────────────
export function detectMediaType(mimeType: string): MediaType {
  if (mimeType.startsWith("image/")) return "IMAGE";
  if (mimeType.startsWith("video/")) return "VIDEO";
  if (mimeType.startsWith("audio/")) return "AUDIO";
  if (
    mimeType.includes("pdf") ||
    mimeType.includes("word") ||
    mimeType.includes("document") ||
    mimeType === "text/plain" ||
    mimeType === "text/markdown"
  )
    return "DOCUMENT";
  if (
    mimeType.includes("javascript") ||
    mimeType.includes("typescript") ||
    mimeType.includes("python") ||
    mimeType.includes("html") ||
    mimeType.includes("css") ||
    mimeType.includes("json") ||
    mimeType.includes("yaml") ||
    mimeType.includes("xml")
  )
    return "CODE";
  return "DOCUMENT";
}

/** Extension file yang diizinkan */
export const ALLOWED_EXTENSIONS: Record<MediaType, string[]> = {
  IMAGE: [".jpg", ".jpeg", ".png", ".gif", ".webp", ".svg"],
  VIDEO: [".mp4", ".webm", ".mov"],
  AUDIO: [".mp3", ".wav", ".ogg", ".m4a"],
  DOCUMENT: [".pdf", ".doc", ".docx", ".txt", ".md"],
  CODE: [".html", ".css", ".js", ".ts", ".jsx", ".tsx", ".json", ".yaml", ".yml", ".py", ".sh"],
  ARCHIVE: [".zip", ".tar", ".gz"],
};

/** Max file size per tipe (bytes) */
export const MAX_FILE_SIZE: Record<MediaType, number> = {
  IMAGE: 10 * 1024 * 1024,   // 10 MB
  VIDEO: 500 * 1024 * 1024,  // 500 MB
  AUDIO: 50 * 1024 * 1024,   // 50 MB
  DOCUMENT: 20 * 1024 * 1024,   // 20 MB
  CODE: 5 * 1024 * 1024,    // 5 MB
  ARCHIVE: 100 * 1024 * 1024,  // 100 MB
};

// ── Bucket Setup ──────────────────────────────────────────────────────────────

/** Buat bucket jika belum ada + set policy public read untuk media */
export async function ensureBucketExists(bucket: string = MINIO_BUCKET): Promise<void> {
  const exists = await minioClient.bucketExists(bucket);
  if (!exists) {
    await minioClient.makeBucket(bucket, process.env.MINIO_REGION || "us-east-1");

    // Set policy public read untuk akses URL langsung
    const policy = {
      Version: "2012-10-17",
      Statement: [
        {
          Effect: "Allow",
          Principal: { AWS: ["*"] },
          Action: ["s3:GetObject"],
          Resource: [`arn:aws:s3:::${bucket}/*`],
        },
      ],
    };
    await minioClient.setBucketPolicy(bucket, JSON.stringify(policy));
    console.log(`[MinIO] Bucket "${bucket}" created with public read policy`);
  }
}

// ── Upload ────────────────────────────────────────────────────────────────────

export interface UploadOptions {
  userId: string;
  originalFilename: string;
  mimeType: string;
  buffer: Buffer;
  folder?: string;   // subfolder opsional, default: "uploads"
}

export interface UploadResult {
  bucket: string;
  object_key: string;
  url: string;
  filename: string;
  original_filename: string;
  size: number;
  mime_type: string;
  type: MediaType;
}

/** Upload file ke MinIO, return metadata untuk disimpan ke DB */
export async function uploadToMinio(opts: UploadOptions): Promise<UploadResult> {
  await ensureBucketExists();

  const ext = path.extname(opts.originalFilename).toLowerCase();
  const uuid = randomUUID();
  const filename = `${uuid}${ext}`;
  const folder = opts.folder || "uploads";
  const object_key = `${folder}/${opts.userId}/${filename}`;

  await minioClient.putObject(MINIO_BUCKET, object_key, opts.buffer, opts.buffer.length, {
    "Content-Type": opts.mimeType,
    "x-amz-meta-original-filename": opts.originalFilename,
    "x-amz-meta-user-id": opts.userId,
  });

  const url = buildPublicUrl(object_key);
  const type = detectMediaType(opts.mimeType);

  return {
    bucket: MINIO_BUCKET,
    object_key,
    url,
    filename,
    original_filename: opts.originalFilename,
    size: opts.buffer.length,
    mime_type: opts.mimeType,
    type,
  };
}

/** Upload file dari URL eksternal (hasil generate AI) ke MinIO */
export async function uploadFromUrl(opts: {
  url: string;
  userId: string;
  filename?: string;
  folder?: string;
  mimeType?: string;
}): Promise<UploadResult> {
  await ensureBucketExists();

  const response = await fetch(opts.url);
  if (!response.ok) {
    throw new Error(`[MinIO] Gagal fetch URL: ${response.statusText}`);
  }

  const buffer = Buffer.from(await response.arrayBuffer());
  const contentType = opts.mimeType || response.headers.get("content-type") || "application/octet-stream";

  // Tentukan ekstensi dari content-type atau URL
  let ext = "";
  if (contentType.includes("jpeg") || contentType.includes("jpg")) ext = ".jpg";
  else if (contentType.includes("png")) ext = ".png";
  else if (contentType.includes("webp")) ext = ".webp";
  else if (contentType.includes("gif")) ext = ".gif";
  else if (contentType.includes("mp4")) ext = ".mp4";
  else if (contentType.includes("webm")) ext = ".webm";
  else if (opts.url.includes(".")) {
    ext = path.extname(opts.url.split("?")[0]);
  }

  const uuid = randomUUID();
  const filename = opts.filename || `${uuid}${ext}`;
  const folder = opts.folder || "generated";
  const object_key = `${folder}/${opts.userId}/${filename}`;

  await minioClient.putObject(MINIO_BUCKET, object_key, buffer, buffer.length, {
    "Content-Type": contentType,
  });

  const url = buildPublicUrl(object_key);
  const type = detectMediaType(contentType);

  return {
    bucket: MINIO_BUCKET,
    object_key,
    url,
    filename,
    original_filename: opts.filename || filename,
    size: buffer.length,
    mime_type: contentType,
    type,
  };
}

// ── Delete ────────────────────────────────────────────────────────────────────

/** Hapus object dari MinIO */
export async function deleteFromMinio(object_key: string, bucket: string = MINIO_BUCKET): Promise<void> {
  try {
    await minioClient.removeObject(bucket, object_key);
  } catch (error) {
    console.error(`[MinIO] Gagal hapus object ${object_key}:`, error);
  }
}

/** Hapus banyak object sekaligus */
export async function deleteManyFromMinio(
  object_keys: string[],
  bucket: string = MINIO_BUCKET
): Promise<void> {
  if (object_keys.length === 0) return;
  const objects = object_keys.map((name) => ({ name }));
  await minioClient.removeObjects(bucket, objects);
}

// ── Presigned URL ─────────────────────────────────────────────────────────────

/** Generate presigned URL untuk akses private object (expire 7 hari) */
export async function getPresignedUrl(
  object_key: string,
  bucket: string = MINIO_BUCKET,
  expiry: number = PRESIGNED_URL_EXPIRY
): Promise<string> {
  return minioClient.presignedGetObject(bucket, object_key, expiry);
}

/** Generate presigned URL untuk upload langsung dari client (bypass server) */
export async function getPresignedUploadUrl(
  object_key: string,
  bucket: string = MINIO_BUCKET,
  expiry: number = 60 * 60 // 1 jam
): Promise<string> {
  return minioClient.presignedPutObject(bucket, object_key, expiry);
}

// ── URL Builder ───────────────────────────────────────────────────────────────

/** Build public URL untuk object (jika bucket adalah public) */
export function buildPublicUrl(object_key: string, bucket: string = MINIO_BUCKET): string {
  const endpoint = process.env.MINIO_ENDPOINT || "localhost";
  const port = process.env.MINIO_PORT || "9000";
  const ssl = process.env.MINIO_USE_SSL === "true";
  const publicUrl = process.env.MINIO_PUBLIC_URL;

  if (publicUrl) {
    return `${publicUrl}/${bucket}/${object_key}`;
  }

  const protocol = ssl ? "https" : "http";
  return `${protocol}://${endpoint}:${port}/${bucket}/${object_key}`;
}

// ── Validation ────────────────────────────────────────────────────────────────

/** Validasi file sebelum upload */
export function validateFile(
  mimeType: string,
  size: number,
  filename: string
): { valid: boolean; error?: string } {
  const type = detectMediaType(mimeType);
  const maxSize = MAX_FILE_SIZE[type];
  const ext = path.extname(filename).toLowerCase();
  const allowedExts = ALLOWED_EXTENSIONS[type];

  if (size > maxSize) {
    const maxMB = Math.round(maxSize / 1024 / 1024);
    return { valid: false, error: `Ukuran file maksimal ${maxMB}MB untuk tipe ${type}.` };
  }

  if (!allowedExts.includes(ext)) {
    return {
      valid: false,
      error: `Ekstensi "${ext}" tidak diizinkan. Gunakan: ${allowedExts.join(", ")}`,
    };
  }

  return { valid: true };
}
