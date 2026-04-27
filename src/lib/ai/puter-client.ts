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
import { decrypt } from "@/lib/encryption";
import { prisma } from "@/lib/prisma";

let _puterInstance: ReturnType<typeof init> | null = null;

export const PUTER_AUTO_TOKEN_MODE =
  process.env.PUTER_GET_AUTO_TOKEN_FROM_LOGGED_USER === "true";

export const PUTER_API_BASE = "https://api.puter.com/puterai/openai/v1";
export const PUTER_AUTH_API = "https://api.puter.com";

export function getPuter() {
  if (!process.env.PUTER_AUTH_TOKEN) {
    throw new Error(
      "[Puter] PUTER_AUTH_TOKEN not found in environment variables.\n" +
      "How to get tokens:\n" +
      "  1. Login to https://puter.com\n" +
      "  2. Open DevTools → Console\n" +
      "  3. Type: localStorage.getItem('auth_token')"
    );
  }

  if (!_puterInstance) {
    _puterInstance = init(process.env.PUTER_AUTH_TOKEN);
  }

  return _puterInstance;
}

/**
 * Ambil token yang akan digunakan untuk Puter API calls.
 *
 * Mode 1 (static): ambil dari env PUTER_AUTH_TOKEN
 * Mode 2 (auto):   ambil dari DB puter_sessions berdasarkan userId
 */
export async function getPuterToken(userId?: string): Promise<string> {
  // Mode 2: Auto token dari user
  if (PUTER_AUTO_TOKEN_MODE) {
    if (!userId) {
      throw new Error(
        "[Puter] PUTER_GET_AUTO_TOKEN_FROM_LOGGED_USER=true but userId is not given."
      );
    }

    const session = await prisma.puterSession.findUnique({
      where: { userId },
    });

    if (!session || !session.is_valid) {
      throw new Error(
        "[Puter] User not connected to Puter."
      );
    }

    // Decrypt token
    const token = decrypt(session.token);
    return token;
  }

  // Mode static: prioritas token per-user (DB) bila userId tersedia
  if (userId) {
    const userSession = await prisma.puterSession.findUnique({
      where: { userId },
      select: { token: true, is_valid: true },
    });

    if (userSession?.is_valid) {
      return decrypt(userSession.token);
    }
  }

  // Fallback: static token global dari env
  const token = process.env.PUTER_AUTH_TOKEN;
  if (!token) {
    throw new Error(
      "[Puter] No usable token found.\n" +
      "Save Puter token in Account page (per-user) or set PUTER_AUTH_TOKEN in environment."
    );
  }

  return token;
}

/**
 * Build headers untuk Puter API dengan token yang benar
 */
export async function getPuterHeaders(userId?: string): Promise<Record<string, string>> {
  const token = await getPuterToken(userId);
  return {
    Authorization: `Bearer ${token}`,
    "Content-Type": "application/json",
  };
}
/**
 * Validasi token ke Puter API (getUser call)
 * Return user info atau null jika token invalid
 */
export async function validatePuterToken(token: string): Promise<{
  username: string;
  uuid: string;
  email_confirmed: number;
} | null> {
  try {
    const res = await fetch(`${PUTER_AUTH_API}/whoami`, {
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    });

    if (!res.ok) return null;
    const user = await res.json();
    if (!user?.uuid) return null;
    return user;
  } catch {
    return null;
  }
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
  userId?: string; // dibutuhkan untuk mode auto-token
}): Promise<Response> {
  const headers = await getPuterHeaders(params.userId);

  const response = await fetch(`${PUTER_API_BASE}/chat/completions`, {
    method: "POST",
    headers,
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

    // Token invalid / expired
    if (response.status === 401) {
      // Jika mode auto, invalidasi token di DB
      if (PUTER_AUTO_TOKEN_MODE && params.userId) {
        await invalidatePuterSession(params.userId);
      }
      throw new Error("Token Puter is invalid or has expired.");
    }

    if (response.status === 403) {
      throw new Error(
        `[Puter Chat] 403 permission_denied. Token valid, but this account/app has no access to model "${params.model}" or Puter AI API scope is not enabled.`
      );
    }

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
  userId?: string;
}): Promise<{ url: string }> {
  // Puter txt2img melalui REST API (bukan SDK untuk server-side)
  const headers = await getPuterHeaders(params.userId);

  if (params.testMode) {
    // Return placeholder untuk dev
    return { url: "https://picsum.photos/1024/1024" };
  }

  // Puter image generation via chat API dengan model image
  const res = await fetch(`${PUTER_API_BASE}/chat/completions`, {
    method: "POST",
    headers,
    body: JSON.stringify({
      model: params.model ?? "openai/dall-e-3",
      messages: [{ role: "user", content: params.prompt }],
      stream: false,
    }),
  });

  if (!res.ok) {
    if (res.status === 401 && PUTER_AUTO_TOKEN_MODE && params.userId) {
      await invalidatePuterSession(params.userId);
    }
    throw new Error(`[Puter Image] ${res.status}: ${await res.text()}`);
  }

  const data = await res.json();
  // Image response: data[0].url atau message.content
  const url =
    data?.data?.[0]?.url ??
    data?.choices?.[0]?.message?.content ??
    "";

  if (!url) throw new Error("[Puter Image] Format response unknown.");
  return { url };
}


/**
 * Generate video via Puter.js Node.js client
 */
export async function puterTxt2Vid(params: {
  prompt: string;
  model?: string;
  testMode?: boolean;
  userId?: string;
}): Promise<{ url: string }> {
  const headers = await getPuterHeaders(params.userId);

  if (params.testMode) {
    return { url: "https://www.w3schools.com/html/mov_bbb.mp4" };
  }

  const res = await fetch(`${PUTER_API_BASE}/chat/completions`, {
    method: "POST",
    headers,
    body: JSON.stringify({
      model: params.model ?? "bytedance/seedance-1.0-pro",
      messages: [{ role: "user", content: params.prompt }],
      stream: false,
    }),
  });

  if (!res.ok) {
    if (res.status === 401 && PUTER_AUTO_TOKEN_MODE && params.userId) {
      await invalidatePuterSession(params.userId);
    }
    throw new Error(`[Puter Video] ${res.status}: ${await res.text()}`);
  }

  const data = await res.json();
  const url =
    data?.data?.[0]?.url ??
    data?.choices?.[0]?.message?.content ??
    "";

  if (!url) throw new Error("[Puter Video] Format response unknown.");
  return { url };
}
/** Invalidasi token Puter user di DB */
export async function invalidatePuterSession(userId: string): Promise<void> {
  await prisma.puterSession
    .updateMany({
      where: { userId },
      data: { is_valid: false },
    })
    .catch(() => { }); // silent — jangan crash request
}

/** Simpan/update Puter token ke DB */
export async function savePuterSession(params: {
  userId: string;
  token: string; // plaintext — akan di-encrypt
  puter_username?: string;
  puter_uid?: string;
  app_uid?: string;
}): Promise<void> {
  const { encrypt } = await import("@/lib/encryption");
  const encryptedToken = encrypt(params.token);

  await prisma.puterSession.upsert({
    where: { userId: params.userId },
    create: {
      userId: params.userId,
      token: encryptedToken,
      puter_username: params.puter_username ?? null,
      puter_uid: params.puter_uid ?? null,
      app_uid: params.app_uid ?? null,
      is_valid: true,
      validated_at: new Date(),
    },
    update: {
      token: encryptedToken,
      puter_username: params.puter_username ?? undefined,
      puter_uid: params.puter_uid ?? undefined,
      app_uid: params.app_uid ?? undefined,
      is_valid: true,
      validated_at: new Date(),
    },
  });
}

/** Ambil info Puter session user (untuk ditampilkan di UI) */
export async function getPuterSessionInfo(userId: string): Promise<{
  connected: boolean;
  puter_username?: string | null;
  puter_uid?: string | null;
  validated_at?: Date | null;
  chat_ready?: boolean;
  reason?: string;
} | null> {
  const session = await prisma.puterSession.findUnique({
    where: { userId },
    select: {
      token: true,
      is_valid: true,
      puter_username: true,
      puter_uid: true,
      validated_at: true,
    },
  });

  if (!session) return { connected: false };

  let chatReady = false;
  let reason: string | undefined;

  if (session.is_valid) {
    try {
      const token = decrypt(session.token);
      const res = await fetch(`${PUTER_API_BASE}/chat/completions`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: process.env.PUTER_CHAT_TEST_MODEL ?? "openai/gpt-4o-mini",
          messages: [{ role: "user", content: "ping" }],
          stream: false,
          max_tokens: 1,
          temperature: 0,
        }),
      });

      if (res.ok) {
        chatReady = true;
      } else {
        const text = await res.text();
        reason = `[${res.status}] ${text}`;
      }
    } catch (err: any) {
      reason = err?.message ?? "Failed to verify token permission.";
    }
  } else {
    reason = "Stored Puter token is marked invalid.";
  }

  return {
    connected: session.is_valid,
    puter_username: session.puter_username,
    puter_uid: session.puter_uid,
    validated_at: session.validated_at,
    chat_ready: chatReady,
    reason,
  };
}
