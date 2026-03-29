import { describe, it, expect } from "vitest";
import { AdjustStock } from "../application/AdjustStock";
import { InventoryRepository } from "../domain/InventoryRepository";
import { InventoryItem } from "../domain/InventoryItem";
import { StockMovement } from "../domain/StockMovement";

class InMemoryInventoryRepository implements InventoryRepository {
  public movements: StockMovement[] = [];
  private readonly item = InventoryItem.of(10);

  async findByVariantId(_variantId: string): Promise<InventoryItem | null> {
    return this.item;
  }

  async listMovementsByVariantId() {
    return [];
  }

  async increaseByVariantId(
    _variantId: string,
    quantity: number,
  ): Promise<void> {
    this.item.increase(quantity);
  }

  async decreaseByVariantId(
    _variantId: string,
    quantity: number,
  ): Promise<void> {
    this.item.decrease(quantity);
  }

  async saveMovement(movement: StockMovement): Promise<void> {
    this.movements.push(movement);
  }
}

describe("AdjustStock", () => {
  it("mencatat stock movement saat stok disesuaikan", async () => {
    const repo = new InMemoryInventoryRepository();
    const useCase = new AdjustStock({ inventoryRepo: repo });

    await useCase.execute({
      variantId: "v-1",
      newQuantity: 5,
      reason: "stock opname",
    });

    expect(repo.movements).toHaveLength(1);

    const movement = repo.movements[0];
    expect(movement.variantId).toBe("v-1");
    expect(movement.productId).toBeNull();
    expect(movement.quantity).toBe(5);
    expect(movement.reason).toBe("stock opname");
    expect(movement.type).toBe("ADJUST");
    expect(movement.origin).toBe("MANUAL_ADJUSTMENT");
  });
});