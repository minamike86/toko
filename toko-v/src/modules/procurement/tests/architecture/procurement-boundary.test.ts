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

      expect(content).not.toMatch(/@\/modules\/inventory\/infrastructure\//);
    }
  });

  it("does not import inventory repository directly", () => {
    for (const file of files) {
      const content = fs.readFileSync(file, "utf8");

      expect(content).not.toMatch(/InventoryRepository/);
    }
  });

  it("does not import sales mutation use cases", () => {
    for (const file of files) {
      const content = fs.readFileSync(file, "utf8");

      expect(content).not.toMatch(/@\/modules\/sales\/application\//);
    }
  });

  it("depends on InventoryProcurementPort for receive flow", () => {
    const content = fs.readFileSync(
      path.join(procurementRoot, "application/use-cases/ReceivePurchaseOrder.ts"),
      "utf8",
    );

    expect(content).toMatch(/InventoryProcurementPort/);
  });

  it("defines receive purchase order use case", () => {
    const content = fs.readFileSync(
      path.join(procurementRoot, "application/use-cases/ReceivePurchaseOrder.ts"),
      "utf8",
    );

    expect(content).toMatch(/class\s+ReceivePurchaseOrder/);
  });

  it("cancel flow does not import InventoryProcurementPort", () => {
    const content = fs.readFileSync(
      path.join(procurementRoot, "application/use-cases/CancelPurchaseOrder.ts"),
      "utf8",
    );

    expect(content).not.toMatch(/InventoryProcurementPort/);
  });

  it("defines cancel purchase order use case", () => {
    const content = fs.readFileSync(
      path.join(procurementRoot, "application/use-cases/CancelPurchaseOrder.ts"),
      "utf8",
    );

    expect(content).toMatch(/class\s+CancelPurchaseOrder/);
  });
});