import Redis from "ioredis";

const globalForRedis = globalThis as unknown as {
  redis: Redis | undefined;
  redisSub: Redis | undefined;
};

function createRedisClient() {
  const client = new Redis(process.env.REDIS_URL || "redis://localhost:6379", {
    maxRetriesPerRequest: 3,
    retryStrategy: (times) => Math.min(times * 100, 3000),
    lazyConnect: true,
  });

  client.on("error", (err) => {
    // Jangan crash server jika Redis tidak tersedia
    if (process.env.NODE_ENV === "development") {
      console.warn("[Redis] Connection error:", err.message);
    }
  });

  return client;
}

// Publisher client
export const redis: Redis =
  globalForRedis.redis ?? createRedisClient();

// Subscriber client (terpisah — ioredis requirement)
export const redisSub: Redis =
  globalForRedis.redisSub ?? createRedisClient();

if (process.env.NODE_ENV !== "production") {
  globalForRedis.redis = redis;
  globalForRedis.redisSub = redisSub;
}

// ── Job Progress Helpers ──────────────────────────────────────────────────────

export const JOB_TTL = 60 * 60 * 24; // 24 jam

export interface JobProgress {
  jobId: string;
  status: "PENDING" | "PROCESSING" | "COMPLETED" | "FAILED" | "CANCELLED";
  progress: number; // 0-100
  result_url?: string;
  error_message?: string;
  updated_at: string;
}

/** Simpan progress job ke Redis */
export async function setJobProgress(
  jobId: string,
  data: Omit<JobProgress, "jobId" | "updated_at">
): Promise<void> {
  try {
    const key = `job:${jobId}`;
    const payload: JobProgress = {
      jobId,
      ...data,
      updated_at: new Date().toISOString(),
    };
    await redis.setex(key, JOB_TTL, JSON.stringify(payload));
    // Publish ke channel untuk SSE listeners
    await redis.publish(`job:progress`, JSON.stringify(payload));
  } catch (err) {
    console.error("[Redis] setJobProgress error:", err);
  }
}

/** Ambil progress job dari Redis */
export async function getJobProgress(jobId: string): Promise<JobProgress | null> {
  try {
    const raw = await redis.get(`job:${jobId}`);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

/** Hapus job dari Redis */
export async function deleteJobProgress(jobId: string): Promise<void> {
  try {
    await redis.del(`job:${jobId}`);
  } catch { }
}
