import { auth } from "@/auth";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { uploadToMinio, validateFile } from "@/lib/minio";

export const runtime = "nodejs";

// Limit body size Next.js (default 4MB, naikkan di next.config)
export const maxDuration = 60;

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let formData: FormData;
  try {
    formData = await req.formData();
  } catch {
    return NextResponse.json({ error: "Invalid form data" }, { status: 400 });
  }

  const messageId = formData.get("messageId") as string | null;
  const files = formData.getAll("files") as File[];

  if (!files || files.length === 0) {
    return NextResponse.json({ error: "Tidak ada file" }, { status: 400 });
  }

  if (files.length > 5) {
    return NextResponse.json({ error: "Maksimal 5 file per upload" }, { status: 400 });
  }

  // Verifikasi message jika diberikan
  if (messageId) {
    const message = await prisma.message.findFirst({
      where: {
        id: messageId,
        conversation: { userId: session.user.id },
      },
    });
    if (!message) {
      return NextResponse.json({ error: "Message tidak ditemukan" }, { status: 404 });
    }
  }

  const results: UploadedFile[] = [];
  const errors: { filename: string; error: string }[] = [];

  for (const file of files) {
    // ── Validasi ──────────────────────────────────────────────────────────
    const validation = validateFile(file.type, file.size, file.name);
    if (!validation.valid) {
      errors.push({ filename: file.name, error: validation.error! });
      continue;
    }

    try {
      // ── Konversi ke Buffer ─────────────────────────────────────────────
      const arrayBuffer = await file.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);

      // ── Upload ke MinIO ────────────────────────────────────────────────
      const uploadResult = await uploadToMinio({
        userId: session.user.id,
        originalFilename: file.name,
        mimeType: file.type,
        buffer,
        folder: "uploads",
      });

      // ── Simpan ke DB (jika ada messageId) ─────────────────────────────
      if (messageId) {
        await prisma.media.create({
          data: {
            message_id: messageId,
            bucket: uploadResult.bucket,
            object_key: uploadResult.object_key,
            url: uploadResult.url,
            type: uploadResult.type,
            filename: uploadResult.filename,
            original_filename: uploadResult.original_filename,
            size: uploadResult.size,
            mime_type: uploadResult.mime_type,
            is_generated: false,
          },
        });
      }

      results.push(uploadResult);
    } catch (err: any) {
      console.error(`[Upload] Error for ${file.name}:`, err);
      errors.push({ filename: file.name, error: err.message ?? "Upload gagal" });
    }
  }

  return NextResponse.json({
    success: true,
    data: {
      uploaded: results,
      errors,
      total: files.length,
      successCount: results.length,
      errorCount: errors.length,
    },
  });
}
