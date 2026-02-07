import { InventoryRepository } from "../domain/InventoryRepository";
import { InventoryItem } from "../domain/InventoryItem";
import { StockMovement } from "../domain/StockMovement";
import { PositiveInt } from "@/shared/value-objects/PositiveInt";

export class InMemoryInventoryRepository implements InventoryRepository {
  private readonly items: Map<string, InventoryItem> = new Map();
  private readonly movements: StockMovement[] = [];

  async find(productId: string): Promise<InventoryItem | null> {
    return this.items.get(productId) ?? null;
  }

  async increase(productId: string, quantity: number): Promise<void> {
    const item = this.items.get(productId);

   if (!item) {
    throw new Error(`Inventory item ${productId} tidak ditemukan`)
  }

  item.increase(quantity)

   
  }

  async decrease(productId: string, quantity: number): Promise<void> {
    const item = this.items.get(productId);

    if (!item) {
      throw new Error(`Inventory item ${productId} tidak ditemukan`);
    }

    item.decrease(quantity);
  }

  async saveMovement(movement: StockMovement): Promise<void> {
    this.movements.push(movement);
  }

  // helper khusus test, bukan bagian dari interface
  getMovements(): StockMovement[] {
    return this.movements;
  }
}
