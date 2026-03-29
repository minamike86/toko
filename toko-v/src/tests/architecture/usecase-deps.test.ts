import { it, expect, vi } from "vitest";
import { AdjustStock } from "@/modules/inventory/application/AdjustStock";
import { InventoryRepository } from "@/modules/inventory/domain/InventoryRepository";
import { InventoryItem } from "@/modules/inventory/domain/InventoryItem";

it("AdjustStock uses inventoryRepo to adjust stock by variantId", async () => {
  const inventoryItem = InventoryItem.of(100);

  const inventoryRepo: InventoryRepository = {
    findByVariantId: vi.fn().mockResolvedValue(inventoryItem),
    listMovementsByVariantId: vi.fn().mockResolvedValue([]),
    increaseByVariantId: vi.fn(),
    decreaseByVariantId: vi.fn(),
    saveMovement: vi.fn(),
  };

  const useCase = new AdjustStock({ inventoryRepo });

  await useCase.execute({
    variantId: "V001",
    newQuantity: 110,
    reason: "STOCK_OPNAME",
  });

  expect(inventoryRepo.findByVariantId).toHaveBeenCalledWith("V001");
  expect(inventoryRepo.increaseByVariantId).toHaveBeenCalledWith("V001", 10);
  expect(inventoryRepo.decreaseByVariantId).not.toHaveBeenCalled();
  expect(inventoryRepo.saveMovement).toHaveBeenCalled();
});