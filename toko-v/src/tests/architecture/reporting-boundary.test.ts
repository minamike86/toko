// src/tests/architecture/reporting-boundary.test.ts

import { describe, it, expect } from "vitest";
import fs from "node:fs";
import path from "node:path";

/**
 * Reporting boundary rules (MVP Step 3)
 *
 * IMPORTANT:
 * - All rules apply to RUNTIME code only.
 * - Anything under tests/** is explicitly excluded (test infra & seeding).
 */

const ROOT = process.cwd();
const SRC = path.join(ROOT, "src");
const REPORTING_DIR = path.join(SRC, "modules", "reporting");
const SHARED_PRISMA = path.join(SRC, "shared", "prisma.ts");

function normalize(p: string): string {
  return p.replace(/\\/g, "/");
}

function isTestFile(filePath: string): boolean {
  const n = normalize(filePath);
  return (
    n.includes("/tests/") ||
    n.includes("/test/") ||
    n.endsWith(".test.ts") ||
    n.endsWith(".spec.ts")
  );
}

function listFilesRecursive(dir: string): string[] {
  if (!fs.existsSync(dir)) return [];
  const out: string[] = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      out.push(...listFilesRecursive(full));
    } else {
      out.push(full);
    }
  }
  return out;
}

function scanForImports(
  files: string[],
  needles: string[]
): Array<{ filePath: string; hit: string }> {
  const hits: Array<{ filePath: string; hit: string }> = [];

  for (const filePath of files) {
    if (!filePath.endsWith(".ts") && !filePath.endsWith(".tsx")) continue;
    if (isTestFile(filePath)) continue;

    const content = fs.readFileSync(filePath, "utf8");
    for (const needle of needles) {
      if (content.includes(needle)) {
        hits.push({ filePath, hit: needle });
      }
    }
  }

  return hits;
}

function scanForWriteOps(
  files: string[]
): Array<{ filePath: string; hit: string }> {
  const writeNeedles = [
    ".create(",
    ".createMany(",
    ".update(",
    ".updateMany(",
    ".upsert(",
    ".delete(",
    ".deleteMany(",
    ".executeRaw",
    ".queryRaw",
  ];

  const hits: Array<{ filePath: string; hit: string }> = [];

  for (const filePath of files) {
    if (!filePath.endsWith(".ts") && !filePath.endsWith(".tsx")) continue;
    if (isTestFile(filePath)) continue;

    const content = fs.readFileSync(filePath, "utf8");
    for (const needle of writeNeedles) {
      if (content.includes(needle)) {
        hits.push({ filePath, hit: needle });
      }
    }
  }

  return hits;
}

describe("Reporting boundary (MVP Step 3)", () => {
  it("reporting module must exist and must not contain domain folder", () => {
    expect(fs.existsSync(REPORTING_DIR)).toBe(true);
    expect(
      fs.existsSync(path.join(REPORTING_DIR, "domain"))
    ).toBe(false);
  });

  it("shared Prisma client file must exist at src/shared/prisma.ts (Ops)", () => {
    expect(fs.existsSync(SHARED_PRISMA)).toBe(true);
  });

  it("reporting must not import domain/application modules from sales/inventory/catalog", () => {
    const files = listFilesRecursive(REPORTING_DIR);
    const hits = scanForImports(files, [
      "@/modules/sales/",
      "@/modules/inventory/",
      "@/modules/catalog/",
    ]);
    expect(hits).toEqual([]);
  });

  it("reporting must not reuse Step 1 & 2 mutation use cases (by import or identifier)", () => {
    const files = listFilesRecursive(REPORTING_DIR);
    const hits = scanForImports(files, [
      "CreateOrder",
      "CancelOrder",
      "PayCredit",
      "AdjustStock",
      "@/modules/sales/application/",
      "@/modules/inventory/application/",
    ]);
    expect(hits).toEqual([]);
  });

  it("Prisma usage rules: only reporting/queries may touch Prisma; application/dto must not import Prisma", () => {
    const files = listFilesRecursive(REPORTING_DIR);
    const hits = scanForImports(files, [
      "@prisma/client",
      "@/shared/prisma",
    ]);

    const offenders = hits.filter(({ filePath }) => {
      const n = normalize(filePath);
      if (n.includes("/modules/reporting/queries/")) return false;
      return true;
    });

    expect(offenders).toEqual([]);
  });

  it("Reporting must be read-only at runtime (tests are excluded)", () => {
    const files = listFilesRecursive(REPORTING_DIR);
    const hits = scanForWriteOps(files);
    expect(hits).toEqual([]);
  });

  it("DTOs must remain primitive-only (heuristic)", () => {
    const dtoDir = path.join(REPORTING_DIR, "dto");
    const files = listFilesRecursive(dtoDir);

    const hits = scanForImports(files, [
      "@/modules/",
      "@/shared/value-objects/",
      "@/shared/errors/",
    ]);

    expect(hits).toEqual([]);
  });
});
