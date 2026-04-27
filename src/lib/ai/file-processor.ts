/**
 * File Processor
 * Mengubah file upload menjadi format yang bisa dikonsumsi AI
 */

const TEXT_MIME_TYPES = new Set([
  "text/plain",
  "text/markdown",
  "text/html",
  "text/css",
  "text/javascript",
  "text/x-python",
  "text/x-typescript",
  "application/json",
  "application/yaml",
  "text/yaml",
  "text/csv",
]);

const IMAGE_MIME_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/gif",
  "image/webp",
  "image/svg+xml",
]);

const DOCUMENT_MIME_TYPES = new Set([
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
]);

export type ProcessedFile =
  | { type: "image_url"; url: string; filename: string }
  | { type: "text"; content: string; filename: string }
  | { type: "unsupported"; filename: string; mime: string };

/**
 * Proses file dari URL (sudah di-upload ke MinIO) menjadi konten AI
 */
export async function processFileForAI(
  url: string,
  filename: string,
  mimeType: string
): Promise<ProcessedFile> {
  // ── Image: kirim sebagai image_url ──────────────────────────────────────
  if (IMAGE_MIME_TYPES.has(mimeType)) {
    return { type: "image_url", url, filename };
  }

  // ── Text / Code: ambil konten dan embed sebagai text ────────────────────
  if (TEXT_MIME_TYPES.has(mimeType) || filename.match(/\.(ts|tsx|jsx|py|sh|sql|xml|env)$/i)) {
    try {
      const res = await fetch(url);
      const text = await res.text();
      const ext = filename.split(".").pop()?.toUpperCase() ?? "TEXT";
      return {
        type: "text",
        content: `[File: ${filename}]\n\`\`\`${ext.toLowerCase()}\n${text.slice(0, 30000)}\n\`\`\``,
        filename,
      };
    } catch {
      return { type: "unsupported", filename, mime: mimeType };
    }
  }

  // ── PDF: beri tahu AI ada attachment (basic, tanpa OCR) ────────────────
  if (DOCUMENT_MIME_TYPES.has(mimeType)) {
    return {
      type: "text",
      content: `[Dokumen terlampir: ${filename}. Pengguna melampirkan file PDF/dokumen ini. Beritahu mereka jika kamu tidak bisa membacanya secara langsung, dan minta mereka copy-paste teksnya.]`,
      filename,
    };
  }

  return { type: "unsupported", filename, mime: mimeType };
}

/**
 * Bangun messages array OpenAI format dari text + files
 */
export function buildMessagesWithFiles(params: {
  textContent: string;
  processedFiles: ProcessedFile[];
  history: Array<{ role: string; content: string }>;
  systemPrompt?: string;
}): Array<{ role: string; content: string | any[] }> {
  const messages: Array<{ role: string; content: string | any[] }> = [];

  // System prompt
  if (params.systemPrompt) {
    messages.push({ role: "system", content: params.systemPrompt });
  }

  // History
  for (const h of params.history) {
    messages.push({ role: h.role, content: h.content });
  }

  // Current user message
  const hasFiles = params.processedFiles.length > 0;
  if (!hasFiles) {
    messages.push({ role: "user", content: params.textContent });
    return messages;
  }

  // Multi-part content dengan files
  const contentParts: any[] = [];

  // Text part
  if (params.textContent) {
    contentParts.push({ type: "text", text: params.textContent });
  }

  // File parts
  for (const file of params.processedFiles) {
    if (file.type === "image_url") {
      contentParts.push({
        type: "image_url",
        image_url: { url: file.url },
      });
    } else if (file.type === "text") {
      contentParts.push({ type: "text", text: file.content });
    } else {
      contentParts.push({
        type: "text",
        text: `[File tidak didukung: ${file.filename} (${file.mime})]`,
      });
    }
  }

  messages.push({ role: "user", content: contentParts });
  return messages;
}
