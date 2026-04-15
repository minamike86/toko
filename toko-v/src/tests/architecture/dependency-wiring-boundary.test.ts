import fs from "node:fs";
import path from "node:path";
import { describe, it, expect } from "vitest";

const PROJECT_ROOT = process.cwd();
const SRC_ROOT = path.join(PROJECT_ROOT, "src");

const PRODUCTION_EXTENSIONS = new Set([".ts", ".tsx"]);
const TEST_FILE_PATTERN = /\.(test|spec)\.tsx?$/;

function isProductionSourceFile(filePath: string): boolean {
  const ext = path.extname(filePath);
  if (!PRODUCTION_EXTENSIONS.has(ext)) return false;

  const normalized = filePath.replace(/\\/g, "/");

  if (TEST_FILE_PATTERN.test(normalized)) return false;
  if (normalized.includes("/__tests__/")) return false;
  if (normalized.includes("/tests/")) return false;

  return true;
}

function walkFiles(dirPath: string): string[] {
  if (!fs.existsSync(dirPath)) return [];

  const entries = fs.readdirSync(dirPath, { withFileTypes: true });
  const results: string[] = [];

  for (const entry of entries) {
    const fullPath = path.join(dirPath, entry.name);

    if (entry.isDirectory()) {
      results.push(...walkFiles(fullPath));
      continue;
    }

    if (entry.isFile() && isProductionSourceFile(fullPath)) {
      results.push(fullPath);
    }
  }

  return results;
}

function normalizeForMatch(filePath: string): string {
  return filePath.replace(/\\/g, "/");
}

function readFile(filePath: string): string {
  return fs.readFileSync(filePath, "utf8");
}

function filesUnder(relativeDir: string): string[] {
  return walkFiles(path.join(PROJECT_ROOT, relativeDir));
}

function expectNoRegexMatch(
  files: string[],
  regex: RegExp,
  message: string,
): void {
  const offenders: string[] = [];

  for (const filePath of files) {
    const content = readFile(filePath);
    if (regex.test(content)) {
      offenders.push(normalizeForMatch(path.relative(PROJECT_ROOT, filePath)));
    }
    regex.lastIndex = 0;
  }

  expect(
    offenders,
    `${message}\n\nOffending files:\n${offenders.join("\n") || "(none)"}`,
  ).toEqual([]);
}

function findImports(content: string): string[] {
  const imports: string[] = [];

  const importFromRegex =
    /import\s+(?:type\s+)?(?:[\s\S]*?)\s+from\s+["']([^"']+)["']/g;
  const sideEffectImportRegex = /import\s+["']([^"']+)["']/g;

  for (const match of content.matchAll(importFromRegex)) {
    imports.push(match[1]);
  }

  for (const match of content.matchAll(sideEffectImportRegex)) {
    imports.push(match[1]);
  }

  return imports;
}

function expectNoImportMatch(
  files: string[],
  isForbiddenImport: (importSource: string, filePath: string) => boolean,
  message: string,
): void {
  const offenders: string[] = [];

  for (const filePath of files) {
    const imports = findImports(readFile(filePath));
    const relativeFile = normalizeForMatch(path.relative(PROJECT_ROOT, filePath));

    for (const importSource of imports) {
      if (isForbiddenImport(importSource, relativeFile)) {
        offenders.push(`${relativeFile} -> ${importSource}`);
      }
    }
  }

  expect(
    offenders,
    `${message}\n\nOffending imports:\n${offenders.join("\n") || "(none)"}`,
  ).toEqual([]);
}

function isInfrastructureImport(importSource: string): boolean {
  return (
    importSource.includes("/infrastructure/") ||
    importSource.includes("/infrastructure") ||
    importSource.includes("Prisma") ||
    importSource.includes("Repository")
  );
}

function isCrossModuleInfrastructureImport(
  importSource: string,
  targetModule: string,
): boolean {
  return (
    importSource.includes(`/modules/${targetModule}/infrastructure/`) ||
    importSource.includes(`@/modules/${targetModule}/infrastructure/`)
  );
}

describe("dependency-wiring-boundary", () => {
  describe("Prisma instantiation boundary", () => {
    it("application layer must not instantiate PrismaClient", () => {
      const files = filesUnder("src/modules");
      const applicationFiles = files.filter((filePath) =>
        normalizeForMatch(filePath).includes("/application/"),
      );

      expectNoRegexMatch(
        applicationFiles,
        /\bnew\s+PrismaClient\s*\(/g,
        "Application layer must not instantiate PrismaClient",
      );
    });

    it("domain layer must not instantiate PrismaClient", () => {
      const files = filesUnder("src/modules");
      const domainFiles = files.filter((filePath) =>
        normalizeForMatch(filePath).includes("/domain/"),
      );

      expectNoRegexMatch(
        domainFiles,
        /\bnew\s+PrismaClient\s*\(/g,
        "Domain layer must not instantiate PrismaClient",
      );
    });

    it("UI / HTTP layer must not instantiate PrismaClient", () => {
      const files = filesUnder("src/app");

      expectNoRegexMatch(
        files,
        /\bnew\s+PrismaClient\s*\(/g,
        "UI / HTTP layer must not instantiate PrismaClient",
      );
    });
  });

  describe("repository implementation boundary", () => {
    it("application layer must not instantiate Prisma repository implementations", () => {
      const files = filesUnder("src/modules").filter((filePath) =>
        normalizeForMatch(filePath).includes("/application/"),
      );

      expectNoRegexMatch(
        files,
        /\bnew\s+Prisma[A-Za-z0-9_]*Repository\s*\(/g,
        "Application layer must not instantiate Prisma repository implementations",
      );
    });

    it("application layer must not import infrastructure implementations", () => {
      const files = filesUnder("src/modules").filter((filePath) =>
        normalizeForMatch(filePath).includes("/application/"),
      );

      expectNoImportMatch(
        files,
        (importSource) => importSource.includes("/infrastructure/"),
        "Application layer must not depend on infrastructure implementations",
      );
    });
  });

  describe("UI / HTTP anti-bypass rules", () => {
    it("UI / HTTP layer must not import infrastructure implementations directly", () => {
      const files = filesUnder("src/app");

      expectNoImportMatch(
        files,
        (importSource) => importSource.includes("/infrastructure/"),
        "UI / HTTP layer must not import infrastructure implementations directly",
      );
    });

    it("UI / HTTP layer must not instantiate production use cases directly", () => {
      const files = filesUnder("src/app");

      expectNoRegexMatch(
        files,
        /\bnew\s+(CreateOrder|CancelOrder|PayCredit|ReceiveStock|AdjustStock|IssueStock|CheckInventoryConsistency|CreatePurchaseOrder|CancelPurchaseOrder|ReceivePurchaseOrder|CreateSupplier|UpdateSupplierStatus)\s*\(/g,
        "UI / HTTP layer must use pre-wired use cases, not instantiate them directly",
      );
    });

    it("UI / HTTP layer must not instantiate Prisma repositories directly", () => {
      const files = filesUnder("src/app");

      expectNoRegexMatch(
        files,
        /\bnew\s+Prisma[A-Za-z0-9_]*Repository\s*\(/g,
        "UI / HTTP layer must not instantiate Prisma repositories directly",
      );
    });
  });

  describe("cross-module infrastructure bypass", () => {
    it("sales application must not import inventory infrastructure directly", () => {
      const files = filesUnder("src/modules/sales/application");

      expectNoImportMatch(
        files,
        (importSource) => isCrossModuleInfrastructureImport(importSource, "inventory"),
        "Sales application must not depend directly on Inventory infrastructure",
      );
    });

    it("procurement application must not import inventory infrastructure directly", () => {
      const files = filesUnder("src/modules/procurement/application");

      expectNoImportMatch(
        files,
        (importSource) => isCrossModuleInfrastructureImport(importSource, "inventory"),
        "Procurement application must not depend directly on Inventory infrastructure",
      );
    });

    it("dashboard must not import write-side infrastructure implementations", () => {
      const files = filesUnder("src/modules/dashboard");

      expectNoImportMatch(
        files,
        (importSource) =>
          isCrossModuleInfrastructureImport(importSource, "sales") ||
          isCrossModuleInfrastructureImport(importSource, "inventory") ||
          isCrossModuleInfrastructureImport(importSource, "procurement"),
        "Dashboard must not depend on write-side infrastructure implementations",
      );
    });

    it("reporting must not import write-side infrastructure implementations", () => {
      const files = filesUnder("src/modules/reporting");

      expectNoImportMatch(
        files,
        (importSource) =>
          isCrossModuleInfrastructureImport(importSource, "sales") ||
          isCrossModuleInfrastructureImport(importSource, "inventory") ||
          isCrossModuleInfrastructureImport(importSource, "procurement"),
        "Reporting must not depend on write-side infrastructure implementations",
      );
    });
  });

  describe("composition root allowlist", () => {
    it("container.ts may instantiate repositories and use cases", () => {
      const containerPath = path.join(PROJECT_ROOT, "src/wiring/container.ts");
      expect(fs.existsSync(containerPath)).toBe(true);

      const content = readFile(containerPath);

      expect(content).toMatch(/\bnew\s+PrismaClient\s*\(/);
      expect(content).toMatch(/\bnew\s+Prisma[A-Za-z0-9_]*Repository\s*\(/);
    });

    it("repository/use-case instantiation should be limited to container for production wiring", () => {
      const allFiles = walkFiles(SRC_ROOT);
      const offenders: string[] = [];

      for (const filePath of allFiles) {
        const relativeFile = normalizeForMatch(path.relative(PROJECT_ROOT, filePath));

        if (relativeFile === "src/wiring/container.ts") {
          continue;
        }

        const content = readFile(filePath);

        const hasRepositoryInstantiation =
          /\bnew\s+Prisma[A-Za-z0-9_]*Repository\s*\(/.test(content);

        const hasUseCaseInstantiation =
          /\bnew\s+(CreateOrder|CancelOrder|PayCredit|ReceiveStock|AdjustStock|IssueStock|CheckInventoryConsistency|CreatePurchaseOrder|CancelPurchaseOrder|ReceivePurchaseOrder|CreateSupplier|UpdateSupplierStatus)\s*\(/.test(
            content,
          );

        if (hasRepositoryInstantiation || hasUseCaseInstantiation) {
          offenders.push(relativeFile);
        }
      }

      expect(
        offenders,
        `Production wiring instantiation should be centralized in container.ts\n\nOffending files:\n${offenders.join("\n") || "(none)"}`,
      ).toEqual([]);
    });
  });

  describe("reporting special rule", () => {
    it("reporting queries must use shared Prisma client, not direct PrismaClient instantiation", () => {
      const files = filesUnder("src/modules/reporting/queries");

      expectNoRegexMatch(
        files,
        /\bnew\s+PrismaClient\s*\(/g,
        "Reporting queries must not instantiate PrismaClient directly",
      );
    });

    it("reporting queries should import shared Prisma client", () => {
      const files = filesUnder("src/modules/reporting/queries");
      const offenders: string[] = [];

      for (const filePath of files) {
        const relativeFile = normalizeForMatch(path.relative(PROJECT_ROOT, filePath));
        const imports = findImports(readFile(filePath));

        const importsPrismaClient = imports.some(
          (source) =>
            source === "@/shared/prisma" ||
            source === "@/shared/prisma.ts" ||
            source === "../../shared/prisma" ||
            source.endsWith("/shared/prisma"),
        );

        const importsRawPrisma = imports.some(
          (source) => source === "@prisma/client",
        );

        if (importsRawPrisma || !importsPrismaClient) {
          offenders.push(relativeFile);
        }
      }

      expect(
        offenders,
        `Reporting queries must use the designated shared Prisma client\n\nOffending files:\n${offenders.join("\n") || "(none)"}`,
      ).toEqual([]);
    });
  });
});