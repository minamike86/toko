import { describe, it, expect } from "vitest";
import { ReceiveStock } from "@/modules/inventory/application/ReceiveStock";
import { InventoryRepository } from "@/modules/inventory/domain/InventoryRepository";
import { InventoryItem } from "@/modules/inventory/domain/InventoryItem";
import { StockMovement } from "@/modules/inventory/domain/StockMovement";

class InMemoryInventoryRepository implements InventoryRepository {
  private readonly items = new Map<string, InventoryItem>();
  private readonly movements: StockMovement[] = [];

  constructor(initial: Array<{ productId: string; quantity: number }>) {
    for (const s of initial) {
      this.items.set(
        s.productId,
        InventoryItem.of(s.productId, s.quantity)
      );
    }
  }

  async find(productId: string): Promise<InventoryItem | null> {
    return this.items.get(productId) ?? null;
  }

  async increase(productId: string, quantity: number): Promise<void> {
    const item = this.items.get(productId);
    if (!item) {
      throw new Error("Inventory item not found");
    }
    item.increase(quantity);
  }

  async decrease(productId: string, quantity: number): Promise<void> {
    const item = this.items.get(productId);
    if (!item) {
      throw new Error("Inventory item not found");
    }
    item.decrease(quantity);
  }

  async saveMovement(movement: StockMovement): Promise<void> {
    this.movements.push(movement);
  }

  getItem(productId: string): InventoryItem | undefined {
    return this.items.get(productId);
  }

  getMovements(): StockMovement[] {
    return this.movements;
  }
}

describe("ReceiveStock Use Case", () => {
  it("menambah stok dan mencatat movement IN dengan origin LEGACY", async () => {
    const repo = new InMemoryInventoryRepository([
      { productId: "P001", quantity: 10 },
    ]);

    const useCase = new ReceiveStock(repo);

    await useCase.execute([
      {
        productId: "P001",
        quantity: 3,
        reason: "RESTOCK",
        referenceId: "RCV-1",
      },
    ]);

    const item = repo.getItem("P001")!;
    expect(item.getQuantity()).toBe(13);

    const movement = repo.getMovements()[0];
    expect(repo.getMovements()).toHaveLength(1);
    expect(movement.type).toBe("IN");
    expect(movement.origin).toBe("LEGACY");
    expect(movement.referenceId).toBe("RCV-1");
  });
});