import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

type RuleCheck = {
  name: string;
  files: string[];
  violations: string[];
};

const PROJECT_ROOT = process.cwd();
const SRC_ROOT = path.join(PROJECT_ROOT, "src");

const INCLUDED_EXTENSIONS = new Set([".ts", ".tsx"]);
const EXCLUDED_PATH_PATTERNS = [
  `${path.sep}tests${path.sep}`,
  `${path.sep}__tests__${path.sep}`,
  ".test.",
  ".spec.",
];

const PRODUCTION_ROOTS = [
  path.join(SRC_ROOT, "app"),
  path.join(SRC_ROOT, "modules"),
  path.join(SRC_ROOT, "shared"),
  path.join(SRC_ROOT, "wiring"),
];

const PRODUCTION_USE_CASE_NAMES = [
  "CreateOrder",
  "CancelOrder",
  "PayCredit",
  "ReceiveStock",
  "AdjustStock",
  "IssueStock",
  "CheckInventoryConsistency",
  "CreatePurchaseOrder",
  "CancelPurchaseOrder",
  "ReceivePurchaseOrder",
  "CreateSupplier",
  "UpdateSupplierStatus",
] as const;

const SHARED_PRISMA_IMPORT_PATTERN = /from\s+["'][^"']*(?:@\/shared\/prisma|src\/shared\/prisma|shared\/prisma)["']/;
const RAW_PRISMA_IMPORT_PATTERN = /from\s+["']@prisma\/client["']/;
const ANY_PRISMA_IMPORT_PATTERN = /(from\s+["']@prisma\/client["'])|(from\s+["'][^"']*(?:@\/shared\/prisma|src\/shared\/prisma|shared\/prisma)["'])/;

function normalizePath(filePath: string): string {
  return filePath.split(path.sep).join("/");
}

function isIncludedFile(filePath: string): boolean {
  const extension = path.extname(filePath);
  if (!INCLUDED_EXTENSIONS.has(extension)) {
    return false;
  }

  return !EXCLUDED_PATH_PATTERNS.some((pattern) => filePath.includes(pattern));
}

function walkFiles(dirPath: string): string[] {
  if (!fs.existsSync(dirPath)) {
    return [];
  }

  const entries = fs.readdirSync(dirPath, { withFileTypes: true });
  const results: string[] = [];

  for (const entry of entries) {
    const fullPath = path.join(dirPath, entry.name);

    if (entry.isDirectory()) {
      results.push(...walkFiles(fullPath));
      continue;
    }

    if (entry.isFile() && isIncludedFile(fullPath)) {
      results.push(fullPath);
    }
  }

  return results;
}

function listProductionFiles(): string[] {
  return PRODUCTION_ROOTS.flatMap((root) => walkFiles(root));
}

function filesUnder(relativePattern: RegExp): string[] {
  return listProductionFiles().filter((filePath) => {
    return relativePattern.test(normalizePath(path.relative(PROJECT_ROOT, filePath)));
  });
}

function readSource(filePath: string): string {
  return fs.readFileSync(filePath, "utf8");
}

function findImports(source: string): string[] {
  const imports = Array.from(source.matchAll(/import\s+[^;]*?from\s+["']([^"']+)["']/g));
  return imports.map((match) => match[1]);
}

function findRegexViolations(files: string[], regex: RegExp): string[] {
  return files
    .filter((filePath) => regex.test(readSource(filePath)))
    .map((filePath) => normalizePath(path.relative(PROJECT_ROOT, filePath)));
}

function findImportViolations(files: string[], importPattern: RegExp): string[] {
  return files
    .filter((filePath) => {
      const imports = findImports(readSource(filePath));
      return imports.some((importSource) => importPattern.test(importSource));
    })
    .map((filePath) => normalizePath(path.relative(PROJECT_ROOT, filePath)));
}

function findImportLineViolations(files: string[], importPattern: RegExp): string[] {
  return files
    .filter((filePath) => {
      const source = readSource(filePath);
      return source
        .split("\n")
        .some((line) => line.trim().startsWith("import ") && importPattern.test(line));
    })
    .map((filePath) => normalizePath(path.relative(PROJECT_ROOT, filePath)));
}

function expectNoViolations(rule: RuleCheck): void {
  expect(
    rule.violations,
    `${rule.name}\nViolations:\n${rule.violations.join("\n")}`,
  ).toEqual([]);
}

function expectFileExists(relativePath: string): void {
  const fullPath = path.join(PROJECT_ROOT, relativePath);
  expect(fs.existsSync(fullPath), `Missing required file: ${relativePath}`).toBe(true);
}

describe("dependency wiring and boundary architecture", () => {
  describe("Rule Group A - Prisma boundary", () => {
    it("A1: application layer must not instantiate PrismaClient", () => {
      const files = filesUnder(/^src\/modules\/[^/]+\/application\//);
      const violations = findRegexViolations(files, /new\s+PrismaClient\s*\(/g);

      expectNoViolations({
        name: "Application layer must not instantiate PrismaClient",
        files,
        violations,
      });
    });

    it("A2: domain layer must not instantiate PrismaClient", () => {
      const files = filesUnder(/^src\/modules\/[^/]+\/domain\//);
      const violations = findRegexViolations(files, /new\s+PrismaClient\s*\(/g);

      expectNoViolations({
        name: "Domain layer must not instantiate PrismaClient",
        files,
        violations,
      });
    });

    it("A3: UI and HTTP layer must not instantiate PrismaClient", () => {
      const files = filesUnder(/^src\/app\//);
      const violations = findRegexViolations(files, /new\s+PrismaClient\s*\(/g);

      expectNoViolations({
        name: "UI / HTTP layer must not instantiate PrismaClient",
        files,
        violations,
      });
    });

    it("A4: forbidden layers must not import raw Prisma or shared Prisma client", () => {
      const files = [
        ...filesUnder(/^src\/modules\/[^/]+\/application\//),
        ...filesUnder(/^src\/modules\/[^/]+\/domain\//),
        ...filesUnder(/^src\/app\//),
      ];
      const violations = findImportLineViolations(files, ANY_PRISMA_IMPORT_PATTERN);

      expectNoViolations({
        name: "Forbidden layers must not import raw Prisma or shared Prisma client",
        files,
        violations,
      });
    });
  });

  describe("Rule Group B - repository and dependency boundary", () => {
    it("B1: application layer must not instantiate Prisma repository implementations", () => {
      const files = filesUnder(/^src\/modules\/[^/]+\/application\//);
      const violations = findRegexViolations(files, /new\s+Prisma\w*Repository\s*\(/g);

      expectNoViolations({
        name: "Application layer must not instantiate Prisma repository implementations",
        files,
        violations,
      });
    });

    it("B2: application layer must not import infrastructure implementations", () => {
      const files = filesUnder(/^src\/modules\/[^/]+\/application\//);
      const violations = findImportViolations(files, /\/infrastructure\//);

      expectNoViolations({
        name: "Application layer must not import infrastructure implementations",
        files,
        violations,
      });
    });

    it("B3: UI and HTTP layer must not import infrastructure implementations", () => {
      const files = filesUnder(/^src\/app\//);
      const violations = findImportViolations(files, /modules\/[^/]+\/infrastructure\//);

      expectNoViolations({
        name: "UI / HTTP layer must not import infrastructure implementations",
        files,
        violations,
      });
    });
  });

  describe("Rule Group C - use case and container discipline", () => {
    it("C1: UI and HTTP layer must not instantiate production use cases directly", () => {
      const files = filesUnder(/^src\/app\//);
      const useCasePattern = PRODUCTION_USE_CASE_NAMES.join("|");
      const violations = findRegexViolations(files, new RegExp(`new\\s+(${useCasePattern})\\s*\\(`, "g"));

      expectNoViolations({
        name: "UI / HTTP layer must not instantiate production use cases directly",
        files,
        violations,
      });
    });

    it("C2: UI and HTTP layer must not instantiate Prisma repositories directly", () => {
      const files = filesUnder(/^src\/app\//);
      const violations = findRegexViolations(files, /new\s+Prisma\w*Repository\s*\(/g);

      expectNoViolations({
        name: "UI / HTTP layer must not instantiate Prisma repositories directly",
        files,
        violations,
      });
    });

    it("C3: canonical container must exist as the composition root", () => {
      expectFileExists("src/wiring/container.ts");
    });

    it("C4: container may instantiate repositories and use cases", () => {
      const containerPath = path.join(PROJECT_ROOT, "src/wiring/container.ts");
      const source = readSource(containerPath);

      expect(source).toMatch(/new\s+Prisma\w*Repository\s*\(/);
      expect(source).toMatch(/new\s+\w+\s*\(/);
    });

    it("C5: production wiring instantiation should be centralized in container", () => {
      const files = listProductionFiles().filter((filePath) => {
        const relative = normalizePath(path.relative(PROJECT_ROOT, filePath));
        return relative !== "src/wiring/container.ts";
      });

      const violations = findRegexViolations(
        files,
        new RegExp(
          `new\\s+(Prisma\\w*Repository|${PRODUCTION_USE_CASE_NAMES.join("|")})\\s*\\(`,
          "g",
        ),
      );

      expectNoViolations({
        name: "Production wiring instantiation should be centralized in container",
        files,
        violations,
      });
    });
  });

  describe("Rule Group D - cross module boundary", () => {
    it("D1: sales application must not import inventory infrastructure directly", () => {
      const files = filesUnder(/^src\/modules\/sales\/application\//);
      const violations = findImportViolations(files, /modules\/inventory\/infrastructure\//);

      expectNoViolations({
        name: "Sales application must not import inventory infrastructure directly",
        files,
        violations,
      });
    });

    it("D2: procurement application must not import inventory infrastructure directly", () => {
      const files = filesUnder(/^src\/modules\/procurement\/application\//);
      const violations = findImportViolations(files, /modules\/inventory\/infrastructure\//);

      expectNoViolations({
        name: "Procurement application must not import inventory infrastructure directly",
        files,
        violations,
      });
    });

    it("D3: dashboard must not import write-side infrastructure directly", () => {
      const files = filesUnder(/^src\/modules\/dashboard\//);
      const violations = findImportViolations(files, /modules\/(sales|inventory|procurement)\/infrastructure\//);

      expectNoViolations({
        name: "Dashboard must not import write-side infrastructure directly",
        files,
        violations,
      });
    });

    it("D4: reporting must not import write-side infrastructure directly", () => {
      const files = filesUnder(/^src\/modules\/reporting\//);
      const violations = findImportViolations(files, /modules\/(sales|inventory|procurement)\/infrastructure\//);

      expectNoViolations({
        name: "Reporting must not import write-side infrastructure directly",
        files,
        violations,
      });
    });
  });

  describe("Rule Group E - reporting boundary", () => {
    it("E1: reporting must not import domain modules", () => {
      const files = filesUnder(/^src\/modules\/reporting\//);
      const violations = findImportViolations(files, /modules\/[^/]+\/domain\//);

      expectNoViolations({
        name: "Reporting must not import domain modules",
        files,
        violations,
      });
    });

    it("E2: reporting must not import mutation application modules", () => {
      const files = filesUnder(/^src\/modules\/reporting\//);
      const violations = findImportViolations(files, /modules\/(sales|inventory|procurement)\/application\//);

      expectNoViolations({
        name: "Reporting must not import mutation application modules",
        files,
        violations,
      });
    });

    it("E3: reporting application and dto must not import raw Prisma or shared Prisma client", () => {
      const files = [
        ...filesUnder(/^src\/modules\/reporting\/application\//),
        ...filesUnder(/^src\/modules\/reporting\/dto\//),
      ];
      const violations = findImportLineViolations(files, ANY_PRISMA_IMPORT_PATTERN);

      expectNoViolations({
        name: "Reporting application and dto must not import raw Prisma or shared Prisma client",
        files,
        violations,
      });
    });

    it("E4: reporting queries must not instantiate PrismaClient directly", () => {
      const files = filesUnder(/^src\/modules\/reporting\/queries\//);
      const violations = findRegexViolations(files, /new\s+PrismaClient\s*\(/g);

      expectNoViolations({
        name: "Reporting queries must not instantiate PrismaClient directly",
        files,
        violations,
      });
    });

    it("E5: reporting queries must not import raw Prisma client directly", () => {
      const files = filesUnder(/^src\/modules\/reporting\/queries\//);
      const violations = findImportLineViolations(files, RAW_PRISMA_IMPORT_PATTERN);

      expectNoViolations({
        name: "Reporting queries must not import raw Prisma client directly",
        files,
        violations,
      });
    });

    it("E6: reporting queries must use the designated shared Prisma client", () => {
      const files = filesUnder(/^src\/modules\/reporting\/queries\//);
      const violations = files
        .filter((filePath) => {
          const source = readSource(filePath);
          const imports = source
            .split("\n")
            .filter((line) => line.trim().startsWith("import "));
          const importsSharedPrisma = imports.some((line) => SHARED_PRISMA_IMPORT_PATTERN.test(line));
          return !importsSharedPrisma;
        })
        .map((filePath) => normalizePath(path.relative(PROJECT_ROOT, filePath)));

      expectNoViolations({
        name: "Reporting queries must use the designated shared Prisma client",
        files,
        violations,
      });
    });

    it("E7: reporting must not contain a domain folder", () => {
      const reportingDomainDir = path.join(PROJECT_ROOT, "src/modules/reporting/domain");
      expect(fs.existsSync(reportingDomainDir), "Reporting module must not contain a domain folder").toBe(false);
    });

    it("E8: reporting DTO must not import domain types", () => {
      const files = filesUnder(/^src\/modules\/reporting\/dto\//);
      const violations = findImportViolations(files, /modules\/[^/]+\/domain\//);

      expectNoViolations({
        name: "Reporting DTO must not import domain types",
        files,
        violations,
      });
    });
  });
});
