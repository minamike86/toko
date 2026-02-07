// tests/architecture/usecase-deps.test.ts

import { describe, it, expect, vi } from "vitest";
import { AdjustStock } from "@/modules/inventory/application/AdjustStock";
import { InventoryRepository } from "@/modules/inventory/domain/InventoryRepository";
import { InventoryItem } from "@/modules/inventory/domain/InventoryItem";

it("AdjustStock uses inventoryRepo to adjust stock", async () => {
  const inventoryItem = InventoryItem.of("P001", 100);

  const inventoryRepo: InventoryRepository = {
    find: vi.fn().mockResolvedValue(inventoryItem),
    increase: vi.fn(),
    decrease: vi.fn(),
    saveMovement: vi.fn(),
  };

  const useCase = new AdjustStock({ inventoryRepo });

  await useCase.execute({
    productId: "P001",
    newQuantity: 10,
    reason: "STOCK_OPNAME",
  });

  expect(inventoryRepo.increase).toHaveBeenCalledWith("P001", 10);
  expect(inventoryRepo.decrease).not.toHaveBeenCalled();
  expect(inventoryRepo.saveMovement).toHaveBeenCalled();

});
