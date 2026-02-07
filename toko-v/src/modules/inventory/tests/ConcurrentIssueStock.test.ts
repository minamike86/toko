import { describe, it, expect } from "vitest";

import { IssueStock } from "@/modules/inventory/application/IssueStock";
import { InventoryRepository } from "@/modules/inventory/domain/InventoryRepository";
import { InventoryItem } from "@/modules/inventory/domain/InventoryItem";
import { StockMovement } from "@/modules/inventory/domain/StockMovement";

/* =========================
   In-Memory Repo (Test Double)
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

    // simulasi latency untuk memicu race condition
    await new Promise((r) => setTimeout(r, 5));

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

describe("Concurrent IssueStock", () => {
  it("allows only one order to consume stock when two orders compete", async () => {
    const repo = new InMemoryInventoryRepository([
      { productId: "P001", quantity: 5 },
    ]);

    const issueStock = new IssueStock(repo);

    const requestA = issueStock.execute([
      {
        productId: "P001",
        quantity: 4,
        reason: "SALE_ORDER",
        referenceId: "ORD-A",
      },
    ]);

    const requestB = issueStock.execute([
      {
        productId: "P001",
        quantity: 4,
        reason: "SALE_ORDER",
        referenceId: "ORD-B",
      },
    ]);

    const results = await Promise.allSettled([
      requestA,
      requestB,
    ]);

    const fulfilled = results.filter(
      (r) => r.status === "fulfilled"
    );
    const rejected = results.filter(
      (r) => r.status === "rejected"
    );

    expect(fulfilled).toHaveLength(1);
    expect(rejected).toHaveLength(1);

    const item = repo.getItem("P001")!;
    expect(item.getQuantity()).toBeGreaterThanOrEqual(0);
    expect(item.getQuantity()).toBeLessThanOrEqual(1);

    expect(repo.getMovements()).toHaveLength(1);
    expect(repo.getMovements()[0].type).toBe("OUT");
  });
});
