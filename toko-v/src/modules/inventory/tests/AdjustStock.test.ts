import { describe, it, expect } from "vitest";
import { AdjustStock } from "../application/AdjustStock";
import { InventoryRepository } from "../domain/InventoryRepository";
import { InventoryItem } from "../domain/InventoryItem";
import { StockMovement, StockMovementType } from "../domain/StockMovement";




class InMemoryInventoryRepository implements InventoryRepository {
  public movements: StockMovement[] = [];

  private item: InventoryItem;

  constructor() {
    const stub = {
      productId: "P-1",
      quantity: 10,

      adjustStock: (_movement: StockMovement): void => {
        // tidak perlu logika
      },

      canFulfill: (_qty: number): boolean => true,
      decrease: (_qty: number): void => {},
      increase: (_qty: number): void => {},
    };

    // CAST RESMI untuk test double
    this.item = stub as unknown as InventoryItem;
  }

  async find(_productId: string): Promise<InventoryItem | null> {
    return this.item;
  }

  async increase(): Promise<void> {
    return;
  }

  async decrease(): Promise<void> {
    return;
  }

  async saveMovement(movement: StockMovement): Promise<void> {
    this.movements.push(movement);
  }

  async save(): Promise<void> {
    return;
  }
}

describe("AdjustStock", () => {
  it("mencatat stock movement saat stok disesuaikan", async () => {
    const repo = new InMemoryInventoryRepository();
    const useCase = new AdjustStock({
      inventoryRepo: repo,
    });

    await useCase.execute({
      productId: "P-1",
      newQuantity: 5,
      reason: "stock opname",
    });

    expect(repo.movements).toHaveLength(1);

    const movement = repo.movements[0];
    expect(movement.productId).toBe("P-1");
    expect(movement.quantity).toBe(5);
    expect(movement.reason).toBe("stock opname");
  });
});
