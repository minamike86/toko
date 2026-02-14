import { execSync } from "child_process";
import { PrismaClient } from "@prisma/client";

import { randomUUID } from "crypto";

const SALES_SCHEMA = `toko_test_sales_${randomUUID().replace(/-/g, "")}`;
const DATABASE_URL = process.env.DATABASE_URL!;

/**
 * Bootstrap DB schema khusus SALES integration test
 * - Drop schema
 * - Create schema
 * - Apply prisma schema
 */
function bootstrapSalesSchema() {
  execSync(
    `
    echo "DROP DATABASE IF EXISTS ${SALES_SCHEMA};
    CREATE DATABASE ${SALES_SCHEMA};"
    | npx prisma db execute --url="${DATABASE_URL}"
    `,
    { stdio: "inherit" }
  );

  execSync(
    `
    npx prisma db push \
      --schema=prisma/schema.prisma \
      --accept-data-loss \
      --url="${DATABASE_URL}/${SALES_SCHEMA}"
    `,
    { stdio: "inherit" }
  );
}

// dijalankan SEKALI saat file di-import
bootstrapSalesSchema();

export const salesPrisma = new PrismaClient({
  datasources: {
    db: {
      url: `${DATABASE_URL}/${SALES_SCHEMA}`,
    },
  },
});
