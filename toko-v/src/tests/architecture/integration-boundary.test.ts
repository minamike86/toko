// tests/architecture/integration-boundary.test.ts
import { describe, it, expect } from "vitest";
import fs from "fs";

it("application layer does not import Prisma", () => {
  const content = fs.readFileSync(
    "src/modules/inventory/application/AdjustStock.ts",
    "utf-8"
  );

  expect(content.includes("PrismaClient")).toBe(false);
});
