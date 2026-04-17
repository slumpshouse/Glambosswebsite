import * as PrismaClientPackage from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";

type PrismaClientInstance = typeof PrismaClientPackage extends {
  PrismaClient: new (...args: never[]) => infer Client;
}
  ? Client
  : any;

const { PrismaClient } = PrismaClientPackage as unknown as {
  PrismaClient?: new (options?: {
    adapter?: PrismaPg;
    log?: Array<"warn" | "error">;
  }) => PrismaClientInstance;
};

const globalForPrisma = globalThis as unknown as {
  prisma?: PrismaClientInstance;
};

function createPrismaClient(): PrismaClientInstance {
  if (!PrismaClient) {
    throw new Error(
      "PrismaClient is unavailable. Ensure `prisma generate` runs before the build and runtime start."
    );
  }

  const connectionString = process.env.DATABASE_URL;

  if (!connectionString) {
    throw new Error("DATABASE_URL is not set.");
  }

  const adapter = new PrismaPg(new Pool({ connectionString }));

  return new PrismaClient({
    adapter,
    log: ["warn", "error"],
  });
}

export const prisma = globalForPrisma.prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
