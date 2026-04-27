/**
 * AES-256-GCM Encryption untuk UserApiKey
 * ENCRYPTION_KEY harus 32 karakter hex (64 hex chars)
 * Generate: openssl rand -hex 32
 */

import { createCipheriv, createDecipheriv, randomBytes, timingSafeEqual } from "crypto";

const ALGORITHM = "aes-256-gcm";
const KEY_LENGTH = 32; // bytes
const IV_LENGTH = 16;  // bytes
const TAG_LENGTH = 16; // bytes

function getKey(): Buffer {
  const keyHex = process.env.ENCRYPTION_KEY;
  if (!keyHex) {
    throw new Error(
      "[Encryption] ENCRYPTION_KEY not found in the environment.\n" +
      "Generate with: openssl rand -hex 32"
    );
  }
  const key = Buffer.from(keyHex, "hex");
  if (key.length !== KEY_LENGTH) {
    throw new Error(
      `[Encryption] ENCRYPTION_KEY must be 64 hex chars (32 bytes). Got ${key.length} bytes.`
    );
  }
  return key;
}

/**
 * Encrypt teks menjadi format: iv:tag:ciphertext (hex)
 */
export function encrypt(plaintext: string): string {
  const key = getKey();
  const iv = randomBytes(IV_LENGTH);
  const cipher = createCipheriv(ALGORITHM, key, iv);

  const encrypted = Buffer.concat([
    cipher.update(plaintext, "utf8"),
    cipher.final(),
  ]);
  const tag = cipher.getAuthTag();

  // Format: hex(iv):hex(tag):hex(ciphertext)
  return `${iv.toString("hex")}:${tag.toString("hex")}:${encrypted.toString("hex")}`;
}

/**
 * Decrypt format iv:tag:ciphertext kembali ke plaintext
 */
export function decrypt(ciphertext: string): string {
  const key = getKey();
  const parts = ciphertext.split(":");

  if (parts.length !== 3) {
    throw new Error("[Encryption] Format ciphertext is invalid");
  }

  const [ivHex, tagHex, encryptedHex] = parts;
  const iv = Buffer.from(ivHex, "hex");
  const tag = Buffer.from(tagHex, "hex");
  const encrypted = Buffer.from(encryptedHex, "hex");

  const decipher = createDecipheriv(ALGORITHM, key, iv);
  decipher.setAuthTag(tag);

  const decrypted = Buffer.concat([decipher.update(encrypted), decipher.final()]);
  return decrypted.toString("utf8");
}

/**
 * Mask API key untuk ditampilkan (tampilkan hanya 4 char terakhir)
 * e.g. "sk-abc...xyz1234" → "••••••••••••1234"
 */
export function maskApiKey(key: string): string {
  if (key.length <= 8) return "••••••••";
  return "•".repeat(Math.max(8, key.length - 4)) + key.slice(-4);
}

/**
 * Validasi format API key (minimal 8 karakter printable)
 */
export function isValidApiKey(key: string): boolean {
  return typeof key === "string" && key.trim().length >= 8;
}
