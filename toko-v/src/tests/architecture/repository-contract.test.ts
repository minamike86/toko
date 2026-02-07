// tests/architecture/repository-contract.test.ts
import { describe, it, expectTypeOf } from "vitest";
import { InventoryRepository } from "@/modules/inventory/domain/InventoryRepository";
import { InventoryItem } from "@/modules/inventory/domain/InventoryItem";

describe("InventoryRepository contract", () => {
  it("find returns InventoryItem | null", async () => {
    type FindReturn = Awaited<
      ReturnType<InventoryRepository["find"]>
    >;

    expectTypeOf<FindReturn>().toEqualTypeOf<
      InventoryItem | null
    >();
  });
});
