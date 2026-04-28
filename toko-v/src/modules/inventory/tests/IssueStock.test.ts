import { describe, it, expect } from "vitest";

import { IssueStock } from "@/modules/inventory/application/IssueStock";
import { InventoryRepository } from "@/modules/inventory/domain/InventoryRepository";
import { InventoryItem } from "@/modules/inventory/domain/InventoryItem";
import { StockMovement } from "@/modules/inventory/domain/StockMovement";

class InMemoryInventoryRepository implements InventoryRepository {
  private readonly items = new Map<string, InventoryItem>();
  private readonly movements: StockMovement[] = [];

  constructor(initial: Array<{ variantId: string; quantity: number }>) {
    for (const s of initial) {
      this.items.set(s.variantId, InventoryItem.of(s.quantity));
    }
  }

  async findByVariantId(variantId: string): Promise<InventoryItem | null> {
    return this.items.get(variantId) ?? null;
  }

  async listMovementsByVariantId() {
    return [];
  }

  async increaseByVariantId(): Promise<void> {
    throw new Error("not used");
  }

  async decreaseByVariantId(
    variantId: string,
    quantity: number,
  ): Promise<void> {
    const item = this.items.get(variantId);
    if (!item) throw new Error("Inventory item not found");
    item.decrease(quantity);
  }

  async saveMovement(movement: StockMovement): Promise<void> {
    this.movements.push(movement);
  }

  getItem(variantId: string): InventoryItem | undefined {
    return this.items.get(variantId);
  }

  getMovements(): StockMovement[] {
    return this.movements;
  }
}

describe("IssueStock Use Case", () => {
  it("mengurangi stok dan mencatat movement OUT dengan origin LEGACY", async () => {
    const repo = new InMemoryInventoryRepository([
      { variantId: "V001", quantity: 10 },
    ]);

    const useCase = new IssueStock({ inventoryRepo: repo });

    await useCase.execute([
      {
        variantId: "V001",
        quantity: 3,
        reason: "SALE_ORDER",
        referenceId: "ORD-1",
      },
    ]);

    const item = repo.getItem("V001");
    expect(item).toBeDefined();
    expect(item!.getQuantity()).toBe(7);
    expect(repo.getMovements()).toHaveLength(1);

    const movement = repo.getMovements()[0];
    expect(movement.variantId).toBe("V001");
    expect(movement.productId).toBeNull();
    expect(movement.type).toBe("OUT");
    expect(movement.origin).toBe("LEGACY");
  });
});