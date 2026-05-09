import * as PrismaClientPackage from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";

const { PrismaClient } = PrismaClientPackage;

const globalForPrisma = globalThis;

function createUnavailablePrismaClient(reason) {
  const throwingHandler = {
    get() {
      return new Proxy(
        () => {
          throw new Error(reason);
        },
        throwingHandler
      );
    },
    apply() {
      throw new Error(reason);
    },
  };

  return new Proxy(
    () => {
      throw new Error(reason);
    },
    throwingHandler
  );
}

function createPrismaClient() {
  if (!PrismaClient) {
    return createUnavailablePrismaClient(
      "PrismaClient is unavailable. Ensure `prisma generate` runs before the build and runtime start."
    );
  }

  const connectionString = process.env.DATABASE_URL;

  if (!connectionString) {
    return createUnavailablePrismaClient(
      "DATABASE_URL is not set. Configure it in Vercel Environment Variables."
    );
  }

  try {
    const adapter = new PrismaPg(new Pool({ connectionString }));

    return new PrismaClient({
      adapter,
      log: ["warn", "error"],
    });
  } catch (error) {
    console.error("[prisma] Failed to initialize client", error);
    return createUnavailablePrismaClient(
      "Failed to initialize Prisma client. Check database credentials and Prisma setup."
    );
  }
}

export const prisma = globalForPrisma.prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
