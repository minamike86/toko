// src/shared/prisma.ts
import { PrismaClient } from "@prisma/client";

/**
 * Prisma Client singleton
 *
 * Digunakan untuk:
 * - Reporting (MVP Step 3)
 * - Integration test berbasis database
 *
 * DILARANG:
 * - Dipakai langsung oleh domain layer
 * - Dipakai di use case mutasi Step 1 & 2
 *
 * Keputusan ini dikunci di:
 * docs/03-mvp/MVP-step-3/architecture/prisma-client-and-reporting-test-db-strategy.md
 */

const globalForPrisma = globalThis as unknown as {
  prisma?: PrismaClient;
};

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log:
      process.env.NODE_ENV === "development"
        ? ["query", "error", "warn"]
        : ["error"],
  });

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}

export default prisma;
