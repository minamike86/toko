// tests/architecture/repository-contract.test.ts
import { describe, it, expectTypeOf } from "vitest";
import { InventoryRepository } from "@/modules/inventory/domain/InventoryRepository";
import { InventoryItem } from "@/modules/inventory/domain/InventoryItem";

describe("InventoryRepository contract", () => {
  it("findByVariantId returns InventoryItem | null", async () => {
    type FindReturn = Awaited<
      ReturnType<InventoryRepository["findByVariantId"]>
    >;

    expectTypeOf<FindReturn>().toEqualTypeOf<InventoryItem | null>();
  });
});