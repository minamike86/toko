import { describe, expect, it } from "vitest";
import fs from "node:fs";
import path from "node:path";

function collectTypeScriptFiles(dir: string): string[] {
  if (!fs.existsSync(dir)) {
    return [];
  }

  const entries = fs.readdirSync(dir, { withFileTypes: true });
  const files: string[] = [];

  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);

    if (entry.isDirectory()) {
      files.push(...collectTypeScriptFiles(fullPath));
      continue;
    }

    if (
      entry.isFile() &&
      (fullPath.endsWith(".ts") || fullPath.endsWith(".tsx")) &&
      !fullPath.endsWith(".test.ts") &&
      !fullPath.endsWith(".integration.test.ts")
    ) {
      files.push(fullPath);
    }
  }

  return files;
}

describe("procurement boundary", () => {
  const procurementRoot = path.resolve("src/modules/procurement");
  const files = collectTypeScriptFiles(procurementRoot);

  it("does not import inventory infrastructure directly", () => {
    for (const file of files) {
      const content = fs.readFileSync(file, "utf8");

      expect(content).not.toMatch(
        /@\/modules\/inventory\/infrastructure\//,
      );
    }
  });

  it("does not import sales mutation use cases", () => {
    for (const file of files) {
      const content = fs.readFileSync(file, "utf8");

      expect(content).not.toMatch(/@\/modules\/sales\/application\//);
    }
  });

  it("does not depend on inventory port in batch 1", () => {
    for (const file of files) {
      const content = fs.readFileSync(file, "utf8");

      expect(content).not.toMatch(/InventoryProcurementPort/);
    }
  });

  it("does not define receive purchase order use case in batch 1", () => {
    for (const file of files) {
      const content = fs.readFileSync(file, "utf8");

      expect(content).not.toMatch(/class\s+ReceivePurchaseOrder/);
    }
  });
});