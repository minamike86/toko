import { describe, expect, it } from "vitest";
import fs from "node:fs";
import path from "node:path";

function read(file: string) {
  return fs.readFileSync(file, "utf8");
}

describe("procurement receive boundary", () => {
  const base = path.resolve("src/modules/procurement");

  it("does not import inventory repository directly", () => {
    const files = fs.readdirSync(base, { recursive: true }) as string[];

    for (const f of files) {
      if (!f.endsWith(".ts")) continue;
      const content = read(path.join(base, f));
      expect(content).not.toMatch(/InventoryRepository/);
    }
  });

  it("defines ReceivePurchaseOrder use case", () => {
    const content = read(
      path.join(base, "application/use-cases/ReceivePurchaseOrder.ts"),
    );
    expect(content).toMatch(/class ReceivePurchaseOrder/);
  });
});
