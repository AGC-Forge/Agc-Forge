/**
 * Puter.js Server-Side Client
 *
 * Puter mendukung 2 mode:
 *   1. Browser  — user login ke puter.com sendiri (gratis, User-Pays Model)
 *   2. Node.js  — init() dengan PUTER_AUTH_TOKEN dari akun developer
 *
 * Di Next.js API Routes (server-side), kita pakai mode Node.js.
 * REST API Puter juga tersedia di: https://api.puter.com/puterai/openai/v1
 */

import { init } from "@heyputer/puter.js/src/init.cjs";

let _puterInstance: ReturnType<typeof init> | null = null;

export function getPuter() {
  if (!process.env.PUTER_AUTH_TOKEN) {
    throw new Error(
      "[Puter] PUTER_AUTH_TOKEN tidak ditemukan di environment variables.\n" +
      "Cara mendapatkan token:\n" +
      "  1. Login ke https://puter.com\n" +
      "  2. Buka DevTools → Console\n" +
      "  3. Ketik: localStorage.getItem('auth_token')"
    );
  }

  if (!_puterInstance) {
    _puterInstance = init(process.env.PUTER_AUTH_TOKEN);
  }

  return _puterInstance;
}

// ── Puter REST API (OpenAI-compatible) ────────────────────────────────────────

export const PUTER_API_BASE = "https://api.puter.com/puterai/openai/v1";

export function getPuterHeaders(): Record<string, string> {
  if (!process.env.PUTER_AUTH_TOKEN) {
    throw new Error("[Puter] PUTER_AUTH_TOKEN tidak ditemukan.");
  }
  return {
    "Authorization": `Bearer ${process.env.PUTER_AUTH_TOKEN}`,
    "Content-Type": "application/json",
  };
}

/**
 * Stream chat completion via Puter REST API (OpenAI-compatible format)
 * Mendukung semua model: anthropic/*, openai/*, google/*, xai/*, dll.
 */
export async function puterChatStream(params: {
  model: string;
  messages: Array<{ role: string; content: string | any[] }>;
  max_tokens?: number;
  temperature?: number;
}): Promise<Response> {
  const response = await fetch(`${PUTER_API_BASE}/chat/completions`, {
    method: "POST",
    headers: getPuterHeaders(),
    body: JSON.stringify({
      model: params.model,
      messages: params.messages,
      stream: true,
      max_tokens: params.max_tokens ?? 4096,
      temperature: params.temperature ?? 0.7,
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`[Puter Chat] ${response.status}: ${errorText}`);
  }

  return response;
}

/**
 * Generate image via Puter.js Node.js client
 */
export async function puterTxt2Img(params: {
  prompt: string;
  model?: string;
  testMode?: boolean;
}): Promise<{ url: string; blob?: Blob }> {
  const puter = getPuter();

  // puter.ai.txt2img returns an HTMLImageElement in browser,
  // or an object with URL in Node.js
  const result = await (puter.ai as any).txt2img(
    params.prompt,
    params.testMode ?? false,
    { model: params.model }
  );

  // Handle berbagai format response
  if (typeof result === "string") {
    return { url: result };
  }
  if (result?.src) {
    return { url: result.src };
  }
  if (result?.url) {
    return { url: result.url };
  }

  throw new Error("[Puter] Format response txt2img tidak dikenali");
}

/**
 * Generate video via Puter.js Node.js client
 */
export async function puterTxt2Vid(params: {
  prompt: string;
  model?: string;
  testMode?: boolean;
}): Promise<{ url: string }> {
  const puter = getPuter();

  const result = await (puter.ai as any).txt2vid(
    params.prompt,
    params.testMode ?? false,
    { model: params.model }
  );

  if (typeof result === "string") return { url: result };
  if (result?.src) return { url: result.src };
  if (result?.url) return { url: result.url };

  throw new Error("[Puter] Format response txt2vid tidak dikenali");
}
