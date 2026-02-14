import { execSync } from "child_process";
import { PrismaClient } from "@prisma/client";

import { randomUUID } from "crypto";

const REPORTING_SCHEMA = `toko_test_reporting_${randomUUID().replace(/-/g, "")}`;
const DATABASE_URL = process.env.DATABASE_URL!;

/**
 * Bootstrap DB schema khusus REPORTING integration test
 * - Drop schema
 * - Create schema
 * - Apply prisma schema
 */
function bootstrapReportingSchema() {
  execSync(
    `
    echo "DROP DATABASE IF EXISTS ${REPORTING_SCHEMA};
    CREATE DATABASE ${REPORTING_SCHEMA};"
    | npx prisma db execute --url="${DATABASE_URL}"
    `,
    { stdio: "inherit" }
  );

  execSync(
    `
    npx prisma db push \
      --schema=prisma/schema.prisma \
      --accept-data-loss \
      --url="${DATABASE_URL}/${REPORTING_SCHEMA}"
    `,
    { stdio: "inherit" }
  );
}

// dijalankan SEKALI saat file di-import
bootstrapReportingSchema();

export const reportingPrisma = new PrismaClient({
  datasources: {
    db: {
      url: `${DATABASE_URL}/${REPORTING_SCHEMA}`,
    },
  },
});
