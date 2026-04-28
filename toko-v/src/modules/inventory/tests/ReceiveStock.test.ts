import { describe, expect, it, vi } from "vitest";
import { ReceiveStock } from "@/modules/inventory/application/ReceiveStock";
import { InventoryItem } from "@/modules/inventory/domain/InventoryItem";
import { StockMovement } from "@/modules/inventory/domain/StockMovement";
import type { InventoryRepository } from "@/modules/inventory/domain/InventoryRepository";

describe("ReceiveStock", () => {
  const warehouseActor = {
    actorId: "warehouse-1",
    role: "WAREHOUSE" as const,
  };

  it("records stock movement when receive stock succeeds", async () => {
    const inventoryRepo: InventoryRepository = {
      findByVariantId: vi.fn().mockResolvedValue(InventoryItem.of(5)),
      increaseByVariantId: vi.fn().mockResolvedValue(undefined),
      decreaseByVariantId: vi.fn().mockResolvedValue(undefined),
      saveMovement: vi.fn().mockResolvedValue(undefined),
      listMovementsByVariantId: vi.fn().mockResolvedValue([]),
    };

    const useCase = new ReceiveStock({ inventoryRepo });

    await useCase.execute(
      {
        variantId: "var-1",
        quantity: 10,
        reason: "PROCUREMENT_RECEIVE",
        referenceId: "po-1",
      },
      warehouseActor,
    );

    expect(inventoryRepo.findByVariantId).toHaveBeenCalledWith("var-1");
    expect(inventoryRepo.increaseByVariantId).toHaveBeenCalledWith("var-1", 10);
    expect(inventoryRepo.saveMovement).toHaveBeenCalledTimes(1);

    const savedMovement = vi.mocked(inventoryRepo.saveMovement).mock.calls[0][0];
    expect(savedMovement).toBeInstanceOf(StockMovement);
    expect(savedMovement.variantId).toBe("var-1");
    expect(savedMovement.type).toBe("IN");
    expect(savedMovement.quantity).toBe(10);
    expect(savedMovement.reason).toBe("PROCUREMENT_RECEIVE");
    expect(savedMovement.referenceId).toBe("po-1");
    expect(savedMovement.origin).toBe("PURCHASE");
  });

  it("rejects invalid quantity", async () => {
    const inventoryRepo: InventoryRepository = {
      findByVariantId: vi.fn(),
      increaseByVariantId: vi.fn().mockResolvedValue(undefined),
      decreaseByVariantId: vi.fn().mockResolvedValue(undefined),
      saveMovement: vi.fn().mockResolvedValue(undefined),
      listMovementsByVariantId: vi.fn().mockResolvedValue([]),
    };

    const useCase = new ReceiveStock({ inventoryRepo });

    await expect(
      useCase.execute(
        {
          variantId: "var-1",
          quantity: 0,
          reason: "PROCUREMENT_RECEIVE",
          referenceId: "po-1",
        },
        warehouseActor,
      ),
    ).rejects.toMatchObject({
      name: "InvalidQuantityError",
    });

    expect(inventoryRepo.findByVariantId).not.toHaveBeenCalled();
    expect(inventoryRepo.increaseByVariantId).not.toHaveBeenCalled();
    expect(inventoryRepo.saveMovement).not.toHaveBeenCalled();
  });

  it("rejects when inventory is not found", async () => {
    const inventoryRepo: InventoryRepository = {
      findByVariantId: vi.fn().mockResolvedValue(null),
      increaseByVariantId: vi.fn().mockResolvedValue(undefined),
      decreaseByVariantId: vi.fn().mockResolvedValue(undefined),
      saveMovement: vi.fn().mockResolvedValue(undefined),
      listMovementsByVariantId: vi.fn().mockResolvedValue([]),
    };

    const useCase = new ReceiveStock({ inventoryRepo });

    await expect(
      useCase.execute(
        {
          variantId: "var-404",
          quantity: 3,
          reason: "PROCUREMENT_RECEIVE",
          referenceId: "po-1",
        },
        warehouseActor,
      ),
    ).rejects.toMatchObject({
      name: "InventoryNotFoundError",
    });

    expect(inventoryRepo.increaseByVariantId).not.toHaveBeenCalled();
    expect(inventoryRepo.saveMovement).not.toHaveBeenCalled();
  });
});