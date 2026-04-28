import {
  InventoryRepository,
  StockMovementReadModel,
} from "../domain/InventoryRepository";
import { InventoryItem } from "../domain/InventoryItem";
import { StockMovement } from "../domain/StockMovement";

export class InMemoryInventoryRepository implements InventoryRepository {
  private readonly items: Map<string, InventoryItem> = new Map();
  private readonly movements: StockMovement[] = [];

  async findByVariantId(variantId: string): Promise<InventoryItem | null> {
    return this.items.get(variantId) ?? null;
  }

  async listMovementsByVariantId(
    variantId: string,
  ): Promise<ReadonlyArray<StockMovementReadModel>> {
    return this.movements
      .filter((movement) => movement.variantId === variantId)
      .map((movement) => this.toReadModel(movement))
      .sort(this.compareReadModel);
  }

  async increaseByVariantId(variantId: string, quantity: number): Promise<void> {
    const item = this.items.get(variantId);

    if (!item) {
      throw new Error(`Inventory item ${variantId} tidak ditemukan`);
    }

    item.increase(quantity);
  }

  async decreaseByVariantId(variantId: string, quantity: number): Promise<void> {
    const item = this.items.get(variantId);

    if (!item) {
      throw new Error(`Inventory item ${variantId} tidak ditemukan`);
    }

    item.decrease(quantity);
  }

  async saveMovement(movement: StockMovement): Promise<void> {
    this.movements.push(movement);
  }

  getMovements(): StockMovement[] {
    return this.movements;
  }

  seed(variantId: string, item: InventoryItem): void {
    this.items.set(variantId, item);
  }

  private toReadModel(movement: StockMovement): StockMovementReadModel {
    return {
      id: movement.id,
      productId: movement.productId ?? null,
      variantId: movement.variantId ?? null,
      type: movement.type,
      origin: movement.origin,
      quantity: movement.quantity,
      reason: movement.reason,
      referenceId: movement.referenceId ?? null,
      occurredAt: movement.occurredAt,
    };
  }

  private compareReadModel(
    left: StockMovementReadModel,
    right: StockMovementReadModel,
  ): number {
    const occurredAtComparison =
      left.occurredAt.getTime() - right.occurredAt.getTime();

    if (occurredAtComparison !== 0) {
      return occurredAtComparison;
    }

    return left.id.localeCompare(right.id);
  }
}