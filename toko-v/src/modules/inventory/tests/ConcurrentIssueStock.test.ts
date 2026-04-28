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
    if (!item) {
      throw new Error("Inventory item not found");
    }

    if (!item.canFulfill(quantity)) {
      throw new Error("Insufficient stock");
    }

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

describe("Concurrent IssueStock", () => {
  it("allows only one order to consume stock when two orders compete", async () => {
    const repo = new InMemoryInventoryRepository([
      { variantId: "V001", quantity: 5 },
    ]);

    const issueStock = new IssueStock({ inventoryRepo: repo });

    const [r1, r2] = await Promise.allSettled([
      issueStock.execute([
        {
          variantId: "V001",
          quantity: 5,
          reason: "SALE_ORDER",
          referenceId: "ORD-1",
        },
      ]),
      issueStock.execute([
        {
          variantId: "V001",
          quantity: 5,
          reason: "SALE_ORDER",
          referenceId: "ORD-2",
        },
      ]),
    ]);

    const fulfilled = [r1, r2].filter((r) => r.status === "fulfilled");
    const rejected = [r1, r2].filter((r) => r.status === "rejected");

    expect(fulfilled).toHaveLength(1);
    expect(rejected).toHaveLength(1);
    expect(repo.getItem("V001")!.getQuantity()).toBe(0);
    expect(repo.getMovements()).toHaveLength(1);
  });
});