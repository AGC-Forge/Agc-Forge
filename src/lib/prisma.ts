import { PrismaClient } from "../prisma/client"
import { PrismaPg } from "@prisma/adapter-pg";
import { withAccelerate } from "@prisma/extension-accelerate"

const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  throw new Error("DATABASE_URL is not set");
}

function createPrismaClient() {
  const logOptions = process.env.NODE_ENV === "development"
    ? ["query", "error", "warn"] as const
    : ["error"] as const;

  if (databaseUrl?.startsWith("prisma://")) {
    return new PrismaClient({
      accelerateUrl: databaseUrl,
      log: [...logOptions],
    }).$extends(withAccelerate());

  }

  const adapter = new PrismaPg({ connectionString: databaseUrl });
  return new PrismaClient({
    adapter,
    log: [...logOptions],
  }).$extends(withAccelerate());
}

type PrismaClientSingleton = ReturnType<typeof createPrismaClient>;

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClientSingleton | undefined;
};

export const prisma: PrismaClientSingleton = globalForPrisma.prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
