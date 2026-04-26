import { PrismaClient } from "../prisma/client"
import { PrismaPg } from "@prisma/adapter-pg";
import { withAccelerate } from "@prisma/extension-accelerate"

const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  throw new Error("DATABASE_URL is not set");
}

const adapter = new PrismaPg({ connectionString: databaseUrl });

let prismaClient: PrismaClient;

if (databaseUrl.startsWith("prisma://")) {
  prismaClient = new PrismaClient({ accelerateUrl: databaseUrl });
} else {
  prismaClient = new PrismaClient({ adapter });
}

const prisma = prismaClient.$extends(withAccelerate());
export { prisma };

