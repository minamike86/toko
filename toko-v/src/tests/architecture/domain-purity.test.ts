// tests/architecture/domain-purity.test.ts
import { describe, it, expect } from "vitest";

// hanya untuk memastikan domain entity bisa di-import
// TANPA side effect dependency lain
describe("Domain purity", () => {
  it("InventoryItem can be imported without application layer", async () => {
    const kaos = await import( "@/modules/inventory/domain/InventoryItem");

    expect(kaos.InventoryItem).toBeDefined();
  });
});
