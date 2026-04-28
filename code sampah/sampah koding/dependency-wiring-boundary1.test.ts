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

const APPLICATION_USE_CASE_NAMES = [
  "CreateOrder",
  "CancelOrder",
  "PayCredit",
  "ReceiveStock",
  "AdjustStock",
  "IssueStock",
  "CreatePurchaseOrder",
  "CancelPurchaseOrder",
  "ReceivePurchaseOrder",
  "CreateSupplier",
  "UpdateSupplierStatus",
] as const;

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

function walkDirectory(dirPath: string): string[] {
  if (!fs.existsSync(dirPath)) {
    return [];
  }

  const entries = fs.readdirSync(dirPath, { withFileTypes: true });
  const results: string[] = [];

  for (const entry of entries) {
    const fullPath = path.join(dirPath, entry.name);

    if (entry.isDirectory()) {
      results.push(...walkDirectory(fullPath));
      continue;
    }

    if (entry.isFile() && isIncludedFile(fullPath)) {
      results.push(fullPath);
    }
  }

  return results;
}

function collectFilesByPathPattern(pattern: RegExp): string[] {
  return PRODUCTION_ROOTS.flatMap((root) => walkDirectory(root)).filter((filePath) => {
    return pattern.test(normalizePath(path.relative(PROJECT_ROOT, filePath)));
  });
}

function readSource(filePath: string): string {
  return fs.readFileSync(filePath, "utf8");
}

function findRegexViolations(files: string[], regex: RegExp): string[] {
  return files.filter((filePath) => regex.test(readSource(filePath))).map((filePath) => {
    return normalizePath(path.relative(PROJECT_ROOT, filePath));
  });
}

function findImportViolations(files: string[], importPattern: RegExp): string[] {
  return files.filter((filePath) => {
    const source = readSource(filePath);
    return source
      .split("\n")
      .some((line) => line.trim().startsWith("import ") && importPattern.test(line));
  }).map((filePath) => normalizePath(path.relative(PROJECT_ROOT, filePath)));
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

function findFilesUnder(relativeDir: string): string[] {
  return walkDirectory(path.join(PROJECT_ROOT, relativeDir));
}

describe("dependency wiring and boundary architecture", () => {
  describe("Rule Group A - Prisma boundary", () => {
    it("A1: application layer must not instantiate PrismaClient", () => {
      const files = collectFilesByPathPattern(/^src\/modules\/[^/]+\/application\//);
      const violations = findRegexViolations(files, /new\s+PrismaClient\s*\(/g);

      expectNoViolations({
        name: "Application layer must not instantiate PrismaClient",
        files,
        violations,
      });
    });

    it("A2: domain layer must not instantiate PrismaClient", () => {
      const files = collectFilesByPathPattern(/^src\/modules\/[^/]+\/domain\//);
      const violations = findRegexViolations(files, /new\s+PrismaClient\s*\(/g);

      expectNoViolations({
        name: "Domain layer must not instantiate PrismaClient",
        files,
        violations,
      });
    });

    it("A3: UI and HTTP layer must not instantiate PrismaClient", () => {
      const files = collectFilesByPathPattern(/^src\/app\//);
      const violations = findRegexViolations(files, /new\s+PrismaClient\s*\(/g);

      expectNoViolations({
        name: "UI / HTTP layer must not instantiate PrismaClient",
        files,
        violations,
      });
    });

    it("A4: Prisma import must not appear in forbidden layers", () => {
      const files = [
        ...collectFilesByPathPattern(/^src\/modules\/[^/]+\/application\//),
        ...collectFilesByPathPattern(/^src\/modules\/[^/]+\/domain\//),
        ...collectFilesByPathPattern(/^src\/app\//),
      ];
      const violations = findImportViolations(files, /(from\s+["']@prisma\/client["'])|(from\s+["'][^"']*shared\/prisma["'])/);

      expectNoViolations({
        name: "Forbidden layers must not import Prisma or shared Prisma client",
        files,
        violations,
      });
    });
  });

  describe("Rule Group B - repository and dependency boundary", () => {
    it("B1: application layer must not instantiate repository implementations", () => {
      const files = collectFilesByPathPattern(/^src\/modules\/[^/]+\/application\//);
      const violations = findRegexViolations(files, /new\s+(Prisma\w*Repository|\w+Repository)\s*\(/g);

      expectNoViolations({
        name: "Application layer must not instantiate repository implementations",
        files,
        violations,
      });
    });

    it("B2: application layer must not import infrastructure implementations", () => {
      const files = collectFilesByPathPattern(/^src\/modules\/[^/]+\/application\//);
      const violations = findImportViolations(files, /from\s+["'][^"']*\/infrastructure\//);

      expectNoViolations({
        name: "Application layer must not import infrastructure implementations",
        files,
        violations,
      });
    });

    it("B3: UI and HTTP layer must not import infrastructure implementations", () => {
      const files = collectFilesByPathPattern(/^src\/app\//);
      const violations = findImportViolations(files, /from\s+["'][^"']*\/modules\/[^/]+\/infrastructure\//);

      expectNoViolations({
        name: "UI / HTTP layer must not import infrastructure implementations",
        files,
        violations,
      });
    });
  });

  describe("Rule Group C - use case and container discipline", () => {
    it("C1: UI and HTTP layer must not instantiate production use cases directly", () => {
      const files = collectFilesByPathPattern(/^src\/app\//);
      const useCasePattern = APPLICATION_USE_CASE_NAMES.join("|");
      const violations = findRegexViolations(files, new RegExp(`new\\s+(${useCasePattern})\\s*\\(`, "g"));

      expectNoViolations({
        name: "UI / HTTP layer must not instantiate production use cases directly",
        files,
        violations,
      });
    });

    it("C2: UI and HTTP layer must not instantiate Prisma repositories directly", () => {
      const files = collectFilesByPathPattern(/^src\/app\//);
      const violations = findRegexViolations(files, /new\s+Prisma\w*Repository\s*\(/g);

      expectNoViolations({
        name: "UI / HTTP layer must not instantiate Prisma repositories directly",
        files,
        violations,
      });
    });

    it("C3: container must exist as the valid composition root", () => {
      expectFileExists("src/wiring/container.ts");
    });
  });

  describe("Rule Group D - cross module boundary", () => {
    it("D1: sales application must not import inventory infrastructure directly", () => {
      const files = collectFilesByPathPattern(/^src\/modules\/sales\/application\//);
      const violations = findImportViolations(files, /from\s+["'][^"']*modules\/inventory\/infrastructure\//);

      expectNoViolations({
        name: "Sales application must not import inventory infrastructure directly",
        files,
        violations,
      });
    });

    it("D2: procurement application must not import inventory infrastructure directly", () => {
      const files = collectFilesByPathPattern(/^src\/modules\/procurement\/application\//);
      const violations = findImportViolations(files, /from\s+["'][^"']*modules\/inventory\/infrastructure\//);

      expectNoViolations({
        name: "Procurement application must not import inventory infrastructure directly",
        files,
        violations,
      });
    });

    it("D3: dashboard and reporting must not import write side infrastructure directly", () => {
      const files = [
        ...collectFilesByPathPattern(/^src\/modules\/dashboard\//),
        ...collectFilesByPathPattern(/^src\/modules\/reporting\//),
      ];
      const violations = findImportViolations(
        files,
        /from\s+["'][^"']*modules\/(sales|inventory|procurement)\/infrastructure\//,
      );

      expectNoViolations({
        name: "Dashboard and Reporting must not import write-side infrastructure directly",
        files,
        violations,
      });
    });
  });

  describe("Rule Group E - reporting boundary", () => {
    it("E1: reporting must not import domain modules", () => {
      const files = findFilesUnder("src/modules/reporting");
      const violations = findImportViolations(files, /from\s+["'][^"']*modules\/[^/]+\/domain\//);

      expectNoViolations({
        name: "Reporting must not import domain modules",
        files,
        violations,
      });
    });

    it("E2: reporting must not import mutation use case modules", () => {
      const files = findFilesUnder("src/modules/reporting");
      const violations = findImportViolations(files, /from\s+["'][^"']*modules\/(sales|inventory|procurement)\/application\//);

      expectNoViolations({
        name: "Reporting must not import mutation use case modules",
        files,
        violations,
      });
    });

    it("E3: Prisma usage must be restricted to reporting queries", () => {
      const forbiddenFiles = [
        ...collectFilesByPathPattern(/^src\/modules\/reporting\/application\//),
        ...collectFilesByPathPattern(/^src\/modules\/reporting\/dto\//),
      ];
      const violations = findImportViolations(
        forbiddenFiles,
        /(from\s+["']@prisma\/client["'])|(from\s+["'][^"']*shared\/prisma["'])/,
      );

      expectNoViolations({
        name: "Reporting application and dto must not import Prisma",
        files: forbiddenFiles,
        violations,
      });
    });

    it("E4: reporting must not contain a domain folder", () => {
      const reportingDomainDir = path.join(PROJECT_ROOT, "src/modules/reporting/domain");
      expect(fs.existsSync(reportingDomainDir), "Reporting module must not contain a domain folder").toBe(false);
    });

    it("E5: reporting DTO must not import domain types", () => {
      const files = collectFilesByPathPattern(/^src\/modules\/reporting\/dto\//);
      const violations = findImportViolations(files, /from\s+["'][^"']*modules\/[^/]+\/domain\//);

      expectNoViolations({
        name: "Reporting DTO must not import domain types",
        files,
        violations,
      });
    });
  });

  describe("shared safety notes", () => {
    it("documents the intended implementation approach for future refinement", () => {
      expect({
        approach: "source scanning with regex",
        future_upgrade: "AST-based detection if false positive rate becomes unacceptable",
      }).toEqual({
        approach: "source scanning with regex",
        future_upgrade: "AST-based detection if false positive rate becomes unacceptable",
      });
    });
  });
});
