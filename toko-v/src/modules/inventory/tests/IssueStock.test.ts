import { describe, it, expect } from "vitest";

import { IssueStock } from "@/modules/inventory/application/IssueStock";
import { InventoryRepository } from "@/modules/inventory/domain/InventoryRepository";
import { InventoryItem } from "@/modules/inventory/domain/InventoryItem";
import { StockMovement } from "@/modules/inventory/domain/StockMovement";

import { EntityId } from "@/shared/value-objects/EntityId";



/* =========================
   In-Memory Repo (Test)
   ========================= */

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

  // helper khusus test
  getItem(productId: string): InventoryItem | undefined {
    return this.items.get(productId);
  }

  getMovements(): StockMovement[] {
    return this.movements;
  }
}

/* =========================
   Tests
   ========================= */

describe("IssueStock Use Case", () => {
  it("mengurangi stok dan mencatat movement OUT", async () => {
    const repo = new InMemoryInventoryRepository([
      { productId: "P001", quantity: 10 },
    ]);

    const useCase = new IssueStock(repo);

    await useCase.execute([
      {
        productId: "P001",
        quantity: 3,
        reason: "SALE_ORDER",
        referenceId: "ORD-1",
      },
    ]);

    const item = repo.getItem("P001")!;
    expect(item.getQuantity()).toBe(7);
    expect(repo.getMovements()).toHaveLength(1);
    expect(repo.getMovements()[0].type).toBe("OUT");
  });

  it("melempar error jika stok tidak cukup", async () => {
    const repo = new InMemoryInventoryRepository([
      { productId: "P001", quantity: 2 },
    ]);

    const useCase = new IssueStock(repo);

    await expect(
      useCase.execute([
        {
          productId: "P001",
          quantity: 5,
          reason: "SALE_ORDER",
          referenceId: "ORD-2",
        },
      ])
    ).rejects.toThrow();

    const item = repo.getItem("P001")!;
    expect(item.getQuantity()).toBe(2);
    expect(repo.getMovements()).toHaveLength(0);
  });
});
